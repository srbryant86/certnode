#!/usr/bin/env bash
set -euo pipefail

# ship_certnode_fly.sh
# Turns a Claude monolithic .txt into a runnable repo and deploys to Fly.io.

# --- Inputs ---
SOURCE_TXT="${1:-}"
REPO_DIR="${2:-certnode}"
FLY_APP="${3:-}"     # optional; if blank we'll pick certnode-<random>
FLY_REGION="${FLY_REGION:-iad}"   # change if you want, e.g. ord, lhr, sjc
CREATE_DB="${CREATE_DB:-1}"       # set to 0 to skip Fly Postgres create/attach
CREATE_REDIS="${CREATE_REDIS:-1}" # set to 0 to skip Fly Redis create/attach

if [[ -z "${SOURCE_TXT}" ]]; then
  echo "Usage: bash $0 '/path/to/Claude - CertNode.txt' [repo_dir] [fly_app_name]"
  exit 1
fi

say() { printf "\033[1;32m==>\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m!!\033[0m %s\n" "$*"; }
err() { printf "\033[1;31mxx\033[0m %s\n" "$*"; }

# --- Checks ---
command -v python3 >/dev/null || { err "python3 is required"; exit 1; }
command -v git >/dev/null || { err "git is required"; exit 1; }
if ! command -v flyctl >/dev/null; then
  warn "flyctl not found. Install with: curl -L https://fly.io/install.sh | sh"
  warn "Then re-run this script."
  exit 1
fi

# Generate a default Fly app name if not provided
if [[ -z "${FLY_APP}" ]]; then
  SUFFIX=$(LC_ALL=C tr -dc a-z0-9 </dev/urandom | head -c 6 || true)
  FLY_APP="certnode-${SUFFIX}"
fi

# --- Step 1: Materialize repo from Claude text ---
say "Materializing repo '${REPO_DIR}' from: ${SOURCE_TXT}"
mkdir -p "${REPO_DIR}"

python3 - "$SOURCE_TXT" "$REPO_DIR" <<'PYCODE'
import os, re, sys, pathlib, json, random, string

src = sys.argv[1]
root = pathlib.Path(sys.argv[2]).resolve()
root.mkdir(parents=True, exist_ok=True)

text = pathlib.Path(src).read_text(encoding="utf-8", errors="ignore")
lines = text.splitlines()

# Recognize headers like:
#   ## apps/api/main.py
#   ## apps/api/main.py (UPDATED)
#   ### infra/Dockerfile (NEW)
#   ## `apps/api/routes.py` (NEW)
header_re = re.compile(r'^\s*#{2,}\s+`?([^`]+?)`?\s*(?:\([^)]*\))?\s*$')

current_path = None
in_code = False
code_buf = []
written = {}

def norm_path(p):
    p = p.strip()
    # sometimes Claude prefixes path with "File:" or backticks; strip them
    if p.lower().startswith("file:"):
        p = p.split(":",1)[1].strip()
    # ignore headings that are clearly not file paths
    if "/" not in p and not re.search(r'\.[a-zA-Z0-9]+$', p):
        return None
    # drop trailing labels like " (NEW)" already removed by regex
    return p

def write_file(relpath, body):
    dest = root.joinpath(relpath)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(body, encoding="utf-8")
    written[str(dest.relative_to(root))] = len(body)

fence_start_re = re.compile(r'^\s*```([\w\-\+\.]*)\s*$')
fence_end_re = re.compile(r'^\s*```\s*$')

for i, line in enumerate(lines):
    m = header_re.match(line)
    if m and not in_code:
        cand = norm_path(m.group(1))
        current_path = cand
        continue

    m = fence_start_re.match(line)
    if m and not in_code:
        in_code = True
        code_buf = []
        continue

    if in_code and fence_end_re.match(line):
        in_code = False
        if current_path and code_buf:
            write_file(current_path, "\n".join(code_buf).rstrip() + "\n")
        code_buf = []
        continue

    if in_code:
        code_buf.append(line)

# Ensure minimal viable app if nothing was found
if not written:
    # Minimal FastAPI app
    write_file("apps/api/main.py", "from fastapi import FastAPI\napp = FastAPI(title='CertNode')\n@app.get('/healthz')\ndef health(): return {'ok': True}\n")
    write_file("requirements.txt", "fastapi\nuvicorn[standard]\n")
    write_file("infra/Dockerfile", "FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8080\nCMD [\"uvicorn\",\"apps.api.main:app\",\"--host\",\"0.0.0.0\",\"--port\",\"8080\"]\n")
    write_file("fly.toml", f"app = \"certnode-{''.join(random.choice(string.ascii_lowercase+string.digits) for _ in range(6))}\"\nprimary_region = \"iad\"\n\n[http_service]\n  internal_port = 8080\n  force_https = true\n  auto_stop_machines = true\n  auto_start_machines = true\n  min_machines_running = 0\n")

# Ensure some defaults if Claude doc omitted them
if not (root / "requirements.txt").exists():
    # reasonable defaults for the project we discussed
    (root / "requirements.txt").write_text(
        "fastapi\nuvicorn[standard]\nsqlalchemy\npydantic\npydantic-settings\npython-jose[cryptography]\ncryptography\nredis\nprometheus-fastapi-instrumentator\nslowapi\npsycopg2-binary\n", encoding="utf-8"
    )
if not (root / "infra/Dockerfile").exists():
    (root / "infra").mkdir(parents=True, exist_ok=True)
    (root / "infra/Dockerfile").write_text(
        "FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8080\nCMD [\"uvicorn\",\"apps.api.main:app\",\"--host\",\"0.0.0.0\",\"--port\",\"8080\"]\n",
        encoding="utf-8"
    )
if not (root / "fly.toml").exists():
    (root / "fly.toml").write_text(
        "app = \"certnode\"\nprimary_region = \"iad\"\n\n[http_service]\n  internal_port = 8080\n  force_https = true\n  auto_stop_machines = true\n  auto_start_machines = true\n  min_machines_running = 0\n",
        encoding="utf-8"
    )

# basic .gitignore
gitignore = root / ".gitignore"
if not gitignore.exists():
    gitignore.write_text("/.venv\n__pycache__/\n*.pyc\n.env\n.fly/\n", encoding="utf-8")

print(json.dumps({"wrote": written}, indent=2))
PYCODE

say "Repo materialized."

# --- Step 2: Python env + install ---
cd "${REPO_DIR}"
if [[ ! -d ".venv" ]]; then
  say "Creating venv"
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
say "Installing requirements"
pip install --upgrade pip setuptools wheel >/dev/null
pip install -r requirements.txt >/dev/null

# Quick smoke check: health endpoint import path exists
if [[ ! -f "apps/api/main.py" ]]; then
  err "apps/api/main.py not found after materialization."
  exit 1
fi

# --- Step 3: git init + first commit (if not already) ---
if [[ ! -d ".git" ]]; then
  say "Initializing git"
  git init >/dev/null
  git add .
  git commit -m "chore: materialize certnode from Claude text" >/dev/null || true
fi

# --- Step 4: Ensure fly.toml/Dockerfile minimal sanity ---
if [[ ! -f "fly.toml" ]]; then
  warn "fly.toml missing; creating a minimal one."
  cat > fly.toml <<EOF
app = "${FLY_APP}"
primary_region = "${FLY_REGION}"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
EOF
else
  # set app if placeholder
  if ! grep -q '^app = "' fly.toml; then
    sed -i.bak "1s|^|app = \"${FLY_APP}\"\n|" fly.toml || true
  fi
fi

if [[ ! -f "infra/Dockerfile" ]]; then
  warn "infra/Dockerfile missing; creating a minimal one."
  mkdir -p infra
  cat > infra/Dockerfile <<'EOF'
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8080
CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8080"]
EOF
fi

# --- Step 5: Fly.io app create/confirm ---
say "Ensuring Fly app exists: ${FLY_APP} (region ${FLY_REGION})"
if ! flyctl apps list | grep -q "^\s*${FLY_APP}\b" ; then
  flyctl apps create "${FLY_APP}" >/dev/null
fi

# --- Step 6: Optional managed Postgres + Redis (skip by setting CREATE_DB/CREATE_REDIS=0) ---
if [[ "${CREATE_DB}" == "1" ]]; then
  say "Creating/attaching Fly Postgres (if needed)"
  if ! flyctl postgres list | grep -q "${FLY_APP}-db" ; then
    flyctl postgres create --name "${FLY_APP}-db" --region "${FLY_REGION}" --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 10 || true
  fi
  # attach sets DATABASE_URL secret on the app
  flyctl postgres attach --app "${FLY_APP}" "${FLY_APP}-db" || true
else
  warn "Skipping Postgres creation/attach (CREATE_DB=0). Ensure DATABASE_URL is set."
fi

if [[ "${CREATE_REDIS}" == "1" ]]; then
  say "Creating/attaching Fly Redis (if supported on your account)"
  if flyctl redis create --name "${FLY_APP}-redis" --region "${FLY_REGION}" 2>/dev/null; then
    flyctl redis attach --app "${FLY_APP}" "${FLY_APP}-redis" || true
  else
    warn "flyctl redis create not available. You can provision Upstash manually and set REDIS_URL."
  fi
else
  warn "Skipping Redis creation/attach (CREATE_REDIS=0). Ensure REDIS_URL is set if your app uses it."
fi

# --- Step 7: Deploy ---
say "Deploying to Fly.io (app: ${FLY_APP})"
# Use the Dockerfile in infra if present; otherwise, root Dockerfile is fine
if [[ -f "infra/Dockerfile" ]]; then
  flyctl deploy --app "${FLY_APP}" --dockerfile infra/Dockerfile
else
  flyctl deploy --app "${FLY_APP}"
fi

say "Done! App: https://${FLY_APP}.fly.dev"
echo "If Postgres/Redis were skipped, set secrets later via:"
echo "  flyctl secrets set DATABASE_URL=... REDIS_URL=... --app ${FLY_APP}"

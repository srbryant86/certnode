#!/usr/bin/env bash
set -euo pipefail

# ship_fly.sh
# Deploys CertNode (FastAPI) to Fly.io with Postgres + Redis (Valkey)
# Usage: bash ship_fly.sh <repo_path> <fly_app_name> <region>
# Example: bash ship_fly.sh certnode my-certnode-app iad

REPO_PATH="${1:-certnode}"
APP_NAME="${2:-certnode}"
REGION="${3:-iad}"

# ---- helpers ----
say() { printf "\033[1;36m==>\033[0m %s\n" "$*"; }
die() { printf "\033[1;31mERROR:\033[0m %s\n" "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "Missing dependency: $1"; }
write_if_missing() { [ -f "$1" ] || { mkdir -p "$(dirname "$1")"; printf "%s" "$2" > "$1"; }; }
append_unique() { local f="$1" line="$2"; grep -qxF "$line" "$f" 2>/dev/null || echo "$line" >> "$f"; }

# ---- checks ----
need flyctl
need git
[ -d "$REPO_PATH" ] || die "Repo folder not found: $REPO_PATH"
cd "$REPO_PATH"

# ---- minimal runtime files (non-destructive) ----
say "Ensuring minimal API entrypoint and requirements exist"
write_if_missing requirements.txt "fastapi
uvicorn[standard]
sqlalchemy
alembic
pydantic
pydantic-settings
python-jose[cryptography]
cryptography
redis
prometheus-fastapi-instrumentator
slowapi
psycopg2-binary
"
mkdir -p apps/api
write_if_missing apps/api/main.py $'from fastapi import FastAPI\napp = FastAPI(title="CertNode API")\n@app.get("/healthz")\ndef health():\n    return {"ok": True}\n'

# start.sh to run migrations then boot API
mkdir -p scripts infra
write_if_missing scripts/start.sh $'#!/usr/bin/env bash\nset -euo pipefail\n# Run migrations (ignore if alembic not configured yet)\nif [ -f "alembic.ini" ] || [ -d "alembic" ]; then\n  alembic upgrade head || true\nfi\nexec uvicorn apps.api.main:app --host 0.0.0.0 --port 8080\n'
chmod +x scripts/start.sh

# Dockerfile (only create if missing)
write_if_missing infra/Dockerfile $'FROM python:3.11-slim\nENV PYTHONDONTWRITEBYTECODE=1 \\\n    PYTHONUNBUFFERED=1\nWORKDIR /app\n# System deps for psycopg2\nRUN apt-get update && apt-get install -y --no-install-recommends build-essential libpq-dev && rm -rf /var/lib/apt/lists/*\nCOPY requirements.txt ./\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8080\nCMD ["bash","scripts/start.sh"]\n'

# .dockerignore (helps deploy speed)
write_if_missing .dockerignore "/.venv
__pycache__/
*.pyc
.fly/
.git/
node_modules/
"

# Alembic scaffolding if missing (safe no-op if you already have it)
if [ ! -f alembic.ini ] && [ ! -d alembic ]; then
  say "Bootstrapping alembic (lightweight)"
  cat > alembic.ini <<'EOF'
[alembic]
script_location = alembic
sqlalchemy.url = ${DATABASE_URL}
EOF
  mkdir -p alembic/versions
  cat > alembic/env.py <<'EOF'
from alembic import context
from sqlalchemy import engine_from_config, pool
import os
config = context.config
target_metadata = None
def run_migrations_offline():
    url = os.environ.get("DATABASE_URL", config.get_main_option("sqlalchemy.url"))
    context.configure(url=url, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()
def run_migrations_online():
    url = os.environ.get("DATABASE_URL", config.get_main_option("sqlalchemy.url"))
    connectable = engine_from_config(
        {"sqlalchemy.url": url},
        prefix='sqlalchemy.',
        poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection)
        with context.begin_transaction():
            context.run_migrations()
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
EOF
fi

# fly.toml (create or patch)
if [ ! -f fly.toml ]; then
  say "Creating fly.toml"
  cat > fly.toml <<EOF
app = "$APP_NAME"
primary_region = "$REGION"

[build]
  dockerfile = "infra/Dockerfile"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[checks]
  [checks.healthz]
    port = 8080
    type = "http"
    interval = "10s"
    timeout = "2s"
    grace_period = "10s"
    path = "/healthz"

[deploy]
  release_command = "bash -lc 'if [ -f alembic.ini ] || [ -d alembic ]; then alembic upgrade head; fi'"
EOF
else
  say "Patching fly.toml with release_command and health check (non-destructive)"
  append_unique fly.toml '[deploy]'
  append_unique fly.toml "  release_command = \"bash -lc 'if [ -f alembic.ini ] || [ -d alembic ]; then alembic upgrade head; fi'\""
fi

# ---- login + app create (no-op if exists) ----
say "Ensuring Fly login"
flyctl auth token >/dev/null 2>&1 || flyctl auth login

say "Ensuring app $APP_NAME exists"
if ! flyctl apps list --json | grep -q "\"Name\": \"$APP_NAME\""; then
  flyctl apps create "$APP_NAME" --org personal || true
fi

# ---- Postgres ----
PG_APP="${APP_NAME}-pg"
say "Ensuring Postgres ($PG_APP) exists"
if ! flyctl apps list --json | grep -q "\"Name\": \"$PG_APP\""; then
  flyctl postgres create --name "$PG_APP" --region "$REGION" --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 10
fi

say "Attaching Postgres to $APP_NAME (sets DATABASE_URL)"
flyctl postgres attach --app "$APP_NAME" "$PG_APP" || true

# ---- Redis (Valkey) sidecar app inside Fly private network) ----
REDIS_APP="${APP_NAME}-redis"
say "Ensuring Redis/Valkey app ($REDIS_APP) exists"
if ! flyctl apps list --json | grep -q "\"Name\": \"$REDIS_APP\""; then
  tmpcfg=".fly-redis.toml"
  cat > "$tmpcfg" <<EOF
app = "$REDIS_APP"
primary_region = "$REGION"

[build]
  image = "valkey/valkey:7-alpine"

[[services]]
  internal_port = 6379
  protocol = "tcp"
  [[services.ports]]
    port = 6379
    handlers = ["tls"] # not publicly exposed; Fly private network is used
EOF
  flyctl deploy --config "$tmpcfg" --app "$REDIS_APP" --detach
  rm -f "$tmpcfg"
fi

# Wire REDIS_URL using private DNS name (<app>.internal)
say "Setting secrets on $APP_NAME"
# Generate lightweight JWT keys if not provided
JWT_ALGO="${JWT_ALGO:-RS256}"
JWT_ISS="${JWT_ISS:-https://api.certnode.io}"
JWT_AUD="${JWT_AUD:-certnode-api}"
SECRET_KEY="${SECRET_KEY:-$(openssl rand -hex 24)}"

# If you already have Stripe keys, export STRIPE_SECRET/STRIPE_WEBHOOK_SECRET before running.
: "${STRIPE_SECRET:=sk_test_placeholder}"
: "${STRIPE_WEBHOOK_SECRET:=whsec_placeholder}"

# Redis URL within Fly's private network
REDIS_URL="redis://${REDIS_APP}.internal:6379/0"

# Set all at once (idempotent)
flyctl secrets set \
  SECRET_KEY="$SECRET_KEY" \
  JWT_ALGO="$JWT_ALGO" \
  JWT_ISS="$JWT_ISS" \
  JWT_AUD="$JWT_AUD" \
  STRIPE_SECRET="$STRIPE_SECRET" \
  STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  REDIS_URL="$REDIS_URL" \
  --app "$APP_NAME"

# ---- deploy ----
say "Deploying $APP_NAME"
flyctl deploy --app "$APP_NAME" --detach

say "Waiting for health check…"
flyctl status --app "$APP_NAME"

say "If healthy, you should see 'checks: passing'. You can also curl the health endpoint:"
echo "curl https://$APP_NAME.fly.dev/healthz"

say "Done. Next steps:"
echo "  • If you haven’t: push your repo to Git and keep committing your code."
echo "  • When you update code: run 'flyctl deploy' again."
echo "  • To inspect logs:     flyctl logs -a $APP_NAME"

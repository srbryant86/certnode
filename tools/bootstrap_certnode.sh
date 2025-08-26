#!/usr/bin/env bash
set -Eeuo pipefail

# -----------------------------
# CertNode Bootstrap (verbose)
# -----------------------------
# Purpose: Diagnose, heal, commit, push, and kick CI deploy.
# Behavior: Idempotent. Always prints a PASS/FAIL report.
# Requirements:
#   - git & a clean working tree (or we’ll help make it clean)
#   - GitHub remote: https://github.com/srbryant86/certnode.git
#   - gh CLI optional (for CI triggers/status). If missing, we’ll fall back to basic git push.
#   - jq, curl recommended (we’ll warn if missing)
#
# Notes:
#   - This script NEVER stores secrets. CI uses repo secrets (FLY_API_TOKEN).
#   - Fly deploys from GitHub Actions only (no local flyctl).
# -----------------------------

# === Styling ===
green() { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
red() { printf "\033[31m%s\033[0m\n" "$*"; }
blue() { printf "\033[34m%s\033[0m\n" "$*"; }
hr() { printf "\033[90m%s\033[0m\n" "────────────────────────────────────────────────────────"; }

# === Globals ===
REPO_EXPECTED_REMOTE="https://github.com/srbryant86/certnode.git"
BRANCH_EXPECTED="main"
CI_WORKFLOW_DEPLOY="deploy.yml"
CI_WORKFLOW_PROVISION="provision-domain.yml"
CI_WORKFLOW_VERIFY="verify.yml"
FLY_HEALTH_URL="https://certnode.fly.dev/healthz"
CHANGES_MADE=0
FAILURES=()

must_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    yellow "⚠ Required tool missing: $1"
    return 1
  fi
}

need_cmds=(
  git
)
opt_cmds=( gh jq curl sed awk )
blue "🔎 Preflight: tool check"
for c in "${need_cmds[@]}"; do must_cmd "$c" || FAILURES+=("Install $c"); done
for c in "${opt_cmds[@]}"; do command -v "$c" >/dev/null 2>&1 || yellow "• Optional tool not found: $c"; done
hr

# === Repo sanity ===
blue "🔎 Preflight: repo state"
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  red "❌ Not inside a git repo. Run this from the certnode repo root."
  exit 1
fi
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "HEAD")"
REMOTE_URL="$(git remote get-url origin 2>/dev/null || echo "")"
blue "• Current branch: ${CURRENT_BRANCH}"
blue "• Remote origin : ${REMOTE_URL:-<none>}"

# Fix missing/incorrect remote
if [[ -z "${REMOTE_URL}" ]]; then
  yellow "🛠 No 'origin' remote found → adding ${REPO_EXPECTED_REMOTE}"
  git remote add origin "${REPO_EXPECTED_REMOTE}" || { red "❌ Failed to add remote"; exit 1; }
  REMOTE_URL="${REPO_EXPECTED_REMOTE}"
  CHANGES_MADE=1
elif [[ "${REMOTE_URL}" != "${REPO_EXPECTED_REMOTE}" ]]; then
  yellow "🛠 Remote origin mismatch → correcting to ${REPO_EXPECTED_REMOTE}"
  git remote set-url origin "${REPO_EXPECTED_REMOTE}" || { red "❌ Failed to set remote URL"; exit 1; }
  REMOTE_URL="${REPO_EXPECTED_REMOTE}"
  CHANGES_MADE=1
fi

# Ensure we're on main (create/align if needed)
if [[ "${CURRENT_BRANCH}" != "${BRANCH_EXPECTED}" ]]; then
  yellow "🛠 Switching to '${BRANCH_EXPECTED}'"
  if git show-ref --verify --quiet "refs/heads/${BRANCH_EXPECTED}"; then
    git checkout "${BRANCH_EXPECTED}"
  else
    git checkout -b "${BRANCH_EXPECTED}"
  fi
  CURRENT_BRANCH="${BRANCH_EXPECTED}"
  CHANGES_MADE=1
fi

# Rebase to avoid non-fast-forward
yellow "↺ Rebase with remote (if exists)"
if git ls-remote --exit-code origin &>/dev/null; then
  git fetch origin || true
  if git rev-parse --verify "origin/${BRANCH_EXPECTED}" &>/dev/null; then
    git pull --rebase origin "${BRANCH_EXPECTED}" || {
      FAILURES+=("Rebase failed — resolve conflicts"); true;
    }
  fi
fi
hr

# === CRLF normalization (Dockerfile/YAML only) ===
blue "🔎 Line ending normalization (LF)"
normalize() {
  local path="$1"
  [[ -f "$path" ]] || return 0
  # Only transform if CRLF present
  if grep -Iq . "$path"; then
    if tr -d '\r' < "$path" | cmp -s - "$path"; then
      : # no CRLF found
    else
      yellow "🛠 Normalize line endings: $path"
      # safe rewrite
      tmp="${path}.tmp.$$"
      tr -d '\r' < "$path" > "$tmp" && mv "$tmp" "$path"
      CHANGES_MADE=1
    fi
  fi
}
normalize "infra/Dockerfile"
normalize ".github/workflows/deploy.yml"
normalize ".github/workflows/provision-domain.yml"
normalize ".github/workflows/verify.yml"
normalize "fly.toml"
hr

# === Required files existence check (we don’t overwrite good files) ===
blue "🔎 File presence check"
require_file() {
  local p="$1"
  local msg="$2"
  if [[ -f "$p" ]]; then
    blue "• OK: $p"
  else
    yellow "🛠 Missing → creating: $p"
    mkdir -p "$(dirname "$p")"
    cat > "$p" <<'HERE'
# placeholder
HERE
    FAILURES+=("Created placeholder for $p — re-run your content bootstrap to fill it")
    CHANGES_MADE=1
  fi
}
require_file "infra/Dockerfile" "Dockerfile"
require_file ".dockerignore" ".dockerignore"
require_file "fly.toml" "Fly config"
require_file ".github/workflows/deploy.yml" "Deploy workflow"
require_file ".github/workflows/provision-domain.yml" "Provision workflow"
require_file ".github/workflows/verify.yml" "Verify workflow"
require_file "apps/api/main.py" "FastAPI app"
require_file "requirements.txt" "Python requirements"
require_file "docs/deploy.md" "Deployment docs"
hr

# === Git status & commit (if anything changed) ===
blue "🔎 Git status"
git status --short || true
if ! git diff --quiet || ! git diff --cached --quiet; then
  yellow "🛠 Staging changes…"
  git add -A
  COMMIT_MSG="chore(bootstrap): self-heal repo (remote/branch/line-endings/files)"
  git commit -m "$COMMIT_MSG" || true
  CHANGES_MADE=1
fi

# === Push & set upstream if needed ===
blue "🔎 Push to origin"
if git ls-remote --exit-code --heads origin "${BRANCH_EXPECTED}" &>/dev/null; then
  git push origin "${BRANCH_EXPECTED}" || { FAILURES+=("git push failed"); true; }
else
  yellow "🛠 Setting upstream on first push"
  git push -u origin "${BRANCH_EXPECTED}" || { FAILURES+=("git push -u failed"); true; }
fi
hr

# === Kick CI Deploy (gh optional) ===
blue "🔎 CI (GitHub Actions) deploy trigger"
CI_URL="https://github.com/srbryant86/certnode/actions"
if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    yellow "↺ Triggering deploy workflow (${CI_WORKFLOW_DEPLOY})"
    gh workflow run "${CI_WORKFLOW_DEPLOY}" || yellow "⚠ Could not trigger via gh (maybe auto-triggered by push)"
    # Watch latest run of this workflow
    LAST_RUN_ID="$(gh run list --workflow "${CI_WORKFLOW_DEPLOY}" --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || echo "")"
    if [[ -n "${LAST_RUN_ID}" ]]; then
      yellow "👀 Watching deploy run #${LAST_RUN_ID}"
      if ! gh run watch "${LAST_RUN_ID}" --exit-status; then
        FAILURES+=("Deploy workflow failed — check logs in Actions")
        yellow "Attempting to fetch recent Fly logs via CI-only deployment (may not be available locally)."
      fi
    else
      yellow "⚠ Could not determine run id; check Actions page: ${CI_URL}"
    fi
  else
    yellow "⚠ gh not authenticated — skipping explicit trigger. Relying on push auto-trigger."
    blue  "  Open Actions page: ${CI_URL}"
  fi
else
  yellow "⚠ gh CLI not installed — skipping explicit trigger. Relying on push auto-trigger."
  blue  "  Open Actions page: ${CI_URL}"
fi
hr

# === Live health verification with backoff ===
blue "🔎 Live health check: ${FLY_HEALTH_URL}"
if command -v curl >/dev/null 2>&1; then
  ok=0; delay=5
  for i in {1..8}; do
    code="$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 8 "${FLY_HEALTH_URL}" || echo "000")"
    if [[ "${code}" == "200" ]]; then ok=1; break; fi
    yellow "• Attempt ${i}/8 → HTTP ${code}; retrying in ${delay}s…"
    sleep "${delay}"
    delay=$(( delay < 60 ? delay*2 : 60 ))
  done
  if [[ $ok -eq 1 ]]; then
    green "✅ Fly app healthy (200) at ${FLY_HEALTH_URL}"
  else
    FAILURES+=("Fly app not healthy yet (check Actions logs).")
    yellow "Tip: first deployment can take a bit; confirm the deploy job finished."
  fi
else
  yellow "⚠ curl not found — skipping live health ping."
fi
hr

# === Summary report ===
blue "📋 Bootstrap summary"
if [[ "${CHANGES_MADE}" -eq 0 ]]; then
  green "• Repo state: up-to-date (idempotent no-op)"
else
  green "• Repo state: changes were applied (healed/updated)"
fi
green "• Branch: ${CURRENT_BRANCH}"
green "• Remote: ${REMOTE_URL}"
[[ -n "${LAST_RUN_ID:-}" ]] && green "• CI run: #${LAST_RUN_ID} (see Actions)"

if ((${#FAILURES[@]})); then
  red "❌ Issues detected:"
  for f in "${FAILURES[@]}"; do red "  - $f"; done
  yellow "Open Actions: ${CI_URL}"
  exit 2
else
  green "✅ All checks passed. Nothing else to do."
  blue "Next: (optional) run certificate provisioning workflow in Actions → ${CI_WORKFLOW_PROVISION}"
fi

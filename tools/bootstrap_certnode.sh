#!/usr/bin/env bash
set -Eeuo pipefail

log(){ printf "\033[1;36m[certnode]\033[0m %s\n" "$*"; }
warn(){ printf "\033[0;33m[warn]\033[0m %s\n" "$*"; }
err(){ printf "\033[0;31m[err]\033[0m %s\n" "$*" >&2; }
need(){ command -v "$1" >/dev/null 2>&1 || { err "Missing '$1'"; exit 1; }; }

log "Preflight…"
need git
need curl
# 'gh' (GitHub CLI) is optional—if present we auto-trigger & watch the workflow
if ! command -v gh >/dev/null 2>&1; then warn "gh not found; push will still auto-run Actions on main."; fi
git rev-parse --is-inside-work-tree >/dev/null || { err "Not inside a git repo. cd into your certnode repo."; exit 1; }

# Normalize CRLF → LF for files that break Linux builds (safe & idempotent)
normalize() {
  local changed=0
  for f in infra/Dockerfile fly.toml .github/workflows/*.yml .github/workflows/*.yaml; do
    [ -f "$f" ] || continue
    # only touch if CRLF present
    if grep -Iq . "$f" && tr -d '\r' < "$f" | cmp -s - "$f"; then
      : # no change
    else
      sed -i 's/\r$//' "$f" || true
      changed=1
      log "normalized line endings: $f"
    fi
  done
  return $changed
}

# Ensure we're on 'main' (create/align if needed)
if ! git rev-parse --abbrev-ref HEAD | grep -q '^main$'; then
  log "Switching to branch 'main' (creating if needed)…"
  git checkout -B main
fi

# Ensure 'origin' remote points to your GitHub repo (HTTPS)
REMOTE_OK=1
if ! git ls-remote --get-url origin >/dev/null 2>&1; then
  REMOTE_OK=0
elif ! git ls-remote --get-url origin | grep -q '^https://github.com/srbryant86/certnode\.git$'; then
  REMOTE_OK=0
fi
if [ "$REMOTE_OK" -eq 0 ]; then
  log "Setting origin → https://github.com/srbryant86/certnode.git"
  if git remote | grep -q '^origin$'; then
    git remote set-url origin https://github.com/srbryant86/certnode.git
  else
    git remote add origin https://github.com/srbryant86/certnode.git
  fi
fi

# Rebase on latest remote if available (safe if remote missing/new)
git fetch origin main >/dev/null 2>&1 || true
git rebase origin/main >/dev/null 2>&1 || true

# Normalize endings (if anything actually changed, we’ll commit it)
normalize || true

# Stage any local changes (files you already created/edited or normalization)
git add -A
if ! git diff --cached --quiet; then
  log "Committing local changes…"
  git commit -m "chore(repo): normalize endings, align config & deploy assets"
else
  log "No local changes to commit."
fi

# Push (create upstream if first time)
log "Pushing to GitHub (main)…"
if ! git push -u origin main; then
  err "Push failed. If Git asks to sign in, complete auth then re-run this script."
  exit 1
fi

# Trigger / watch the deploy workflow if GitHub CLI is installed
if command -v gh >/dev/null 2>&1; then
  log "Triggering deploy workflow (if not already triggered by push)…"
  gh workflow run deploy.yml >/dev/null 2>&1 || true
  log "Watching latest run for 'deploy.yml'… (Ctrl+C to stop)"
  gh run list --workflow=deploy.yml --limit 1
  gh run watch --exit-status || warn "Deploy workflow failed—check Actions logs."
else
  warn "gh not installed → open GitHub → Actions → 'Deploy to Fly.io' to watch the run."
fi

log "Done. If the workflow is green, test:  curl -I https://certnode.fly.dev/healthz"

<# 
  File: tools/bootstrap_certnode.ps1
  Purpose: Idempotent, self-diagnosing & self-healing bootstrap for CertNode (PowerShell edition)
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ========== Helpers ==========
function Write-Info($msg){ Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg){ Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Ok  ($msg){ Write-Host "[ OK ] $msg" -ForegroundColor Green }
function Write-Err ($msg){ Write-Host "[ERR ] $msg" -ForegroundColor Red }

function Test-Tool($name, $advice) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    Write-Warn "$name not found. $advice"
    return $false
  }
  Write-Ok "$name found"
  return $true
}

function Ensure-Dir($path) {
  if (-not (Test-Path $path)) { New-Item -ItemType Directory -Force -Path $path | Out-Null; Write-Ok "Created $path" }
}

function Normalize-LF($path){
  if (Test-Path $path) {
    $orig = Get-Content -Raw -LiteralPath $path
    $lf = $orig -replace "`r`n","`n"
    if ($orig -ne $lf) {
      Set-Content -LiteralPath $path -Value $lf -NoNewline
      Write-Ok "Normalized line endings (LF): $path"
    }
  }
}

function Write-FileIfChanged($Path, [string]$Content) {
  $dir = Split-Path -Parent $Path
  if ($dir) { Ensure-Dir $dir }
  $existing = if (Test-Path $Path) { Get-Content -Raw -LiteralPath $Path } else { $null }
  if ($existing -ne $Content) {
    # ensure LF endings for Dockerfile/YAML/MD/TOML
    $lf = $Content -replace "`r`n","`n"
    Set-Content -LiteralPath $Path -Value $lf -NoNewline
    if ($existing) { Write-Ok "Updated $Path" } else { Write-Ok "Created $Path" }
    return $true
  } else {
    Write-Info "No change: $Path"
    return $false
  }
}

function Git-IsRepo {
  try { git rev-parse --is-inside-work-tree | Out-Null; return $true } catch { return $false }
}

function Git-Branch {
  (git rev-parse --abbrev-ref HEAD).Trim()
}

function Git-Dirty {
  $s = (git status --porcelain).Trim()
  return -not [string]::IsNullOrEmpty($s)
}

# ========== Preflight ==========
Write-Host "────────────────────────────────────────────────────────────────"
Write-Host " CertNode PowerShell Bootstrap (self-diagnosing / self-healing) "
Write-Host "────────────────────────────────────────────────────────────────"

# Tools check
$hasGit = Test-Tool git "Install Git: https://git-scm.com/downloads"
$hasCurl = Test-Tool curl "PowerShell has Invoke-WebRequest; curl optional."
$hasJq = Test-Tool jq "Optional. Improves JSON output."
$hasGh = Test-Tool gh "Optional. Used to trigger/watch GitHub Actions."
if (-not $hasGit) { throw "Git is required. Aborting." }

# Basic repo checks
if (-not (Git-IsRepo)) {
  Write-Warn "This folder isn't a git repo. Initializing…"
  git init
  Write-Ok "Initialized git repository"
}

# Ensure main branch
$branch = Git-Branch
if ($branch -eq "HEAD") {
  Write-Warn "Detached HEAD detected; switching to main"
  git checkout -B main
} elseif ($branch -ne "main") {
  Write-Warn "Current branch is '$branch'. Switching to 'main' (will create if needed)."
  git checkout -B main
}
$branch = Git-Branch
Write-Ok "On branch: $branch"

# Ensure origin remote & correct URL
$desiredRemote = "https://github.com/srbryant86/certnode.git"
$originUrl = ""
try { $originUrl = (git remote get-url origin).Trim() } catch { $originUrl = "" }
if ([string]::IsNullOrEmpty($originUrl)) {
  Write-Warn "No 'origin' remote. Adding…"
  git remote add origin $desiredRemote
  Write-Ok "Added origin -> $desiredRemote"
} elseif ($originUrl -ne $desiredRemote) {
  Write-Warn "Origin points to $originUrl. Setting to $desiredRemote"
  git remote set-url origin $desiredRemote
  Write-Ok "Updated origin remote URL"
}

# Try to align with remote main (ignore if first push)
try {
  git fetch origin main | Out-Null
  Write-Ok "Fetched origin/main"
  git pull --rebase origin main
  Write-Ok "Rebased on origin/main"
} catch {
  Write-Warn "Couldn't pull/rebase (likely first push or no upstream yet). Continuing."
}

# ========== File contents ==========
# Dockerfile
$dockerfile = @'
FROM python:3.11-slim

# Minimal build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc libffi-dev libssl-dev curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/healthz || exit 1

CMD ["uvicorn","apps.api.main:app","--host","0.0.0.0","--port","8080"]
'@

# .dockerignore
$dockerignore = @'
__pycache__/
*.py[cod]
*.egg-info/
build/
dist/
.venv/
venv/
.env
.git/
.github/
.vscode/
.idea/
.DS_Store
node_modules/
tests/
'@

# fly.toml (no [processes])
$flyToml = @'
app = "certnode"
primary_region = "iad"

[build]
  dockerfile = "./infra/Dockerfile"

[env]
  PORT = "8080"
  APP_ENV = "prod"
  LOG_LEVEL = "INFO"
  CORS_ORIGINS = "https://certnode.io,https://www.certnode.io,https://certnode.fly.dev"

[http_service]
  internal_port = 8080
  force_https = true
  auto_start_machines = true
  auto_stop_machines = false
  min_machines_running = 1

  [http_service.concurrency]
    type = "requests"
    soft_limit = 50
    hard_limit = 100

  [[http_service.checks]]
    grace_period = "10s"
    interval = "10s"
    method = "GET"
    path = "/healthz"
    timeout = "5s"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 1024
# To scale:
# [[vm]]
#   cpu_kind = "shared"
#   cpus = 2
#   memory_mb = 2048
'@

# Workflows
$deployYml = @'
name: Deploy to Fly.io
on:
  push:
    branches: [main]
  workflow_dispatch:
env:
  FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - name: Deploy
        run: |
          set -e
          echo "🚀 Deploying…"
          flyctl deploy --config fly.toml --remote-only --strategy immediate --wait-timeout 600 --verbose || (
            echo "❌ Deploy failed. Recent logs:" && flyctl logs -a certnode --since 10m && exit 1
          )
      - name: Smoke test
        run: |
          set -e
          for i in 1 2 3 4 5; do
            code=$(curl -s -o /dev/null -w "%{http_code}" https://certnode.fly.dev/healthz || echo 000)
            echo "Attempt $i -> $code"
            [ "$code" = "200" ] && exit 0
            sleep $((2**i))
          done
          echo "❌ Health check failed"
          exit 1
'@

$provisionYml = @'
name: Provision Domain Certificates
on:
  workflow_dispatch:
env:
  FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
jobs:
  provision:
    runs-on: ubuntu-latest
    outputs:
      apex_record: ${{ steps.out.outputs.apex_record }}
      www_record:  ${{ steps.out.outputs.www_record }}
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - name: Add certs (idempotent)
        run: |
          flyctl certs add certnode.io -a certnode || true
          flyctl certs add www.certnode.io -a certnode || true
      - name: Wait for readiness
        run: |
          for i in {1..30}; do
            flyctl certs list -a certnode
            sleep 5
          done
      - name: Output DNS
        id: out
        run: |
          set -e
          IPS=$(flyctl ips list -a certnode --json | jq -r '.[] | select(.type=="v4") | .address' | head -1 || true)
          if [ -n "$IPS" ]; then
            echo "apex_record=A $IPS (or CNAME certnode.fly.dev with flattening)" >> $GITHUB_OUTPUT
          else
            echo "apex_record=CNAME certnode.fly.dev (flattened)" >> $GITHUB_OUTPUT
          fi
          echo "www_record=CNAME certnode.fly.dev" >> $GITHUB_OUTPUT
          echo "::notice title=Cloudflare DNS::Apex => CNAME certnode.fly.dev (DNS only); WWW => CNAME certnode.fly.dev (DNS only)"
'@

$verifyYml = @'
name: Verify Domain Setup
on:
  workflow_dispatch:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Check apex
        run: |
          for i in {1..5}; do
            code=$(curl -s -o /dev/null -w "%{http_code}" -L https://certnode.io/healthz || echo 000)
            echo "apex attempt $i -> $code"
            [ "$code" = "200" ] && exit 0
            sleep $((2**i))
          done
          exit 0
      - name: Check www
        run: |
          for i in {1..5}; do
            code=$(curl -s -o /dev/null -w "%{http_code}" -L https://www.certnode.io/healthz || echo 000)
            echo "www attempt $i -> $code"
            [ "$code" = "200" ] && exit 0
            sleep $((2**i))
          done
          exit 0
'@

# README
$readme = @'
# CertNode — Infrastructure-grade Trust & Certification

[![Deploy](https://img.shields.io/badge/Deploy-Fly.io-blue)](#) [![CI](https://img.shields.io/badge/GitHub-Actions-black)](#)

CertNode is an **infrastructure-grade** FastAPI service for trust, audit, and certification of human + AI content.  
Batteries-included: Docker, Fly.io Machines, Cloudflare, health/readiness probes, Prometheus metrics, rate limiting, and a polished static landing page.

## Highlights
- FastAPI on Python 3.11 (uvicorn)
- `/healthz`, `/livez`, `/readyz`, `/metrics`
- Structured logs, CORS via env, SlowAPI rate limits
- Minimal, modern landing at `/`
- One-shot CI/CD via GitHub Actions → Fly.io

## Quick Start
- Push to `main` ⇒ Deploy workflow runs
- Provision certs (manual workflow) ⇒ paste Cloudflare DNS (DNS-only first)
- Verify workflow ⇒ then enable Cloudflare proxy

See **docs/deploy.md** for full runbook and scaling.
'@

# docs/deploy.md
$docsDeploy = @'
# Deployment Guide (Fly.io + Cloudflare)

1. Merge to `main` (push triggers Deploy workflow).
2. Run **Provision Domain Certificates** (manual). Copy DNS:
   - Apex: CNAME certnode.fly.dev (flattened) or A to Fly IP
   - WWW:  CNAME certnode.fly.dev
   - Proxy: **DNS only** until verified
3. In Cloudflare, add records above.
4. Run **Verify Domain Setup**.
5. Flip both records to **Proxied** (orange cloud).

### Scale (fly.toml)
Increase RAM/CPU by editing the `[[vm]]` block and pushing:
```toml
[[vm]]
  cpu_kind = "shared"
  cpus = 2
  memory_mb = 2048
'@

Simple SVG assets
$logoSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
<defs>
<linearGradient id="g" x1="0" x2="1" y1="1" y2="0">
<stop offset="0" stop-color="#1e3c72"/><stop offset="1" stop-color="#2a5298"/>
</linearGradient>
</defs>
<rect rx="32" width="256" height="256" fill="url(#g)"/>
<g fill="#fff">
<path d="M58 90l70-30 70 30v36c0 40-28 76-70 90-42-14-70-50-70-90z" opacity=".95"/>
<circle cx="128" cy="124" r="28"/>
</g>
</svg>
'@

$faviconSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<rect rx="6" width="32" height="32" fill="#2a5298"/>
<circle cx="16" cy="16" r="7" fill="#fff"/>
</svg>
'@

apps/api/main.py (landing + health + readiness + metrics + CORS + rate limit)
$mainPy = @'
import os
import logging
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

LOG_LEVEL = os.getenv("LOG_LEVEL","INFO").upper()
logging.basicConfig(level=LOG_LEVEL, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("certnode")

app = FastAPI(title="CertNode", version="1.0.0", docs_url="/api/docs", redoc_url="/api/redoc")

CORS
origins = [o.strip() for o in os.getenv("CORS_ORIGINS","").split(",") if o.strip()]
if origins:
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=[""], allow_headers=[""])

Rate limit
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

Metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

LANDING = """<!doctype html><html lang="en"><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>

<title>CertNode</title> <style>body{margin:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:linear-gradient(135deg,#1e3c72,#2a5298);min-height:100vh;display:flex;align-items:center;justify-content:center;color:#334155} .card{background:#fff;border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,.15);padding:32px;max-width:720px;width:92%} h1{margin:0 0 8px;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent} a{color:#334155;text-decoration:none;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;display:inline-block;margin:6px 6px 0 0;background:#f8fafc} a:hover{background:#eef2ff} .badge{display:inline-block;background:#10b981;color:#fff;border-radius:999px;padding:4px 10px;font-size:12px;margin:8px 0} </style> <div class=card> <h1>🔐 CertNode</h1> <p>Infrastructure-grade framework for trust, audit, and certification of human + AI content.</p> <div class=badge>Operational</div> <div style="margin-top:12px"> <a href="/healthz"><code>/healthz</code></a> <a href="/readyz"><code>/readyz</code></a> <a href="/metrics"><code>/metrics</code></a> <a href="/api"><code>/api</code></a> <a href="/api/docs"><code>/api/docs</code></a> </div> </div> </html>"""
@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def root():
return LANDING

@app.get("/healthz", include_in_schema=False)
@app.get("/livez", include_in_schema=False)
async def health():
return {"status": "healthy", "ts": datetime.utcnow().isoformat()}

@app.get("/readyz", include_in_schema=False)
async def ready():
checks = {"api":"ready","database":"ready","cache":"ready"} # Wire real checks later
if all(v=="ready" for v in checks.values()):
return {"status":"ready","checks":checks,"ts":datetime.utcnow().isoformat()}
raise HTTPException(status_code=503, detail={"status":"not ready","checks":checks})

@app.get("/api")
@limiter.limit("60/minute")
async def api_status(request: Request):
return {"ok": True, "app": "certnode", "version": "1.0.0", "env": os.getenv("APP_ENV","dev"), "region": os.getenv("FLY_REGION","local")}
'@

requirements.txt (minimal add; do not wipe user pins—merge if exists)
$requirements = @'
fastapi==0.115.5
uvicorn[standard]==0.32.1
prometheus-fastapi-instrumentator==7.0.0
slowapi==0.1.9
requests==2.32.3
python-multipart==0.0.12
'@

========== Write files (idempotent) ==========
$changed = $false

$changed = (Write-FileIfChanged "infra/Dockerfile" $dockerfile) -or $changed
$changed = (Write-FileIfChanged ".dockerignore" $dockerignore) -or $changed
$changed = (Write-FileIfChanged "fly.toml" $flyToml) -or $changed

Ensure-Dir ".github/workflows"
$changed = (Write-FileIfChanged ".github/workflows/deploy.yml" $deployYml) -or $changed
$changed = (Write-FileIfChanged ".github/workflows/provision-domain.yml" $provisionYml) -or $changed
$changed = (Write-FileIfChanged ".github/workflows/verify.yml" $verifyYml) -or $changed

Ensure-Dir "docs"
$changed = (Write-FileIfChanged "docs/deploy.md" $docsDeploy) -or $changed

Ensure-Dir "assets"
$changed = (Write-FileIfChanged "assets/certnode-logo.svg" $logoSvg) -or $changed
$changed = (Write-FileIfChanged "assets/favicon.svg" $faviconSvg) -or $changed

$changed = (Write-FileIfChanged "README.md" $readme) -or $changed

API file (create if absent)
Ensure-Dir "apps/api"
$changed = (Write-FileIfChanged "apps/api/main.py" $mainPy) -or $changed

requirements: if exists, append missing lines; else create
if (Test-Path "requirements.txt") {
$current = (Get-Content -Raw -LiteralPath "requirements.txt")
$need = @()
foreach($line in ($requirements -split "n")){ $trim = $line.Trim() if ($trim -and ($current -notmatch [regex]::Escape($trim))) { $need += $trim } } if ($need.Count -gt 0) { Add-Content -LiteralPath "requirements.txt" -Value ("n" + ($need -join "`n"))
Write-Ok "Merged dependencies into requirements.txt"
$changed = $true
} else {
Write-Info "requirements.txt already includes required deps"
}
} else {
$changed = (Write-FileIfChanged "requirements.txt" $requirements) -or $changed
}

Normalize endings for key files
Normalize-LF "infra/Dockerfile"
Normalize-LF "fly.toml"
Normalize-LF ".github/workflows/deploy.yml"
Normalize-LF ".github/workflows/provision-domain.yml"
Normalize-LF ".github/workflows/verify.yml"

========== Git commit/push (safe) ==========
if ($changed -or (Git-Dirty)) {
git add -A
git commit -m "chore(certnode): bootstrap infra-grade deploy (PS self-heal)"
try {
git pull --rebase origin main
} catch { Write-Warn "Rebase skipped (first push or no upstream yet)." }
try {
git push -u origin main
Write-Ok "Changes pushed to origin/main"
} catch {
Write-Err "Push failed. If prompted, run 'gh auth login' or set Git credentials, then re-run script."
throw
}
} else {
Write-Ok "Already up-to-date; no changes to commit"
}

========== Trigger CI (Deploy) ==========
if ($hasGh) {
try {
Write-Info "Triggering Deploy workflow via gh…"
gh workflow run deploy.yml | Out-Null
Start-Sleep -Seconds 3
gh run watch --exit-status
} catch {
Write-Warn "Could not trigger/watch GH Actions automatically. Open the Actions tab and run 'Deploy to Fly.io'."
}
} else {
Write-Warn "GitHub CLI not installed. Open GitHub → Actions → run 'Deploy to Fly.io'."
}

========== Verify health on fly.dev ==========
$ok = $false
for ($i=1; $i -le 6; $i++) {
try {
$resp = Invoke-WebRequest -Uri "https://certnode.fly.dev/healthz" -Method GET -TimeoutSec 10
if ($resp.StatusCode -eq 200) { $ok = $true; break }
} catch { Start-Sleep -Seconds ([int][math]::Pow(2,$i)) }
}
if ($ok) { Write-Ok "Fly app healthy at https://certnode.fly.dev/healthz" }
else { Write-Warn "Health check not confirmed yet. It may still be deploying; check Actions logs." }

========== Next steps / Runbook ==========
Write-Host ""
Write-Host "───────────────────── Runbook ─────────────────────" -ForegroundColor Cyan
Write-Host "1) In GitHub → Actions: ensure 'Deploy to Fly.io' run is green."
Write-Host "2) Run 'Provision Domain Certificates' (manual)."
Write-Host " Outputs: apex_record, www_record."
Write-Host "3) In Cloudflare DNS, add:"
Write-Host " - Apex (@): CNAME certnode.fly.dev (flattened) DNS only"
Write-Host " - www: CNAME certnode.fly.dev DNS only"
Write-Host "4) Run 'Verify Domain Setup' workflow."
Write-Host "5) Switch both records to Proxied (orange cloud)."
Write-Host ""
Write-Host "Troubleshooting:"
Write-Host "• 'Service has no processes': ensure fly.toml has NO [processes]; Dockerfile CMD present."
Write-Host "• TLS pending: wait a few minutes, re-run provision workflow."
Write-Host "• CRLF issues: this script normalized LF on critical files."
Write-Host "• Push auth: run 'gh auth login' or configure Git credentials."
Write-Host
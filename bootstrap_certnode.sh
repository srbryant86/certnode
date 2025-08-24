#!/usr/bin/env bash
set -euo pipefail

# bootstrap_certnode.sh
# Minimal, clean folder scaffolding for the current repo (Fly.io-ready)

REPO_ROOT="."

say() { printf "\033[1;32m==>\033[0m %s\n" "$*"; }
mkd() { mkdir -p "$1"; }
touch_if_missing() { [ -f "$1" ] || touch "$1"; }
write_if_missing() { [ -f "$1" ] || printf "%s" "$2" > "$1"; }

say "Bootstrapping CertNode repo structure in: $(pwd)"

# --- Top-level files ---
say "Writing top-level files"
write_if_missing "${REPO_ROOT}/README.md" "# CertNode\n\nProduction-grade certificate/audit service.\n"
write_if_missing "${REPO_ROOT}/.gitignore" "/.venv\n__pycache__/\n*.pyc\n.env\n.fly/\n"
write_if_missing "${REPO_ROOT}/pyproject.toml" "\
[build-system]\nrequires = [\"setuptools\", \"wheel\"]\nbuild-backend = \"setuptools.build_meta\"\n\n\
[project]\nname = \"certnode\"\nversion = \"0.1.0\"\nrequires-python = \">=3.10\"\n"
write_if_missing "${REPO_ROOT}/requirements.txt" "\
fastapi\nuvicorn[standard]\nsqlalchemy\npydantic\npydantic-settings\npython-jose[cryptography]\ncryptography\nredis\nprometheus-fastapi-instrumentator\nslowapi\npsycopg2-binary\n"

# --- Apps/API skeleton ---
say "Scaffolding apps/api"
mkd "${REPO_ROOT}/apps/api/auth"
mkd "${REPO_ROOT}/apps/api/billing"
mkd "${REPO_ROOT}/apps/api/middleware"
mkd "${REPO_ROOT}/apps/api/models"
mkd "${REPO_ROOT}/apps/api/routes"

write_if_missing "${REPO_ROOT}/apps/api/__init__.py" ""
write_if_missing "${REPO_ROOT}/apps/api/main.py" "\
from fastapi import FastAPI\n\napp = FastAPI(title=\"CertNode API\")\n\n@app.get(\"/healthz\")\ndef health(): return {\"ok\": True}\n"
write_if_missing "${REPO_ROOT}/apps/api/routes/__init__.py" ""
touch_if_missing "${REPO_ROOT}/apps/api/auth/__init__.py"
touch_if_missing "${REPO_ROOT}/apps/api/billing/__init__.py"
touch_if_missing "${REPO_ROOT}/apps/api/middleware/__init__.py"
touch_if_missing "${REPO_ROOT}/apps/api/models/__init__.py"

# --- Core package skeleton ---
say "Scaffolding packages/certnode_core"
mkd "${REPO_ROOT}/packages/certnode_core/certnode/tenancy"
mkd "${REPO_ROOT}/packages/certnode_core/certnode/crypto"
mkd "${REPO_ROOT}/packages/certnode_core/certnode/audit"

write_if_missing "${REPO_ROOT}/packages/certnode_core/__init__.py" ""
write_if_missing "${REPO_ROOT}/packages/certnode_core/certnode/__init__.py" ""
touch_if_missing "${REPO_ROOT}/packages/certnode_core/certnode/tenancy/__init__.py"
touch_if_missing "${REPO_ROOT}/packages/certnode_core/certnode/crypto/__init__.py"
touch_if_missing "${REPO_ROOT}/packages/certnode_core/certnode/audit/__init__.py"

# --- Infra (Fly.io + Docker) ---
say "Scaffolding infra"
mkd "${REPO_ROOT}/infra"
write_if_missing "${REPO_ROOT}/infra/Dockerfile" "\
FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\n\
COPY . .\nEXPOSE 8080\nCMD [\"uvicorn\", \"apps.api.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8080\"]\n"
write_if_missing "${REPO_ROOT}/infra/docker-compose.yml" "\
version: '3.8'\nservices:\n  api:\n    build: ..\n    ports:\n      - \"8080:8080\"\n"

# A simple Fly config (you can run `flyctl launch` later to refine)
write_if_missing "${REPO_ROOT}/fly.toml" "\
app = \"certnode\"\nprimary_region = \"iad\"\n\n[http_service]\n  internal_port = 8080\n  force_https = true\n  auto_stop_machines = true\n  auto_start_machines = true\n  min_machines_running = 0\n"

# --- Alembic skeleton ---
say "Scaffolding alembic"
mkd "${REPO_ROOT}/alembic/versions"
write_if_missing "${REPO_ROOT}/alembic/README" "Migrations live here."
write_if_missing "${REPO_ROOT}/alembic.ini" "# Configure alembic here\n"

# --- Scripts & docs ---
say "Scaffolding scripts and docs"
mkd "${REPO_ROOT}/scripts"
mkd "${REPO_ROOT}/docs/runbooks"
mkd "${REPO_ROOT}/docs/dashboards"
write_if_missing "${REPO_ROOT}/scripts/seed.py" "# placeholder for demo seed\n"
write_if_missing "${REPO_ROOT}/docs/slos.md" "# SLOs\n"

# --- Simple Makefile for quick run ---
write_if_missing "${REPO_ROOT}/Makefile" "\
run:\n\tuvicorn apps.api.main:app --host 0.0.0.0 --port 8080 --reload\n"

say "Done. Repo scaffolded at: $(pwd)"
say "Next:\n  1) python -m venv .venv && source .venv/bin/activate\n  2) pip install -r requirements.txt\n  3) make run   # local dev on http://localhost:8080/healthz\n  4) flyctl launch --copy-config\n"

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
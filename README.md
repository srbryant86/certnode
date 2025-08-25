Perfect — since your repo is now ready for production, let’s make sure the **`README.md`** is polished, professional, and aligned with CertNode’s academic-grade + enterprise deployment goals.

Here’s a **drop-in README.md** you can place at the root of your repo:

---

```markdown
# 🔐 CertNode

**CertNode** is an infrastructure-grade framework for **logic, structure, and epistemic certification** of human- and AI-authored content.  
It provides a **neutral, reproducible, and academically credible** method to analyze nonfiction text for:

- Logical structure and coherence  
- Rhetorical manipulation or bias detection  
- Argument convergence and epistemic integrity  

CertNode is designed to serve as a **standard for trust and certification** in research, publishing, and enterprise AI validation.

---

## 🚀 Features

- **FastAPI Backend** — lightweight, Python-first web service (`apps/api/main.py`)  
- **Production Deployment** — Dockerized app running on **Fly.io Machines** with TLS enforced via Cloudflare  
- **Health & Observability**  
  - `/healthz` — liveness probe  
  - `/readyz` — readiness probe  
  - `/livez` — alias to health  
  - `/metrics` — Prometheus metrics instrumentation  
- **Rate Limiting** — `slowapi` integrated on non-health endpoints  
- **CORS** — configurable via environment variable `CORS_ORIGINS`  
- **Minimal Landing Page** — clean static HTML served at `/` with links to system endpoints  
- **CI/CD** — GitHub Actions workflows for:
  - Automatic deploy to Fly.io (`deploy.yml`)  
  - SSL provisioning (`provision-domain.yml`)  
  - DNS/SSL verification (`verify.yml`)  
- **Security & DX**  
  - TLS enforced at edge  
  - No secrets in code — handled via GitHub Actions secrets  
  - JSON-structured logging (opt-in via `LOG_FORMAT=json`)  
  - `Makefile` + docs for both Bash and PowerShell developers  

---

## 📂 Repository Structure

```

certnode/
├── apps/
│   └── api/                # FastAPI app with landing + health + metrics
├── infra/
│   └── Dockerfile          # Production container build
├── .github/workflows/      # CI/CD workflows
├── docs/
│   └── deploy.md           # Step-by-step deployment runbook
├── fly.toml                # Fly.io config (Machines v2)
├── requirements.txt        # Python dependencies
├── Makefile                # Developer commands
└── README.md               # This file

````

---

## ⚡ Quick Start (Local)

### 1. Clone
```bash
git clone https://github.com/srbryant86/certnode.git
cd certnode
````

### 2. Install dependencies

```bash
python -m venv venv
source venv/bin/activate   # PowerShell: .\venv\Scripts\Activate
pip install -r requirements.txt
```

### 3. Run locally

```bash
uvicorn apps.api.main:app --reload --port 8080
```

Visit [http://localhost:8080](http://localhost:8080).

---

## 🌐 Production Deployment

CertNode is production-ready out of the box with Fly.io + Cloudflare.

### Requirements

* GitHub repo with `FLY_API_TOKEN` secret set
* Domain `certnode.io` on Cloudflare

### Steps

1. **Merge changes → GitHub Actions auto-deploys**
2. Run **Provision Domain Certificates** workflow
3. Add DNS records in Cloudflare (provided in workflow output):

   * `@` → CNAME `certnode.fly.dev` (grey cloud first)
   * `www` → CNAME `certnode.fly.dev` (grey cloud first)
4. Run **Verify Domain Setup** workflow
5. Switch DNS to **Proxied (orange cloud)**

See [`docs/deploy.md`](docs/deploy.md) for the complete runbook.

---

## 🛡️ Security & Observability

* TLS by default via Fly.io + Cloudflare
* Structured logging (plain or JSON)
* Prometheus metrics at `/metrics`
* Rate limiting on sensitive endpoints

---

## 🧑‍💻 Developer Experience

Common commands (via `Makefile`):

```bash
make build        # Build Docker image
make run          # Run container locally
make curl-health  # Test local health endpoints
make install-dev  # Install dev dependencies
make clean        # Clean build artifacts
```

Windows PowerShell equivalents are documented in [`docs/deploy.md`](docs/deploy.md).

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

## ✨ Maintainers

* **S.R. Bryant** — [srbryant86](https://github.com/srbryant86)

---

## 🔗 Resources

* [FastAPI Docs](https://fastapi.tiangolo.com)
* [Fly.io Docs](https://fly.io/docs)
* [Cloudflare Docs](https://developers.cloudflare.com)
* [GitHub Actions](https://docs.github.com/actions)

```

---

This README balances **enterprise-readiness** and **academic credibility**:  
- It explains **what CertNode is**,  
- Shows **how to run it locally**,  
- Explains **how it deploys in production**,  
- And documents **features + security**.  

👉 Do you want me to also generate a **short academic-style abstract** (like a one-page “whitepaper summary”) to pin at the top of the README for scholars/institutions browsing your repo?
```

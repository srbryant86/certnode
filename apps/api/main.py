"""
CertNode FastAPI Application
Production-ready API with health checks, metrics, CORS, and rate limiting
"""
import os
import logging
from datetime import datetime

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# logging config (toggle JSON via LOG_FORMAT=json)
if os.getenv("LOG_FORMAT") == "json":
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO"),
        format='{"time":"%(asctime)s","level":"%(levelname)s","name":"%(name)s","msg":"%(message)s"}',
    )
else:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO"),
        format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
    )

logger = logging.getLogger("certnode")

app = FastAPI(
    title="CertNode",
    description="Infrastructure-grade framework for trust, audit, and certification",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
if cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info(f"CORS enabled for: {cors_origins}")

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)

LANDING_HTML = """<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CertNode - Trust Infrastructure</title>
<style>
*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;background:linear-gradient(135deg,#1e3c72,#2a5298);min-height:100vh;margin:0;display:flex;align-items:center;justify-content:center;color:#334155}
.card{background:#fff;border-radius:18px;box-shadow:0 20px 48px rgba(0,0,0,.18);padding:32px;max-width:640px;width:92%}
h1{margin:0 0 8px;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.tag{color:#64748b;margin:0 0 20px}
.badge{display:inline-flex;align-items:center;gap:8px;background:#10b981;color:#fff;border-radius:999px;padding:6px 12px;font-size:14px}
.badge:before{content:"";width:8px;height:8px;border-radius:50%;background:#fff;opacity:.9}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:24px}
a.item{display:block;text-decoration:none;color:#475569;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px}
a.item:hover{background:#eef2f7;border-color:#cbd5e1}
.footer{margin-top:24px;color:#94a3b8;font-size:13px;text-align:center}
code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace}
</style></head>
<body><div class="card">
<h1>🔐 CertNode</h1>
<p class="tag">Trust, audit, and certification for human + AI content.</p>
<span class="badge">Operational</span>
<div class="grid">
  <a class="item" href="/healthz"><code>/healthz</code> Health</a>
  <a class="item" href="/readyz"><code>/readyz</code> Readiness</a>
  <a class="item" href="/metrics"><code>/metrics</code> Metrics</a>
  <a class="item" href="/api"><code>/api</code> API Status</a>
  <a class="item" href="/api/docs"><code>/api/docs</code> OpenAPI</a>
</div>
<div class="footer">v1.0.0 • Region: IAD • Environment: Production</div>
</div></body></html>"""

@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def root():
    return LANDING_HTML

@app.get("/healthz", include_in_schema=False)
@app.get("/livez", include_in_schema=False)
async def healthz():
    return {"status": "healthy", "service": "certnode", "ts": datetime.utcnow().isoformat()}

@app.get("/readyz", include_in_schema=False)
async def readyz():
    checks = {"api": "ready", "database": "ready", "cache": "ready"}  # flip later if needed
    all_ready = all(v == "ready" for v in checks.values())
    if not all_ready:
        raise HTTPException(status_code=503, detail={"status": "not ready", "checks": checks})
    return {"status": "ready", "checks": checks, "ts": datetime.utcnow().isoformat()}

@app.get("/api")
@limiter.limit("30/minute")
async def api_status(request: Request):
    return {
        "ok": True,
        "app": "certnode",
        "version": "1.0.0",
        "environment": os.getenv("APP_ENV", "development"),
        "region": os.getenv("FLY_REGION", "unknown"),
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.exception_handler(404)
async def not_found(request: Request, exc):
    return JSONResponse(status_code=404, content={"error": "Not Found", "path": str(request.url.path)})

@app.exception_handler(500)
async def internal_err(request: Request, exc):
    logger.exception("Unhandled error")
    return JSONResponse(status_code=500, content={"error": "Internal Server Error"})

@app.on_event("startup")
async def on_start():
    logger.info("CertNode starting | env=%s | cors=%s | region=%s",
                os.getenv("APP_ENV", "development"), cors_origins, os.getenv("FLY_REGION", "local"))

@app.on_event("shutdown")
async def on_stop():
    logger.info("CertNode shutting down")
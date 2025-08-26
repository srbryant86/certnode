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
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from starlette.middleware.cors import CORSMiddleware

app = FastAPI(title="CertNode", version="0.1.0")

# Security/CORS (tighten origins later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"ok": True, "app": "certnode"}

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

# Prometheus metrics at /metrics
Instrumentator().instrument(app).expose(app)
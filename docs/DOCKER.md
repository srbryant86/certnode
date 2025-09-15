# Docker and Compose

This guide shows how to build and run CertNode in a container.

## Build & Run (Docker)

```
docker build -t certnode:latest .
docker run --rm -p 3000:3000 -e NODE_ENV=production -e PORT=3000 certnode:latest
```

Test:
```
curl http://127.0.0.1:3000/healthz
```

## Compose (Local Dev)

```
docker compose up --build
```

Environment defaults (override as needed):
- `PORT=3000`
- `PAYLOAD_WARN_BYTES=65536`
- `PAYLOAD_HARD_BYTES=262144`
- `API_RATE_LIMIT_MAX=120`
- `API_RATE_LIMIT_WINDOW_MS=60000`

### Optional TSA (RFC3161)

If you want real timestamp tokens (`tsr`) when clients pass `headers.tsr: true` to `/v1/sign`, set these env vars. If unset, CertNode returns a deterministic stub suitable for tests/offline flows.

- `TSA_URL` — e.g., `https://tsa.example.com/tsp`
- `TSA_TIMEOUT_MS` — timeout in ms (default `3000`)
- `TSA_RETRIES` — retry attempts on failure (default `1`)
- `TSA_CA_PEM` — inline PEM for custom CA (optional)
- `TSA_CERT_IGNORE` — set `1` to ignore TLS errors (dev only)

## Notes
- Image uses Node 20 Alpine and runs as non‑root `node` user
- The API has no runtime `npm install` step for core app; add dependencies if needed
- For cloud registries (GHCR), configure CI/CD with credentials before pushing images

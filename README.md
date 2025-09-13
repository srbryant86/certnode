# CertNode

[![CI](https://github.com/srbryant86/certnode/actions/workflows/ci.yml/badge.svg)](https://github.com/srbryant86/certnode/actions/workflows/ci.yml)
[![Nightly Benchmark](https://github.com/srbryant86/certnode/actions/workflows/nightly-benchmark.yml/badge.svg)](https://github.com/srbryant86/certnode/actions/workflows/nightly-benchmark.yml)

Tamper-evident receipt service using ES256 (P-256) and RFC 8785 JCS.

## Quick Links
- Web verify page: `web/verify.html`
- OpenAPI spec: `web/openapi.json` (served at `/openapi.json`)
- OpenAPI viewer: `web/openapi.html`
- Node SDK: `sdk/node` (package: `@certnode/sdk`)
- Web SDK (ESM): `sdk/web` (package: `@certnode/sdk-web`)
- CLI verifier: `tools/verify-receipt.js`
- Rotation/integrity: `docs/ROTATION.md`, tools in `tools/`
- Monitoring: `docs/MONITORING.md`
- Release checklist: `docs/RELEASE.md`
- Docker guide: `docs/DOCKER.md`

## Fast Tests
```
node tools/test-fast.js
```

## Root Scripts
- `npm run start` — start API locally
- `npm run test:fast` — run fast unit tests
- `npm run bench` — run performance benchmark
- `npm run openapi:check` — verify OpenAPI contains required paths
- `npm run sdk:pack` — pack Node and Web SDKs
- `npm run example:sign` — sign a sample payload via API
- `npm run example:verify` — verify a sample receipt via SDK

## Verify (CLI)
```
node tools/verify-receipt.js --receipt path/to/receipt.json --jwks path/to/jwks.json
```

## SDK Install
- Node: `npm install @certnode/sdk`
- Web:  `npm install @certnode/sdk-web`

## Monitoring
- Emit structured JSON metrics via `api/src/plugins/metrics.js`
- See `docs/MONITORING.md` for event names, SLOs, and alert suggestions

## Metrics Quickstart
- Events (one-line JSON):
  - `request_received` — { path, method, request_id }
  - `request_completed` — { path, method, status, ms, request_id }
  - `rate_limit_triggered` — { path, capacity, remaining, request_id }
- Pipeline: ship stdout to your log collector and build dashboards based on these events.

## Release via Tags (GitHub Actions)
- Add `NPM_TOKEN` to GitHub repo secrets (Actions → New repository secret)
- Tag to publish:
  - Node SDK: `git tag sdk-node-vX.Y.Z && git push --tags`
  - Web  SDK: `git tag sdk-web-vA.B.C && git push --tags`
- See `docs/RELEASE.md` for local publish steps and details.
- Examples
  - Node: `examples/node-verify.js`
  - Node (sign): `examples/node-sign.js`
  - Web:  `examples/web-embed.html`

## OpenAPI Clients
- Quick check: `node tools/check-openapi.js`
- Simple client (Node): see `examples/node-sign.js` for calling `/v1/sign`

## Docker
Build and run directly:
```
docker build -t certnode:latest .
docker run --rm -p 3000:3000 -e NODE_ENV=production -e PORT=3000 certnode:latest
```

Or use compose:
```
docker compose up --build
```

## Contributing
- See `CONTRIBUTING.md` for contribution guidelines and optional auto-push hook instructions.

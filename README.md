# CertNode

[![npm (Node SDK)](https://img.shields.io/npm/v/%40certnode%2Fsdk?label=%40certnode%2Fsdk)](https://www.npmjs.com/package/@certnode/sdk)
[![npm (Web SDK)](https://img.shields.io/npm/v/%40certnode%2Fsdk-web?label=%40certnode%2Fsdk-web)](https://www.npmjs.com/package/@certnode/sdk-web)
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
 - Postman collection: `docs/clients/postman_collection.json`

## Fast Tests
```
node tools/test-fast.js
```

## Root Scripts
- `npm run start` - start API locally
- `npm run test:fast` - run fast unit tests
- `npm run bench` - run performance benchmark
- `npm run openapi:check` - verify OpenAPI contains required paths
- `npm run sdk:pack` - pack Node and Web SDKs
- `npm run example:sign` - sign a sample payload via API
- `npm run example:verify` - verify a sample receipt via SDK

## Verify (CLI)
```
node tools/verify-receipt.js --receipt path/to/receipt.json --jwks path/to/jwks.json
```

## SDK Install
- Node: `npm install @certnode/sdk`
- Web:  `npm install @certnode/sdk-web`
 - CDN/SRI: see `sdk/web/README.md` for jsDelivr usage and SRI snippet; example in `examples/web-embed.html`

### Node SDK quick usage
```js
const { verifyReceipt, JWKSManager } = require('@certnode/sdk');

async function main() {
  const receipt = {/* protected, payload, signature, kid, ... */};
  const jwks = { keys: [/* your EC P-256 public keys */] };
  const res = await verifyReceipt({ receipt, jwks });
  console.log(res.ok ? 'valid' : `invalid: ${res.reason}`);
}
main().catch(console.error);
```

## TSA (RFC3161) Configuration
- By default, timestamping uses a deterministic stub token to keep tests and offline verification stable.
- To use a real TSA, set environment variables for the API:
  - `TSA_URL` — e.g., `https://tsa.example.com/tsp`
  - `TSA_TIMEOUT_MS` — request timeout (default `3000`)
  - `TSA_RETRIES` — retries on failure (default `1`)
  - `TSA_CA_PEM` — optional custom CA PEM (inline)
  - `TSA_CERT_IGNORE` — set to `1` to ignore TLS errors (dev only)
  The `/v1/sign` route adds a `tsr` field to receipts when `headers.tsr === true` and a token is obtained.
  - Strict mode: set `headers.require_tsr: true` in the `/v1/sign` request to fail with `503 tsa_unavailable` when TSA cannot be reached.

## Monitoring
- Emit structured JSON metrics via `api/src/plugins/metrics.js`
- See `docs/MONITORING.md` for event names, SLOs, and alert suggestions
 - Prometheus metrics under `/metrics` include:
   - `certnode_requests_total{method,path,status}`
   - `certnode_request_duration_ms` histogram
   - `certnode_rate_limit_triggered_total`
   - `certnode_errors_total{method,path,status}` (status >= 400)

## Metrics Quickstart
- Events (one-line JSON):
  - `request_received` - { path, method, request_id }
  - `request_completed` - { path, method, status, ms, request_id }
  - `rate_limit_triggered` - { path, capacity, remaining, request_id }
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


### Maintainer shortcuts
- Web SDK: normalize → version bump → tag → publish via Actions:
  - PowerShell:
    - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/publish-web-sdk.ps1`
  - Requires `NPM_TOKEN` repo secret and will output CDN + SRI snippet after publish.
- Node SDK: normalize → version bump → tag → publish via Actions:
  - PowerShell:
    - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/publish-node-sdk.ps1`
  - Requires `NPM_TOKEN` repo secret; workflow publishes `@certnode/sdk` on tag `sdk-node-vX.Y.Z`.

Or use compose:
```
docker compose up --build
```

## Contributing
- See `CONTRIBUTING.md` for contribution guidelines and optional auto-push hook instructions.
 - CI posts a Benchmark Summary table (P50/P95/P99) on PRs for quick performance visibility.

# CertNode

Tamper‑evident receipt service using ES256 (P‑256) and RFC 8785 JCS.

## Quick Links
- Web verify page: `web/verify.html`
- Node SDK: `sdk/node` (package: `@certnode/sdk`)
- Web SDK (ESM): `sdk/web` (package: `@certnode/sdk-web`)
- CLI verifier: `tools/verify-receipt.js`
- Rotation/integrity: `docs/ROTATION.md`, tools in `tools/`
- Monitoring: `docs/MONITORING.md`
- Release checklist: `docs/RELEASE.md`

## Fast Tests
```
node tools/test-fast.js
```

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
  - Web:  `examples/web-embed.html`

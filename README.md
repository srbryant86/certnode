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

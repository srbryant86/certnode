# CertNode Canonical Roadmap (Application + Cross‑cutting)

Single source of truth for application-layer scope and delivery status.

## Core Architecture
- ES256 (ECDSA P‑256) only; RFC 7515/7638/8785 compliance
- JCS canonicalization before signing/verification
- Minimal receipt: { protected, signature, payload, kid, payload_jcs_sha256, receipt_id[, tsr] }
- Zero-dependency SDKs (Node + browser)
- AWS KMS integration (RAW ECDSA_SHA_256)

## Delivery Map (Application a1–a33)

| Task | Status | Description | Key Files |
|------|--------|-------------|-----------|
| a1 | present | Receipts-by-default: /v1/sign | api/src/routes/sign.js |
| a2 | present | Crypto utils: JCS; DER↔JOSE; kid | api/src/util/jcs.js; api/src/util/derToJose.js; api/src/util/joseToDer.js; api/src/util/kid.js |
| a3 | present | KMS adapter (RAW) + resilience | api/src/aws/kms.js; api/src/crypto/signer.js |
| a4 | present | Env & startup guards | api/src/config/env.js |
| a5 | present | Logging & metrics base | api/src/plugins/logging.js; api/src/plugins/metrics.js |
| a6 | present | Dev-only /v1/verify route | api/src/routes/verify.js |
| a7 | present | Security headers (HSTS in prod) | api/src/plugins/security.js |
| a8 | present | Validation middleware | api/src/plugins/validation.js |
| a9 | present | Smoke scripts | tools/smoke-receipt.js |
| a10 | present | Rate limit v1 (token bucket) | api/src/plugins/ratelimit.js |
| a11 | present | Rate limit v2 + tests | api/test/ratelimit.unit.test.js |
| a12 | present | JWKS tooling & manifest | api/src/util/manifest.js; api/src/util/jwks.js |
| a13 | present | Dev JWKS endpoint | api/src/routes/jwks.js |
| a14 | present | CORS hardening | api/src/plugins/cors.js |
| a15 | present | OpenAPI spec serving | api/src/routes/openapi.js |
| a16 | present | Offline CLI verifier | tools/verify-receipt.js; tools/verify-lib.js |
| a17 | present | Enhanced error handling | api/src/middleware/errorHandler.js; api/src/plugins/errors.js |
| a18 | present | SDK verification (Node + web) | sdk/node/index.js; sdk/web/index.js |
| a19 | present | Browser WebCrypto verification | web/js/verify.js |
| a20 | present | Correlation IDs | api/src/plugins/requestId.js |
| a21 | present | Payload size warnings | api/src/plugins/validation.js; api/src/config/env.js |
| a22 | present | Health & metrics | api/src/routes/health.js; api/src/plugins/metrics.js |
| a23 | present | Performance benchmarking | tools/benchmark.js; api/test/benchmark.test.js |
| a24 | present | SDK publishing prep | sdk/node/README.md; sdk/node/CHANGELOG.md; sdk/node/package.json |
| a25 | present | Browser demo page polish | web/verify.html; web/assets/certnode.css |
| a26 | present | Advanced JWKS management | tools/jwks-*.js; sdk/*/jwks-manager.js; docs/ROTATION.md; api/test/jwks.*.test.js |
| a27 | present | Production hardening docs | docs/SECURITY.md; THREAT_MODEL.md; RUNBOOK.md; SLOS.md; PRIVACY.md |
| a28 | present | Prometheus metrics endpoint | api/src/plugins/metrics.js; api/src/routes/metrics.js; api/src/server.js |
| a29 | present | Nightly benchmark workflow | .github/workflows/nightly-benchmark.yml |
| a30 | present | Verify UI polish | web/verify.html; web/assets/certnode.css |
| a31 | present | Examples & dev tools | examples/*; tools/dev-generate-jwks.js |
| a32 | present | OpenAPI/clients polish | web/openapi.json; tools/check-openapi.js; CI check |
| a33 | present | Root scripts | package.json (root); README.md |
| s14 | present | Web SDK bundle option | tools/build-web-sdk.js; tools/size-web-sdk.js; sdk/web/dist |

## Cross‑Cutting Items (present)
| Label | Status  | Description | Key Files |
|------|---------|-------------|-----------|
| c12  | present | Release workflow via tags | .github/workflows/release.yml; docs/RELEASE.md |
| c13  | present | CI: CI workflow, commit lint (non‑strict), integrity checks | .github/workflows/ci.yml; tools/commit-lint.js |
| d10  | present | Docs: MONITORING, taxonomy, CONTRIBUTING | docs/MONITORING.md; docs/TASK_TAXONOMY.md; CONTRIBUTING.md |

## Missing Components / Next Up
- i01 — Containerization (Dockerfile + compose + GHCR build)
- m04 — Monitoring pack (Prometheus scrape, alerts, Grafana dashboard JSON)
- w12 — Verify hardening (CSP: no inline; a11y polish)
- c13 — PR template, CODEOWNERS, Dependabot; consider strict commit‑lint on PRs
- a34 — Error model consistency across endpoints
- r03 — Unified `jwks-tool.js` command (integrity, rotate, thumbprints, diff)
- e03 — Clients/Postman collection

## Future Roadmap (a24–a27)
- a24 — SDK publishing (npm pack/dry‑run, README, types, versioning policy; plan browser distribution)
- a25 — Browser demo polish (web/verify.html drag/drop; JWKS input; error mapping)
- a26 — Advanced JWKS management (refresh detection, caching, rotation tests, integrity/staleness checks)
- a27 — Production hardening review (security audit checklist, deployment validation, monitoring readiness)

## Notes
- Track detailed task scopes and acceptance in docs/internal/TASKS_TODO.md.
- Keep commit subjects as `feat(aNN): ...` for traceability.

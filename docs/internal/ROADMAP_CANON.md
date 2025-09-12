# CertNode Canonical Roadmap (a1–a20)

**Single source of truth** — Application layer components scope and delivery status.

## Core Architecture Definitions

- **ES256 (ECDSA P-256) only** — RFC compliance focus
- **JCS canonicalization** — RFC 8785 before signing/verification  
- **Minimal receipt format** — {protected, signature, payload, kid, payload_jcs_sha256, receipt_id[, tsr]}
- **Zero-dependency SDK** — Node/browser compatibility
- **AWS KMS integration** — Enterprise-grade key management

---

## Delivery Map (a1–a20)

| Task | Status | Description | Key Files | Aliases/Notes |
|------|--------|-------------|-----------|---------------|
| **a1** | ✅ | Receipts-by-default: /v1/sign returns minimal receipt format | `api/src/routes/sign.js` | Core delivery mechanism |
| **a2** | ✅ | Crypto utils: RFC8785 JCS; DER↔JOSE; RFC7638 kid | `api/src/util/jcs.js`, `api/src/util/derToJose.js`, `api/src/util/kid.js` | Cryptographic foundations |
| **a3** | ✅ | KMS adapter (RAW) + resilience: ECDSA_SHA_256, retries, circuit breaker | `api/src/aws/kms.js` | Enterprise key management |
| **a4** | ❌ | Env & startup guards: validates PORT, MAX_BODY_BYTES, RATE_LIMIT_RPM | `api/src/config/env.js` | *Missing - needs implementation* |
| **a5** | ✅ | Logging & metrics base: hash-only logs; counters/timers | `api/src/plugins/logging.js`, `api/src/plugins/metrics.js` | Observability foundation |
| **a6** | ✅ | Dev-only /v1/verify route (non-prod) | `api/src/routes/verify.js` | Development tooling |
| **a7** | ❌ | Security headers: X-Content-Type-Options, Referrer-Policy, HSTS | `api/src/plugins/security.js` | *Missing - needs implementation* |
| **a8** | ✅ | Validation middleware: strict schema + clear errors, body-size guard | `api/src/plugins/validation.js` | Input validation |
| **a9** | ✅ | Smoke scripts: basic health checks | `api/scripts/smoke.sh`, `api/scripts/smoke.ps1` | *Alias: smoke scripts exist* |
| **a10** | ✅ | Rate limit v1: basic token bucket | `api/src/plugins/ratelimit.js` | Traffic management |
| **a11** | ✅ | Rate limit v2: tunables + tests | `api/test/ratelimit.unit.test.js` | Enhanced rate limiting |
| **a12** | ✅ | JWKS tooling: current+previous manifest | `api/scripts/jwks-make-manifest.js` | Key rotation support |
| **a13** | ✅ | Node SDK (thin verify) + examples/tests | `sdk/node/index.js`, `api/test/verify.sdk.node.test.js` | Client integration |
| **a14** | ✅ | CORS hardening: allowlist + strict preflight | `api/src/plugins/cors.js` | Cross-origin security |
| **a15** | ✅ | Structured error model: consistent JSON error schema/mapper | `api/src/plugins/errors.js` | Error standardization |
| **a16** | ✅ | Offline verifier CLI: tools/verify-receipt.js PASS \| FAIL | `tools/verify-receipt.js` | Offline verification |
| **a17** | ✅ | OpenAPI + pitch page | `api/src/routes/openapi.js`, `web/openapi.html`, `web/pitch.html` | API documentation |
| **a18** | ✅ | Enhanced errors/breaker polish: categorized errors, wrapHandler | `api/src/plugins/errors.js`, `api/src/aws/kms.js` | *Alias: enhanced error handling* |
| **a19** | ✅ | Offline web verifier page (paste receipt + JWKS) | `web/verify.html`, `web/js/verify.js` | Web-based verification |
| **a20** | ✅ | TSA plumbing (mock path only) | `api/src/util/timestamp.js` | Timestamp authority integration |

---

## Missing Components

**Priority: a4, a7** — Core infrastructure components needed for production readiness.

- **a4**: Environment validation prevents misconfigurations
- **a7**: Security headers provide defense-in-depth

**Delivery**: Minimal implementations with tiny node-only tests.
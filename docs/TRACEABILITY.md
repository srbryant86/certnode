# CertNode Traceability Matrix

This document maps major capabilities to implementation and tests. The previous version suffered encoding corruption and has been replaced with a clean summary. If you have the pristine original, please open a PR to restore it; until then this serves as the single source of truth.

## Mapping Overview

| ID | Area | Implementation | Tests | Status |
|----|------|----------------|-------|--------|
| a1 | Signing API | `api/src/routes/sign.js` | `api/test/validation.sign.test.js` | OK |
| a2 | JWKS Endpoint | `api/src/routes/jwks.js` | `api/test/routes.jwks.test.js` | OK |
| a3 | OpenAPI Spec | `api/src/routes/openapi.js`, `public/openapi.json` | `api/test/openapi.test.js` | OK |
| a4 | Security Headers | `api/src/plugins/security.js`, `vercel.json` | `api/test/security.headers.test.js` | OK |
| a5 | Node SDK Verify | `sdk/node/index.js` | `api/test/verify.sdk.node.test.js` | OK |

Notes:
- The OpenAPI route reads from `public/openapi.json` to avoid drift. The interactive viewer at `/openapi` uses the vendored Scalar script (`public/vendor/scalar/api-reference.js`).
- JWKS route returns `application/jwk-set+json` with `Cache-Control: public, max-age=300`.
- Security headers follow strict defaults; legacy `X-XSS-Protection` can be enabled via `LEGACY_X_XSS_PROTECTION=1`.

## Acceptance Handoff

The repository includes a CI check (`tools/check-encoding.js`) that fails when encountering replacement characters or zero‑length assets in `assets/` and `web/assets/`. Pre‑commit and pre‑push hooks run the same check locally.


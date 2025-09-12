# Project Summary — CertNode

## What it does (short)
- Signs **JCS-normalized** JSON payloads (ES256, P-256).
- Returns a minimal receipt `{protected, payload, signature, kid, payload_jcs_sha256, receipt_id}`.
- Public **JWKS** used for offline verification.

## Current components (presence only)
- ✅ api/src/index.js
- ✅ api/src/routes/sign.js
- ✅ api/src/util/jcs.js
- ✅ api/src/util/joseToDer.js
- ✅ api/src/util/derToJose.js
- ✅ api/src/util/kid.js
- ✅ tools/verify-receipt.js
- ✅ tools/verify-lib.js
- ✅ sdk/node/index.js
- ✅ sdk/node/index.d.ts
- ✅ sdk/web/index.js
- ✅ sdk/web/index.d.ts
- ✅ web/js/verify.js
- ✅ web/verify.html

## Endpoints
- `POST /v1/sign` — accepts `{ payload, headers? }`, returns receipt (JWS-like).

## Tools / SDK
- `tools/verify-receipt.js` — offline verifier CLI (JWKS file/URL).
- `sdk/node`, `sdk/web` — verify helpers (present if listed above).

## Constraints
- ES256 (ECDSA P-256) only.
- RFC 8785 (JCS) canonicalization before signing/verifying.
- DER↔JOSE conversion for ECDSA.
- kid: RFC 7638 JWK thumbprint.
- Node 20, CommonJS in /api. No secrets in repo.

## Completed tasks (from git)
- a01 — completed (see git history)
- a02 — completed (see git history)
- a03 — completed (see git history)
- a04 — completed (see git history)
- a05 — completed (see git history)
- a06 — completed (see git history)
- a07 — completed (see git history)
- a08 — completed (see git history)
- a09 — completed (see git history)
- a10 — completed (see git history)
- a11 — completed (see git history)
- a12 — completed (see git history)
- a13 — completed (see git history)
- a14 — completed (see git history)
- a15 — completed (see git history)
- a16 — completed (see git history)
- a17 — completed (see git history)
- a18 — completed (see git history)

## Next task: a19
- Edit `docs/internal/TASKS_TODO.md` to define scope + acceptance, then implement strictly that.

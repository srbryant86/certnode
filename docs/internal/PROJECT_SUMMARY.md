# Project Summary — CertNode

## What it does (short)
- Signs **JCS-normalized** JSON payloads (ES256, P-256).
- Returns a minimal receipt `{protected, payload, signature, kid, payload_jcs_sha256, receipt_id}`.
- Public **JWKS** used for offline verification.

## Current Endpoints
- `POST /v1/sign` — accepts `{ payload, headers? }`, returns receipt with correlation headers
- `GET /v1/health` — health check with dependency status and circuit breaker state  
- `GET /jwks` (dev-only) — JWKS endpoint (404 in production)
- `GET /openapi.json` — OpenAPI 3.1 specification with caching

## Cryptographic Pipeline
```
Input JSON → RFC 8785 JCS → Protected Header (ES256 + RFC7638 kid) → 
Signing Input → AWS KMS RAW ECDSA_SHA_256 (prod) → DER→JOSE → Receipt
```

**Receipt ID Derivation**: `SHA256(protected + '.' + b64u(JCS(payload)) + '.' + signature)`

## Tools / SDK
- `tools/verify-receipt.js` — offline verifier CLI with JWKS file/URL support
- `tools/test-fast.js` — fast test runner with 15s timeout per test
- `tools/smoke-receipt.js` — Node-only smoke test with receipt verification
- `sdk/node` — zero-dependency Node.js verification SDK
- `sdk/web` — browser WebCrypto verification SDK with full ES256 support

## Privacy and Logging Constraints
- **No payload logging** — only hashes and correlation IDs logged
- **Hash-only structured logs** — JSON format with request_id correlation
- **Environment-aware errors** — sanitized responses in production mode
- **Size warnings** — configurable soft limits with structured console warnings

## Architecture Constraints
- ES256 (ECDSA P-256) only — no other signature algorithms
- RFC 8785 (JCS) canonicalization before signing/verifying
- DER↔JOSE conversion for ECDSA signatures
- kid = RFC 7638 JWK thumbprint (never arbitrary strings)
- JWKS served statically via S3+CloudFront (never from API)
- Node 20, CommonJS in /api. No secrets in repository.
- Single production dependency: `@aws-sdk/client-kms`

## Completed Application Layer Tasks (a1-a21)
- **a1-a3** — Core signing, crypto utils, KMS integration with resilience
- **a4-a8** — Environment guards, logging/metrics, dev tools, security headers, validation
- **a9-a12** — Smoke scripts, rate limiting (v1+v2), JWKS tooling
- **a13-a16** — Dev JWKS endpoint, CORS hardening, OpenAPI spec, offline CLI verifier
- **a17-a21** — Enhanced errors, SDK verification, WebCrypto, correlation IDs, payload size controls

## Quality Gates
- **Fast Test Suite**: `node tools/test-fast.js` — all unit tests with timeouts
- **Smoke Test**: `node tools/smoke-receipt.js` — end-to-end receipt verification  
- **Health Check**: `node api/test/health.test.js` — dependency validation
- **Audit Documentation**: QUALITY.md, AUDIT_CHECKLIST.md, TRACEABILITY.md
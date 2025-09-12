# CertNode Traceability Matrix

**Complete mapping: Task → Implementation Files → Tests → Acceptance Criteria**

| Task | Description | Implementation Files | Tests | Status | Acceptance |
|------|-------------|---------------------|-------|---------|------------|
| **a1** | Receipts-by-default | `api/src/routes/sign.js`<br/>`api/src/util/kid.js` | `api/test/routes.sign.test.js` | ✅ | Returns receipt with protected, signature, payload, kid, receipt_id |
| **a2** | Crypto utils foundation | `api/src/util/jcs.js`<br/>`api/src/util/derToJose.js`<br/>`api/src/util/joseToDer.js`<br/>`api/src/util/kid.js` | `api/test/jcs.test.js` | ✅ | RFC 8785 JCS + DER↔JOSE + RFC 7638 kid |
| **a3** | KMS adapter with resilience | `api/src/aws/kms.js`<br/>`api/src/crypto/signer.js` | `api/test/crypto.kms.test.js`<br/>`api/test/kms.wrapper.test.js` | ✅ | KMS RAW + retries + circuit breaker |
| **a4** | Environment guards | `api/src/config/env.js` | `api/test/env.guard.test.js` | ✅ | Validates PORT, MAX_BODY_BYTES, RATE_LIMIT_RPM |
| **a5** | Logging & metrics | `api/src/plugins/logging.js`<br/>`api/src/plugins/metrics.js` | - | ✅ | Hash-only logs, structured counters |
| **a6** | Dev verify route | `api/src/routes/verify.js` | `api/test/verify.test.js`<br/>`api/test/verify.cli.test.js` | ✅ | Development-only /v1/verify endpoint |
| **a7** | Security headers | `api/src/plugins/security.js` | `api/test/security.headers.test.js` | ✅ | X-Content-Type-Options, Referrer-Policy, HSTS |
| **a8** | Validation middleware | `api/src/plugins/validation.js` | `api/test/validation.test.js`<br/>`api/test/validation.sign.test.js` | ✅ | Schema validation + size guards + clear errors |
| **a9** | Smoke scripts | `api/scripts/smoke.sh`<br/>`api/scripts/smoke.ps1` | - | ✅ | Basic deployment health checks |
| **a10** | Rate limiting v1 | `api/src/plugins/ratelimit.js` | `api/test/ratelimit.test.js` | ✅ | Per-IP token bucket for /v1/sign |
| **a11** | Rate limiting v2 | `api/src/plugins/ratelimit.js` | `api/test/ratelimit.unit.test.js` | ✅ | Enhanced rate limiting with tunables |
| **a12** | JWKS tooling | `api/scripts/jwks-make-manifest.js`<br/>`api/src/util/jwks.js`<br/>`api/src/util/manifest.js` | `api/test/manifest.test.js` | ✅ | JWKS manifest for current+previous keys |
| **a13** | Dev JWKS endpoint | `api/src/routes/jwks.js` | `api/test/routes.jwks.test.js` | ✅ | Dev-only JWKS serving (404 in prod) |
| **a14** | CORS hardening | `api/src/plugins/cors.js` | `api/test/cors.test.js`<br/>`api/test/cors.integration.test.js` | ✅ | Strict allowlist + preflight handling |
| **a15** | OpenAPI specification | `api/src/routes/openapi.js` | `api/test/openapi.test.js`<br/>`api/test/openapi.endpoint.test.js` | ✅ | OpenAPI 3.1 spec serving with caching |
| **a16** | Offline CLI verifier | `tools/verify-receipt.js`<br/>`tools/verify-lib.js` | `api/test/verify.cli.test.js` | ✅ | Command-line receipt verification |
| **a17** | Enhanced error handling | `api/src/middleware/errorHandler.js`<br/>`api/src/plugins/errors.js` | `api/test/errorHandler.test.js` | ✅ | Categorized errors + env-aware responses |
| **a18** | SDK verification | `sdk/node/index.js`<br/>`sdk/web/index.js` | `api/test/sdk.node.test.js`<br/>`api/test/verify.sdk.node.test.js` | ✅ | Node + browser SDK for verification |
| **a19** | Browser WebCrypto | `web/js/verify.js` | `api/test/verify.sdk.browser.test.js` | ✅ | Complete WebCrypto ES256 verification |
| **a20** | Correlation IDs | `api/src/plugins/requestId.js`<br/>`api/src/middleware/errorHandler.js` | `api/test/request-id.test.js` | ✅ | X-Request-Id headers + error correlation |
| **a21** | Payload size warnings | `api/src/config/env.js`<br/>`api/src/plugins/validation.js`<br/>`api/src/routes/sign.js` | `api/test/payload-size.test.js` | ✅ | Soft warnings + hard limits + headers |
| **a22** | Health & Metrics | `api/src/routes/health.js`<br/>`api/src/plugins/metrics.js`<br/>`api/src/aws/kms.js`<br/>`api/src/server.js` | `api/test/health.test.js` | ✅ | /healthz endpoint + structured console metrics + KMS circuit state |

| **a23** | Performance benchmarking | `tools/benchmark.js` | `api/test/benchmark.test.js` | �o. | p95/p99 latency reporting with memory tracking |

## Test Coverage Matrix

| Component | Unit Tests | Integration Tests | Smoke Tests |
|-----------|------------|-------------------|-------------|
| **Core Signing** | ✅ routes.sign.test.js | ✅ smoke-receipt.js | ✅ API scripts |
| **Cryptography** | ✅ jcs.test.js, crypto.kms.test.js | ✅ verify.cli.test.js | - |
| **Validation** | ✅ validation.test.js, payload-size.test.js | ✅ validation.sign.test.js | - |
| **Rate Limiting** | ✅ ratelimit.unit.test.js | ✅ ratelimit.test.js | - |
| **Error Handling** | ✅ errorHandler.test.js, request-id.test.js | - | - |
| **Security** | ✅ security.headers.test.js, cors.test.js | ✅ cors.integration.test.js | - |
| **SDK/CLI** | ✅ sdk.node.test.js, verify.cli.test.js | ✅ verify.sdk.browser.test.js | - |
| **Health/Config** | ✅ health.test.js, env.guard.test.js | - | ✅ health endpoint |

## Acceptance Test Mapping

### Fast Quality Gates
- **`tools/test-fast.js`** → Runs all unit tests with 15s timeout
- **`tools/smoke-receipt.js`** → End-to-end receipt verification
- **`api/test/health.test.js`** → Health endpoint validation

### Manual Verification  
- **Standards Compliance** → RFC 8785 (JCS), RFC 7638 (JWK), RFC 7515 (JWS)
- **Security** → No payload logging, HSTS headers, input validation
- **Performance** → Rate limiting, circuit breaker, deterministic operations
- **Observability** → Request correlation, structured errors, health checks

## Audit Trail

| Version | Date | Changes | Validation |
|---------|------|---------|------------|
| v0.1.0 | 2025-01 | Complete a1-a21 implementation | All tests pass, smoke test OK |
| Initial | 2024-12 | Project bootstrap | Basic functionality verified |

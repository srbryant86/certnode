# CertNode Application Layer Tasks (a13-a17)

Based on the current state of the project (completed through a12), here are the next 5 application layer tasks with file-by-file implementation plans and test requirements.

## Task a13: Implement JWKS Endpoint

**Description**: Create production JWKS endpoint to serve current and previous public keys from S3/CloudFront manifest.

**Priority**: High - Critical for JWS verification by external clients

**Files to modify**:
- `api/src/routes/jwks.js` - Implement JWKS HTTP handler
- `api/src/server.js` - Add route for `GET /v1/jwks` and `GET /.well-known/jwks.json`
- `api/src/util/manifest.js` - Enhance for JWKS manifest loading from S3
- `api/src/util/jwks.js` - Add production JWKS formatting functions

**Tests required**:
- `api/test/routes.jwks.test.js` - HTTP endpoint tests (200, 404, content-type)
- `api/test/manifest.jwks.test.js` - Manifest parsing and JWKS formatting
- Integration test for S3/CloudFront manifest fetching

**Acceptance criteria**:
- Returns RFC 7517 compliant JWKS with current+previous keys
- Proper caching headers (max-age, etag)
- Handles manifest fetch failures gracefully
- No secrets in logs (only key IDs)

## Task a14: Complete OpenAPI Specification

**Description**: Generate comprehensive OpenAPI 3.0 specification documenting all endpoints.

**Priority**: Medium - Important for API documentation and client generation

**Files to modify**:
- `web/openapi.json` - Complete OpenAPI 3.0 specification
- `web/openapi.html` - Enhance Swagger UI presentation
- `api/scripts/generate-openapi.js` - Script to generate spec from code
- `api/src/routes/*.js` - Add JSDoc comments for OpenAPI generation

**Tests required**:
- `api/test/openapi.validation.test.js` - Validate generated spec against schema
- `tools/test/openapi.examples.test.js` - Test all example requests/responses
- Integration test for Swagger UI rendering

**Acceptance criteria**:
- Complete specification for /v1/sign, /v1/health, /v1/jwks, /v1/verify
- Request/response schemas with examples
- Authentication/authorization documentation
- Rate limiting headers documented
- Error response schemas

## Task a15: Enhanced Security Headers

**Description**: Add comprehensive security headers and CSP for defense in depth.

**Priority**: Medium - Improves security posture

**Files to modify**:
- `api/src/plugins/security.js` - Implement security headers middleware
- `api/src/server.js` - Wire security middleware before routing
- `web/index.html` - Add CSP meta tags for static content
- `api/src/config/env.js` - Add security configuration options

**Tests required**:
- `api/test/security.headers.test.js` - Verify all security headers present
- `api/test/csp.test.js` - Test Content Security Policy enforcement
- `tools/test/security.scan.js` - Automated security header scanning

**Acceptance criteria**:
- HSTS, X-Frame-Options, X-Content-Type-Options headers
- Content Security Policy for XSS protection
- X-RateLimit headers for all endpoints
- Configurable via environment variables
- No impact on existing functionality

## Task a16: Structured Logging & Metrics

**Description**: Implement structured JSON logging with metrics collection for observability.

**Priority**: Medium - Critical for production monitoring

**Files to modify**:
- `api/src/plugins/logging.js` - Structured logger with context
- `api/src/plugins/metrics.js` - Enhance with custom metrics
- `api/src/routes/sign.js` - Add request/response logging
- `api/src/routes/jwks.js` - Add access logging
- `api/src/util/timestamp.js` - Add TSA metrics

**Tests required**:
- `api/test/logging.structured.test.js` - Verify JSON log format
- `api/test/metrics.collection.test.js` - Test metrics aggregation
- `api/test/privacy.logging.test.js` - Ensure no sensitive data logged

**Acceptance criteria**:
- JSON structured logs with correlation IDs
- Request/response timing metrics
- Rate limit metrics per IP
- KMS operation metrics (success/failure/latency)
- Log only hashes/IDs, never payload content
- Configurable log levels

## Task a17: Advanced Input Validation

**Description**: Enhance validation with custom payload schema validation and size optimization.

**Priority**: Low - Performance and security enhancement

**Files to modify**:
- `api/src/plugins/validation.js` - Add JSON schema validation
- `api/src/util/jcs.js` - Optimize canonicalization performance
- `api/src/routes/sign.js` - Add schema-based payload validation
- `api/src/config/schemas/` - Create JSON schemas directory

**Tests required**:
- `api/test/validation.schemas.test.js` - Test custom schema validation
- `api/test/jcs.performance.test.js` - Benchmark canonicalization
- `api/test/validation.edge.test.js` - Edge cases and malformed input

**Acceptance criteria**:
- Optional JSON schema validation for payloads
- Configurable payload schema via environment
- 10x performance improvement in JCS canonicalization
- Detailed validation error messages
- Backward compatibility with existing clients

## Implementation Notes

**Testing Strategy**:
- Each task requires minimum 90% code coverage
- Include integration tests with real AWS KMS (using test keys)
- Performance benchmarks for critical paths
- Security-focused test cases for all validation logic

**Deployment Considerations**:
- All changes must maintain backward compatibility
- Feature flags for gradual rollout
- Proper error handling and graceful degradation
- Documentation updates for operational procedures

**Dependencies**:
- Tasks can be implemented in parallel except a14 depends on a13 for JWKS documentation
- All tasks build on existing validation and rate limiting infrastructure
- No new external dependencies required
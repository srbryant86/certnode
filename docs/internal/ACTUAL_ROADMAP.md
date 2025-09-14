# CertNode Application Roadmap - Complete Implementation Guide
 - s17 � Node SDK Docs: README cleaned and examples updated; no new publish required

## **Executive Summary**
CertNode is a production-ready **tamper-evident receipt service** using detached JWS with ES256 ECDSA and RFC 8785 JCS canonicalization. The application layer is **100% complete** (a1-a18) with comprehensive error handling, health monitoring, SDKs, and robust testing infrastructure.

---

## Roadmap Update (2025-09-13)

Completed since last update
- w12 — Verify Page Hardening: removed inline JS; tightened CSP; added a11y attributes for dropzones
- a34 — Error Model Consistency: standardized error bodies and X-Request-Id across routes; aligned OpenAPI; tests updated
- a23 (bench) — Performance benchmark script fixes: correct /v1/sign request shape; disable rate-limiting during bench; resilient output
- a35 — Verify Route Alignment: dev verify route standardized to error model; tests added
- w13 — Verify Page A11y Polish: aria-live status, labelled file inputs, skip link
- s15 — SDK-web Publish Readiness: added types field, SRI tool, README CDN/SRI; CI builds/sizes web SDK
- t15 — Fuzz/Edge Tests: added validation fuzz cases for invalid JSON, unknown fields, kid variants, and tsr type
- a36 — OpenAPI Consistency: added error responses for /health (405/500) referencing shared ErrorResponse
 - s16 — Web SDK Publish: tagged @certnode/sdk-web v0.1.3; README + CDN/SRI docs; CI enforces size gate

## Roadmap Update (2025-09-12)

Completed since last update
- a22 — Health & Metrics: /healthz endpoint, structured metrics, KMS circuit state
- a23 — Performance Benchmarking: tools/benchmark.js (p95/p99, memory tracking)
- a24 — SDK Publishing Prep: Node SDK README/CHANGELOG/scripts; pack/dry‑run
  - Files: sdk/node/README.md, sdk/node/CHANGELOG.md, sdk/node/package.json
- a25 — Browser Demo Page Polish: verify UI, UX helpers, formatting/minify, copy
  - Files: web/verify.html, web/assets/certnode.css
- a26 — Advanced JWKS Management: integrity + rotation tools; JWKS managers (Node/Web); docs; tests
  - Files: tools/jwks-integrity-check.js, tools/jwks-rotate-validate.js,
    sdk/node/jwks-manager.js, sdk/web/jwks-manager.js, docs/ROTATION.md,
    api/test/jwks.integrity.test.js, api/test/jwks.rotate.test.js
- a27 — Production Hardening Docs: security, privacy, threat model, runbook, SLOs; audit checklist refresh
  - Files: docs/SECURITY.md, docs/PRIVACY.md, docs/THREAT_MODEL.md, docs/RUNBOOK.md, docs/SLOS.md, docs/AUDIT_CHECKLIST.md
- a28 — Prometheus /metrics Endpoint + Aggregator
  - Files: api/src/plugins/metrics.js, api/src/routes/metrics.js, api/src/server.js, api/test/metrics.endpoint.test.js
- a29 — Nightly Benchmark Workflow
  - Files: .github/workflows/nightly-benchmark.yml
- a30 — Web Verify Polish: CSP meta, theme toggle (light/dark), JWKSManager integration, download result
  - Files: web/verify.html, web/assets/certnode.css
- a31 — Examples & Dev Tools: Node verify/sign examples; web embed; JWKS generator
  - Files: examples/node-verify.js, examples/node-sign.js, examples/web-embed.html, tools/dev-generate-jwks.js
- a32 — OpenAPI/Clients Polish: standard error schemas + examples; OpenAPI check tool; CI check
  - Files: web/openapi.json, tools/check-openapi.js, .github/workflows/ci.yml
- a33 — Root Scripts: convenience npm scripts
  - Files: package.json, README.md
\- s14 — Web SDK Bundle Option: minified ESM and size check
  - Files: tools/build-web-sdk.js, tools/size-web-sdk.js, sdk/web/dist/, sdk/web/package.json, sdk/web/README.md

Tagging & release plumbing
- c12 — Release workflow for SDKs (tags `sdk-node-v*`, `sdk-web-v*`) with NPM_TOKEN
  - Files: .github/workflows/release.yml, docs/RELEASE.md

See docs/internal/ROADMAP_CANON.md and docs/internal/TASKS_TODO.md for authoritative, up‑to‑date lists.

## **🏗️ Current Architecture (COMPLETED a1-a18)**

### **Phase 1: Core Infrastructure (a1-a6)**

#### **a1 - Core Receipt Generation** ✅ 
**Commit**: `ea60ebb` 
```
POST /v1/sign → {protected, signature, payload, kid, payload_jcs_sha256, receipt_id}
```
- **Files**: `api/src/routes/sign.js`, `api/src/util/jcs.js`, `api/src/util/kid.js`
- **Features**: RFC 8785 JCS canonicalization, RFC 7638 JWK thumbprints, receipt ID generation
- **Quality**: Production-ready with comprehensive validation

#### **a2 - KMS-Backed Cryptography** ✅
**Commit**: `001feac`
```
KMS ES256 signing + local fallback + manifest utilities
```
- **Files**: `api/src/crypto/signer.js`, `api/src/aws/kms.js`, `api/src/util/derToJose.js`
- **Features**: KMS ECDSA_SHA_256, DER↔JOSE conversion, local dev fallback
- **Quality**: Production-ready with error handling

#### **a3 - Development Verification Endpoint** ✅
**Commit**: `422cb44`
```
POST /v1/verify (dev-only) + offline JWS verification
```
- **Files**: `api/src/routes/verify.js`, `api/src/util/jwks.js`
- **Features**: Dev-only receipt verification, JWKS validation
- **Quality**: Environment-gated, secure

#### **a4 - Enhanced Health Monitoring** ✅
**Commit**: `97ca5fb`
```
GET /health, /v1/health → comprehensive status + dependency checks
```
- **Files**: `api/src/routes/health.js`, comprehensive tests
- **Features**: KMS connectivity validation, memory/uptime metrics, HTTP status codes (200/503/500)
- **Quality**: Production monitoring ready

#### **a5 - KMS Resilience & Circuit Breaker** ✅
**Commit**: `787d788`
```
Enhanced KMS adapter with retries, backoff, circuit breaker
```
- **Files**: `api/src/aws/kms.js`, `api/src/crypto/signer.js`
- **Features**: Jittered retries, circuit breaker pattern, graceful degradation
- **Quality**: Production-resilient

#### **a6 - Request Validation & Size Limits** ✅
**Commit**: `18513e5`
```
Strict validation for /v1/sign + body size guards
```
- **Files**: `api/src/plugins/validation.js`, comprehensive tests
- **Features**: Schema validation, size limits, clear error messages
- **Quality**: Security-hardened

### **Phase 2: Security & Reliability (a7-a12)**

#### **a7 - Global Error Handling** ✅
**Commit**: `5e894c8`
```
Comprehensive error middleware + global exception management
```
- **Files**: `api/src/middleware/errorHandler.js`, extensive tests
- **Features**: HTTP status mapping, dev/prod error exposure, async error catching, global handlers
- **Quality**: Enterprise-grade error handling

#### **a8 - Rate Limiting Foundation** ✅
**Commit**: `d24e0fa`
```
Per-IP token bucket rate limiting
```
- **Files**: `api/src/plugins/ratelimit.js`, unit tests
- **Features**: Token bucket algorithm, IP-based limiting, configurable thresholds
- **Quality**: DDoS protection ready

#### **a9 - Advanced Input Validation** ✅
**Commit**: `bf977b9`
```
Enhanced validation: schema + body/JCS size caps
```
- **Files**: Enhanced validation system, comprehensive tests
- **Features**: Multi-layer validation, size enforcement, attack prevention
- **Quality**: Security-hardened

#### **a10 - Enhanced Rate Limiting** ✅
**Commit**: `29193c8`
```
Tunable per-IP rate limiter with environment configuration
```
- **Files**: Enhanced rate limiting system, unit tests
- **Features**: Environment-driven configuration, flexible thresholds
- **Quality**: Production-tunable

#### **a11 - Defensive Input Guards** ✅
**Commit**: `999d757`
```
Additional input validation + body-size guard for /v1/sign
```
- **Files**: Layered validation system, unit tests
- **Features**: Defense in depth, multiple validation layers
- **Quality**: Attack-resistant

#### **a12 - Advanced Rate Limiting** ✅
**Commit**: `8e2ff93`
```
Per-IP token-bucket rate limiter with KMS shielding
```
- **Files**: Production-ready rate limiting, comprehensive tests
- **Features**: KMS protection, improved resilience
- **Quality**: Enterprise-grade

### **Phase 3: Integration & Developer Experience (a13-a16)**

#### **a13 - JWKS Development Endpoint** ✅
**Commit**: `4eb9ea7`
```
Dev-only JWKS endpoint + production 404
```
- **Files**: `api/src/routes/jwks.js`, environment gating
- **Features**: Development JWKS serving, production security
- **Quality**: Environment-aware, secure

#### **a14 - CORS Security** ✅
**Commit**: `2f07ad3`
```
Strict CORS with allowlist + preflight handling
```
- **Files**: `api/src/plugins/cors.js`, comprehensive tests
- **Features**: Origin allowlist, preflight OPTIONS, security headers
- **Quality**: Security-hardened CORS

#### **a15 - OpenAPI Specification Serving** ✅
**Commit**: `1815321`
```
/openapi.json endpoint + CORS + caching
```
- **Files**: `api/src/routes/openapi.js`, comprehensive tests
- **Features**: Spec serving, CORS-enabled, smart caching (5min dev, 1hr prod)
- **Quality**: Developer-friendly API documentation

#### **a16 - Offline Receipt Verification CLI** ✅
**Commit**: `a80717f`
```
tools/verify-receipt.js - PASS/FAIL with detailed reasons
```
- **Files**: `tools/verify-receipt.js`, `tools/verify-lib.js`, comprehensive tests
- **Features**: ES256/JCS validation, JWKS support, detailed error reporting
- **Quality**: Production operations tool

### **Phase 4: SDK & Developer Tools (a17-a18)**

#### **a17 - Node SDK Development** ✅
**Commit**: `d0b2aa4`
```
Node SDK wrapper + browser quick-check helper
```
- **Files**: `sdk/node/index.js`, browser helpers, comprehensive tests
- **Features**: CommonJS SDK, browser compatibility
- **Quality**: Developer-ready SDK

#### **a18 - Complete SDK Ecosystem** ✅
**Commit**: `5b9f791`
```
Minimal verify SDK (Node + browser) + comprehensive testing
```
- **Files**: `sdk/node/*`, `sdk/web/*`, `web/js/verify.js`, extensive test suite
- **Features**: Node.js SDK, Browser SDK, TypeScript definitions, WebCrypto implementation
- **Quality**: Production-ready SDK with full test coverage

---

## **🏆 Current Capabilities - What We Have Today**

### **✅ Production-Ready Features**
1. **Tamper-evident receipts** with JCS canonicalization and JWK thumbprints
2. **KMS-backed ES256 signing** with circuit breaker resilience
3. **Comprehensive error handling** with proper HTTP status codes and logging
4. **Health monitoring** with dependency checks and metrics
5. **Rate limiting** with per-IP token bucket protection
6. **CORS security** with origin allowlists
7. **Request validation** with schema and size enforcement
8. **Developer SDKs** for Node.js and Browser environments
9. **CLI tools** for offline verification
10. **OpenAPI documentation** served with caching
11. **Comprehensive test suite** with hang detection and progress indicators

### **🎯 API Endpoints Currently Available**
```
POST   /v1/sign              - Generate tamper-evident receipts
POST   /v1/verify            - Verify receipts (dev-only)
GET    /health, /v1/health   - Health status with dependency checks
GET    /jwks                 - JWKS public keys (dev-only)
GET    /openapi.json         - OpenAPI 3.1 specification
GET    /.well-known/jwks.json- Standard JWKS endpoint (dev-only)
```

### **🛡️ Security & Reliability Features**
- **Global error handling** with development/production error exposure
- **Rate limiting** with configurable per-IP token buckets
- **CORS protection** with origin allowlists
- **Input validation** with schema enforcement and size limits
- **Health monitoring** with KMS dependency validation
- **Circuit breaker** for KMS resilience
- **Security headers** via error middleware

### **📚 Developer Experience**
- **Node.js SDK** with TypeScript definitions
- **Browser SDK** with WebCrypto implementation
- **CLI verification tools** for operations
- **OpenAPI specification** with interactive documentation
- **Comprehensive testing** with 60+ test cases
- **Development tooling** with smoke scripts and audit tools

---

## **🚀 Future Roadmap (a19-a25) - Strategic Enhancements**

### **Phase 5: Production Operations (a19-a21)**

#### **a19 - SDK Package & Publishing** 
**Priority**: High | **Effort**: Medium
```
Package Node SDK for npm + browser CDN distribution
```
- **Scope**: 
  - Create `sdk/node/package.json` with proper npm metadata
  - Build pipeline for browser bundles (UMD/ESM)
  - README with usage examples and API documentation
  - Semantic versioning and changelog
- **Value**: Public SDK distribution, easier integration
- **Files**: `sdk/node/package.json`, `sdk/node/README.md`, build scripts
- **Tests**: Package integrity tests, import/require validation

#### **a20 - Enhanced Web Receipt Viewer**
**Priority**: Medium | **Effort**: Medium  
```
Interactive web interface for receipt verification
```
- **Scope**:
  - Drag/drop receipt JSON files
  - Copy/paste receipt content
  - JWKS URL input or file upload
  - Real-time validation with detailed error reporting
  - Receipt visualization with payload highlighting
- **Value**: User-friendly verification without CLI
- **Files**: `web/verify-enhanced.html`, `web/js/receipt-viewer.js`
- **Tests**: UI interaction tests, validation flow tests

#### **a21 - Monitoring & Metrics Collection**
**Priority**: High | **Effort**: Medium
```
Application metrics with Prometheus-compatible endpoint
```
- **Scope**:
  - Request counters by endpoint and status code
  - Response time histograms
  - KMS operation success/failure rates
  - Rate limiting trigger counts
  - Health check dependency status
- **Value**: Production observability and alerting
- **Files**: `api/src/middleware/metrics.js`, `/metrics` endpoint
- **Tests**: Metrics collection and format validation

### **Phase 6: Performance & Scale (a22-a24)**

#### **a22 - Caching & Performance Layer**
**Priority**: Medium | **Effort**: Large
```
Response caching + JWKS caching + performance optimizations
```
- **Scope**:
  - In-memory JWKS caching with TTL
  - Response caching for health/jwks endpoints
  - Request deduplication for duplicate receipts
  - Performance profiling and bottleneck analysis
- **Value**: Improved response times, reduced KMS calls
- **Files**: `api/src/middleware/cache.js`, performance monitoring
- **Tests**: Cache behavior tests, performance benchmarks

#### **a23 - Advanced Validation & Security**
**Priority**: Medium | **Effort**: Medium
```
Enhanced security features + advanced threat detection
```
- **Scope**:
  - Request fingerprinting for anomaly detection
  - Enhanced rate limiting with burst protection
  - Payload analysis for malicious patterns
  - Security event logging and alerting
- **Value**: Advanced threat protection
- **Files**: `api/src/middleware/security-advanced.js`
- **Tests**: Security scenario tests, threat simulation

#### **a24 - Database Integration & Receipt Storage**
**Priority**: Low | **Effort**: Large
```
Optional receipt storage with audit trail capabilities
```
- **Scope**:
  - PostgreSQL/DynamoDB integration for receipt storage
  - Audit trail with immutable logs
  - Query API for receipt lookup
  - Retention policies and cleanup
- **Value**: Audit capabilities, receipt history
- **Files**: `api/src/database/`, storage middleware
- **Tests**: Database integration tests, audit trail validation

### **Phase 7: Advanced Features (a25)**

#### **a25 - Timestamp Authority Integration**
**Priority**: Low | **Effort**: Large
```
RFC 3161 Timestamp Authority integration for enhanced proof
```
- **Scope**:
  - TSA client implementation
  - Timestamp token embedding in receipts
  - TSA response validation
  - Multiple TSA provider support
- **Value**: Enhanced non-repudiation, legal admissibility
- **Files**: `api/src/tsa/`, timestamp middleware
- **Tests**: TSA integration tests, timestamp validation

---

## **📋 Implementation Priority Matrix**

### **High Priority (Immediate Value)**
1. **a19 - SDK Publishing**: Enable public consumption
2. **a21 - Metrics Collection**: Essential for production monitoring

### **Medium Priority (Near-term Enhancement)**
3. **a20 - Enhanced Web Viewer**: Improves user experience
4. **a22 - Caching Layer**: Performance optimization
5. **a23 - Advanced Security**: Enhanced protection

### **Low Priority (Future Consideration)**
6. **a24 - Database Integration**: Complex but valuable for audit
7. **a25 - TSA Integration**: Specialized legal/compliance use case

---

## **🎯 Next Steps Recommendation**

**Immediate Action Plan:**
1. **Start with a19** - SDK packaging and publishing
2. **Follow with a21** - Metrics collection for production readiness
3. **Assess user feedback** to prioritize remaining features

**Success Metrics:**
- SDK download/usage statistics
- Production deployment stability
- Performance benchmarks
- Security incident reduction
- Developer adoption rates

This roadmap positions CertNode as a **comprehensive, production-ready tamper-evident receipt service** with enterprise-grade reliability, security, and developer experience.

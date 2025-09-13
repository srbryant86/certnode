# Tasks — CertNode (Application Layer)

You are operating only on the application layer. Do not change infra/secrets.

Labeling: use `aNN` for application tasks. See `docs/TASK_TAXONOMY.md` for other labels (iNN, wNN, dNN, sNN, tNN, cNN, mNN, rNN, eNN, gNN).

## Completed (a1–a33)
- a1 — Receipts-by-default: /v1/sign returns minimal receipt format
- a2 — Crypto utils: RFC8785 JCS, DER↔JOSE, RFC7638 kid
- a3 — KMS adapter (RAW) + resilience: retries, backoff, circuit breaker
- a4 — Environment & startup guards: validates PORT, MAX_BODY_BYTES, etc.
- a5 — Logging & metrics base: hash-only logs, structured counters
- a6 — Dev-only /v1/verify route (disabled in production)
- a7 — Security headers: X-Content-Type-Options, Referrer-Policy, HSTS
- a8 — Validation middleware: strict schema + clear errors + size guards
- a9 — Smoke scripts: deployment health checks (shell + PowerShell)
- a10 — Rate limiting v1: basic per-IP token bucket for /v1/sign
- a11 — Rate limiting v2: enhanced with tunables + comprehensive tests
- a12 — JWKS tooling: manifest generation for current + previous keys
- a13 — Dev JWKS endpoint: serves JWKS in development (404 in prod)
- a14 — CORS hardening: strict allowlist + preflight handling
- a15 — OpenAPI specification: 3.1 spec serving with caching + CORS
- a16 — Offline CLI verifier: tools/verify-receipt.js with JWKS support
- a17 — Enhanced error handling: categorized errors + env-aware responses
- a18 — SDK verification: Node + browser helpers with comprehensive tests
- a19 — Browser WebCrypto: complete ES256 verification for web environments
- a20 — Correlation IDs: X-Request-Id propagation + error response correlation
- a21 — Payload size warnings: soft limits + hard caps + exposure headers
- a22 — Health & Metrics: /healthz endpoint + structured console metrics + KMS circuit state
- a23 — Performance Benchmarking: tools/benchmark.js with p95/p99 latency tracking and memory snapshots
- a24 — SDK Publishing Prep: Node SDK README/CHANGELOG/scripts; pack/dry‑run
- a25 — Browser Demo Page Polish: verify UI UX polish
- a26 — Advanced JWKS Management: integrity + rotation tools; JWKS managers (Node/Web); docs; tests
- a27 — Production Hardening Docs: security/privacy/threat model/runbook/SLOs; audit refresh
- a28 — Prometheus /metrics Endpoint + aggregator
- a29 — Nightly Benchmark workflow
- a30 — Verify UI polish: CSP meta, theme toggle, JWKSManager integration, download result
- a31 — Examples & Dev Tools: Node verify/sign; web embed; JWKS generator
- a32 — OpenAPI/Clients Polish: standardized error schemas + examples; check tool; CI integration
- a33 — Root Scripts: convenience npm scripts

## Next Tasks — Aligned Priority Order

### i01 — Containerization (NEXT)
Scope: Dockerfile (multi‑stage) + docker‑compose; healthcheck; quickstart docs
- Add production Dockerfile with minimal attack surface; expose port via ENV
- Add compose for local dev (mount volumes optional)
- CI: build image on PRs; build/push on tags (GHCR)
- Acceptance: `docker compose up` runs; `/healthz` 200; CI build passes

### m04 — Monitoring Pack
Scope: Prometheus scrape example, alert rules for SLOs, Grafana dashboard JSON
- Provide sample prometheus.yml and alerting rules
- Provide Grafana dashboard JSON (requests, latency, rate‑limit, breaker)
- Acceptance: dashboards import cleanly; rules validate syntax

### w12 — Verify Hardening
Scope: Remove unsafe inline; a11y polish
- Move inline JS to module file(s); add ARIA roles/labels; focus styles
- Acceptance: CSP passes without inline; basic a11y audit OK

### c13 — Contribution/CI Tightening
Scope: PR template; CODEOWNERS; Dependabot; optional strict commit‑lint
- Add `.github/pull_request_template.md`, `CODEOWNERS`, dependabot config
- Acceptance: PRs show template; owners enforced; PR commit‑lint can be strict

### s14 — Web SDK Bundle Option (optional)
Scope: Minified ESM bundle and size check
- Add build (ESBuild/Rollup) to produce small ESM; size check script
- Acceptance: <10KB bundle; README documents usage

### a34 — Error Model Consistency
Scope: Ensure standardized error schema across endpoints; document error map
- Audit endpoints; update OpenAPI; add tests
- Acceptance: shared error schemas referenced; test coverage for representative cases

### r03 — Unified JWKS Tooling
Scope: Single CLI for integrity/rotation/thumbprints/diff
- Implement `tools/jwks-tool.js` to consolidate commands; help and examples
- Acceptance: parity with existing tools; clear CLI UX

### e03 — Clients & Collection
Scope: Postman/HTTP collection for core endpoints
- Provide importable collection or HTTPie scripts
- Acceptance: collection works out‑of‑the‑box

### a24 — SDK Publishing Preparation (NEXT)
Scope: Prepare Node SDK for npm publishing with proper metadata; stage browser packaging plan
- Ensure `sdk/node` has README, types, and clean entry points (README and pack scripts present)
- Add npm publish dry-run validation and semantic versioning discipline
- Confirm `npm pack` contents minimal and correct; add CHANGELOG
- Outline browser SDK distribution (ESM build or direct file usage) and CDN strategy
- Acceptance: `npm pack` succeeds; dry-run shows correct files; README covers use; versioning policy documented

### a25 — Browser Demo Page Polish
Scope: Complete user-facing receipt verification interface
- Complete `web/verify.html` with drag/drop receipt verification
- Add copy/paste JWKS support and error reason mapping
- Polish UX with clear success/failure states and debugging info
- Acceptance: End users can verify receipts via web interface without technical knowledge

### a26 — Advanced JWKS Management
Scope: Enhanced key rotation and JWKS management capabilities
- Add automated JWKS refresh detection and caching mechanisms
- Implement key rollover validation tools and rotation testing
- Add JWKS integrity verification helpers and staleness detection
- Acceptance: Clean key rotation without service interruption; automated validation

### a27 — Production Hardening Review
Scope: Final production readiness assessment and deployment automation
- Complete security audit checklist validation (all 9.5+/10 criteria)
- Add deployment automation validation and infrastructure checks
- Implement final observability hooks and production monitoring readiness
- Acceptance: Passes comprehensive audit; ready for production deployment

## Quality Gates (Always Required)
- `node tools/test-fast.js` → ALL PASSED
- `node tools/smoke-receipt.js` → RECEIPT OK
- `node api/test/health.test.js` → health.test OK
- `node tools/benchmark.js` → p99 latency under 100ms at configured load
- All new features must include focused unit tests
- No new production dependencies without architectural review

> Keep commit subjects as `feat(aNN): ...` for auditability and traceability.

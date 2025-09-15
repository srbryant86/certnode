# Agent Guide — CertNode

This document equips agents and contributors to continue work without prior context. It captures conventions, status, and the next actionable steps.

## Mission Snapshot
- CertNode: Tamper‑evident receipt service (ES256 on P‑256, RFC 8785 JCS) with offline verifiability.
- Primary entry points:
  - API/server: `api/src/index.js`, `api/src/server.js`
  - Web verify UI: `web/verify.html`
  - SDKs: `sdk/node`, `sdk/web`
  - Tools/Tests: `tools/*`, `api/test/*`
  - OpenAPI: `web/openapi.json`

## Conventions
- Commit subjects: `type(labelNN): summary`
  - Labels (taxonomy):
    - a (Application), i (Infra), w (Website), d (Docs), s (SDKs), t (Tools/Tests), c (CI/CD), m (Monitoring), r (Rotation/Keys), e (Examples), g (Governance)
  - Example: `feat(a34): error model consistency`
- Always push after each commit (auto‑push hook available; see CONTRIBUTING.md).
- Keep PRs using `.github/pull_request_template.md` and CODEOWNERS review.

## Quality Gates
- Fast unit tests: `node tools/test-fast.js` → ends with “ALL PASSED”
- OpenAPI check: `node tools/check-openapi.js` (CI enforced)
- JWKS tooling:
  - Integrity: `node tools/jwks-integrity-check.js --jwks path`
  - Rotation: `node tools/jwks-rotate-validate.js --current a.json --next b.json`
  - Unified: `node tools/jwks-tool.js <cmd>`
- Docker: `docker build -t certnode:latest .` (CI builds on every push)
- Metrics endpoint: `/metrics` (Prometheus text format)

### CI Signals
- PRs include a Benchmark Summary comment with a table of P50/P95/P99 per payload.
- Web SDK size budget enforced (<10KB) via CI gate.

## Status & Roadmap
- Canonical mapping: `docs/internal/ROADMAP_CANON.md`
- Latest update & completions: `docs/internal/ACTUAL_ROADMAP.md`
- Task queue: `docs/internal/TASKS_TODO.md`
- Taxonomy reference: `docs/TASK_TAXONOMY.md`

## Current State (high‑level)
- Completed through a33; infra/containerization (i01) and monitoring pack (m04) are done.
- Web verify page hardened (CSP tightened, external module added, a11y improvements).
- CI: tests, OpenAPI check, Docker build, commit‑lint (strict on PRs).

## Next Steps (prioritized)
1) d26 — Docs sync (AGENTS/STATUS)
   - Goal: Reflect that both SDKs are published and align status docs.
   - Acceptance: Docs gate passes; AGENTS “Next Steps” updated; STATUS checklist current.
2) a34+ polish — OpenAPI/error examples consistency
   - Goal: Ensure all endpoints reference shared error schemas; examples reflect final error model.
   - Acceptance: OpenAPI check passes; tests green.
3) w12 — Verify page polish (ongoing)
   - Goal: Maintain CSP/a11y; minor UX refinements only.

### Recent Completions
- w12 — Verify page hardening: inline scripts removed; CSP tightened; a11y improved for dropzones.
- a34 — Error model consistency: standardized error schema and X-Request-Id on error responses; minor tests updated.
- bench — Benchmark script hardened: disables rate limit during bench; correct request shape; robust success/latency output.
- ci/pr — CI benchmark summary + docs gate; PR template includes docs gate + benchmark checklist.
- ci-matrix — CI runs on Node 20.x and 22.x; nightly benchmark supports manual dispatch and includes P99 summary.
- ci-release — Release workflows run tests on Node 20/22; publish on Node 20 only; CI splits benchmark into a soft-fail job.
 - a35 — Verify route aligned to error model (request_id + headers) and tests added.
- w13 — Verify page a11y polish (aria-live on status, labelled file inputs, skip link).
- s15 — SDK-web publish readiness: added types field, SRI tool, README CDN/SRI examples; CI builds and sizes web SDK.
- t15 — Fuzz/edge tests: added validation fuzz cases for invalid JSON, unknown fields, kid variants, and tsr type.
- s15 — Size budget: added CI gate to fail if web SDK bundle exceeds 10KB.
- w12 — CSP hardening: added object-src/base-uri/frame-ancestors to verify page.
- a36 — OpenAPI: add error responses for /health (405/500) referencing shared ErrorResponse.
 - s16 — Web SDK published: @certnode/sdk-web v0.1.3 tagged; CDN/SRI docs included; CI size gate enforced.
  - s17 — Node SDK docs aligned: README cleaned and examples updated; no new publish required.
 - s18 — Node SDK published: @certnode/sdk v1.0.7 live on npm; release workflow verified.
 - a37 — TSA integration groundwork: optional RFC3161 client with metrics; require_tsr strict mode (503) and canary tool; OpenAPI/docs/tests updated.
 - s18 — Node SDK published: @certnode/sdk v1.0.7 live on npm; release workflow verified.

## Useful Commands
- Start API: `npm run start` (or `node api/src/index.js`)
- Compose dev: `docker compose up --build`
- Benchmark: `node tools/benchmark.js` (p99 target <100ms)
- Release (tags + Actions): push `sdk-node-vX.Y.Z` or `sdk-web-vA.B.C` with `NPM_TOKEN` configured

## Documentation Index
- Monitoring: `docs/MONITORING.md` (includes Prometheus/alerts/Grafana assets)
- Docker: `docs/DOCKER.md`
- Release: `docs/RELEASE.md`
- Security/Privacy/Threat Model/Runbook/SLOs:
  - `docs/SECURITY.md`, `docs/PRIVACY.md`, `docs/THREAT_MODEL.md`, `docs/RUNBOOK.md`, `docs/SLOS.md`

## Metrics Quick Reference
- `certnode_requests_total{method,path,status}` — total requests.
- `certnode_request_duration_ms` — histogram for request latency.
- `certnode_rate_limit_triggered_total` — total rate limit triggers.
- `certnode_errors_total{method,path,status}` — total error responses (status >= 400).

## Guardrails
- No new production dependencies without justification; prefer dev‑only for tooling.
- Keep metrics label cardinality bounded (method, path, status only).
- Avoid logging payload contents; logs should be hash‑only and correlation‑safe.

## CI Failures — Quick Fixes
- Web SDK size gate failed: run `npm run build:web-sdk` and ensure `sdk/web/dist/index.esm.min.js` <10KB. If needed, trim comments/exports; avoid adding prod deps.
- A11y check failed: open `http://localhost:8080/verify.html` locally and address reported axe-core violations (labels, roles, color contrast). Utility classes are in `web/assets/certnode.css`.
- Benchmark regression: run `node tools/benchmark.js`; target p99 <100ms. Inspect server logs and rate-limit env in bench step.
- Docs gate: update `AGENTS.md`, `docs/internal/ACTUAL_ROADMAP.md`, or run `npm run docs:update` and commit.

## If Context Is Lost
- Read: ROADMAP_CANON, ACTUAL_ROADMAP, TASKS_TODO, MONITORING, DOCKER, RELEASE, CONTRIBUTING.
- Run: `node tools/test-fast.js` to sanity‑check.
- Pick the top “Next Steps” item; implement with minimal surface area; add/adjust tests and docs.
- Use the commit subject convention and push each commit.

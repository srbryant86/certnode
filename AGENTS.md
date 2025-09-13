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
1) s14 — Web SDK bundle option (optional)
   - Goal: Provide minified ESM bundle and a size check script for @certnode/sdk‑web.
   - Constraints: Add only dev dependencies (no new prod deps). Keep output <10KB if feasible.
   - Acceptance:
     - `npm run build:web-sdk` produces `sdk/web/dist/index.esm.min.js`
     - `npm run size:web-sdk` reports size; README documents CDN/ESM usage
2) a34 — Error model consistency
   - Goal: Ensure standardized error schema across endpoints and reflected in OpenAPI.
   - Steps: Audit responses, reuse shared schemas, add/adjust tests.
   - Acceptance: Shared schemas referenced; tests cover representative 400/429/500.
3) w12 — Verify page hardening (final polish)
   - Goal: Eliminate any remaining inline JS; ensure a11y roles/focus complete.
   - Acceptance: CSP has no `unsafe-inline`; keyboard and screen‑reader flow validated.

### Recent Completions
- w12 — Verify page hardening: inline scripts removed; CSP tightened; a11y improved for dropzones.
- a34 — Error model consistency: standardized error schema and X-Request-Id on error responses; minor tests updated.
- bench — Benchmark script hardened: disables rate limit during bench; correct request shape; robust success/latency output.
- ci/pr — CI benchmark summary + docs gate; PR template includes docs gate + benchmark checklist.
- ci-matrix — CI runs on Node 20.x and 22.x; nightly benchmark supports manual dispatch and includes P99 summary.
 - ci-release — Release workflows run tests on Node 20/22; publish on Node 20 only; CI splits benchmark into a soft-fail job.

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

## Guardrails
- No new production dependencies without justification; prefer dev‑only for tooling.
- Keep metrics label cardinality bounded (method, path, status only).
- Avoid logging payload contents; logs should be hash‑only and correlation‑safe.

## If Context Is Lost
- Read: ROADMAP_CANON, ACTUAL_ROADMAP, TASKS_TODO, MONITORING, DOCKER, RELEASE, CONTRIBUTING.
- Run: `node tools/test-fast.js` to sanity‑check.
- Pick the top “Next Steps” item; implement with minimal surface area; add/adjust tests and docs.
- Use the commit subject convention and push each commit.

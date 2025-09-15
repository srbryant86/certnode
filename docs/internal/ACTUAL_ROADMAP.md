# CertNode Roadmap — Now / Next / Later

This document tracks active priorities without fixed dates. Delivery is milestone‑ and gate‑driven (tests, OpenAPI, performance, docs).

## Now

- d26 — Docs Sync (AGENTS/STATUS)
  - Update AGENTS “Next Steps” and STATUS checklist to reflect SDKs published and current readiness.
  - Gate: `node tools/check-docs-updated.js` passes; CI green.

- a34+ — OpenAPI/Error Examples Consistency
  - Ensure all endpoints reference shared error schemas; add representative 400/405/429/500 examples; keep `/healthz` alias aligned.
  - Gate: `node tools/check-openapi.js` OK; fast tests pass.

- w12 — Verify UI Polish (CSP/a11y)
  - Maintain no inline JS; ensure a11y flow stays clean; small UX refinements only.
  - Gate: CI a11y job OK; manual spot check.

## Next

- a37 — RFC3161 TSA Integration
  - Replace local TSR stub with real TSA client (configurable endpoint/CA); include DER token in `tsr`; robust timeouts/retries.
  - Gate: new tests; example receipt with real TSR validates offline.

- c36 — Provenance‑Enabled Releases (optional)
  - Re‑enable `npm publish --provenance` with `id-token: write`; verify attestation presence; document in RELEASE.
  - Gate: publish logs show provenance; npm visibility confirmed.

- t16 — Test/Fuzz Expansion
  - Extend fuzz corpus (malformed JOSE/JCS edges, large/empty payloads, header variants); add end‑to‑end offline verify cases.
  - Gate: fast tests green; coverage for new edge classes.

- m06 — Monitoring/Alerts Tuning
  - Tighten error‑rate and p99 latency alerts; add panels for TSA latency and JWKS freshness.
  - Gate: updated assets in `docs/monitoring/*`; dashboards render.

## Later

- a40 — JWKS Rotation Automation Polish
  - Background thumbprint checks, staleness metrics, safe overlap windows; client fallback strategy docs.
  - Gate: rotation tests pass; metrics for key freshness.

- e04 — Developer Samples
  - Minimal Node/web demo apps and a quick‑start repo; copy/paste snippets for common flows.
  - Gate: examples build/run; README links.

## Completed Highlights

- s18 — Node SDK published: `@certnode/sdk@1.0.7` (release workflow + GH Release)
- s16 — Web SDK published: `@certnode/sdk-web@0.1.11` (size gate; CDN/SRI docs)
- a34 — Error model standardized across routes; OpenAPI aligned
- w12 — Verify page CSP tightened; a11y improved; no inline scripts
- m05 — Prometheus metrics incl. `certnode_errors_total`; CI bench summary on PRs

## Quality Gates (unchanged)

- Fast tests: `node tools/test-fast.js` → “ALL PASSED”
- OpenAPI check: `node tools/check-openapi.js` → OK
- Benchmark: p99 < 100ms across payloads via `node tools/benchmark.js`
- Web SDK bundle size <10KB; CI size gate enforced

## Notes

- Use milestone tagging for SDK releases: `sdk-node-vX.Y.Z`, `sdk-web-vA.B.C`
- Keep metrics label cardinality bounded to method, path, status only
- Avoid logging payload contents; logs should be hash‑only and correlation‑safe


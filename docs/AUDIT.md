# CertNode Audit

High-level audit of current state, gaps, and recommended next steps.

## Summary
- Core application layer a1–a22 implemented and traceable (see TRACEABILITY.md).
- Performance benchmarking (a23) implemented: tools/benchmark.js with p95/p99 and memory tracking.
- Next priorities: SDK publishing (a24), browser demo polish (a25), JWKS management (a26), production hardening (a27).

## Quality Gates
- `node tools/test-fast.js` → all unit tests pass, no hangs.
- `node tools/smoke-receipt.js` → RECEIPT OK.
- `node api/test/health.test.js` → health.test OK.
- `node tools/benchmark.js` → p99 < 100ms at configured load.

## Strengths
- Deterministic JCS + ES256 pipeline with offline verifiability.
- Resilient KMS adapter with retries and circuit breaker.
- Strict validation, rate limiting, CORS, and security headers.
- Zero-dependency SDKs (Node/browser) and offline CLI.

## Gaps / Needs
- Web verifier page (`web/verify.html`) is a stub; needs full UX (drag/drop, JWKS input, error mapping).
- SDK publishing polish: confirm pack contents, add dry‑run step, document versioning policy; plan browser distribution.
- Advanced JWKS management not implemented (refresh detection, caching, rotation tests, integrity checks).
- Production hardening: complete audit checklist, deployment validation, monitoring readiness docs.
- Many policy/mapping docs under `docs/` are placeholders; fill minimum viable content or remove from scope for now.

## Recommended Next Steps
1) a24 — Finalize Node SDK publish readiness and outline browser distribution.
2) a25 — Implement `web/verify.html` user flow with helper `web/js/verify-helper.js`.
3) a26 — Add JWKS caching/refresh helpers and rotation validation scripts.
4) a27 — Run security/audit checklist, wire minimal metrics/alerts, and document runbooks.

## Operational Notes
- PowerShell may block npm scripts (`npm.ps1`). Use `cmd /c npm pack` within `sdk/node` if needed.
- Keep commit subjects as `feat(aNN): ...` for traceability.

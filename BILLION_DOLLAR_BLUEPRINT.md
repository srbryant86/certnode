# The Billion-Dollar CertNode Blueprint

Strategic roadmap for building CertNode into a billion-dollar receipt infrastructure empire.

## Session Roadmap Update

- [x] Completed item — Node SDK EdDSA verification updated to use `crypto.verify('ed25519', ...)`; tests added
- [x] Completed item — JWKS endpoint returns `application/jwk-set+json` with `Cache-Control: public, max-age=300`
- [x] Completed item — `/openapi` served via local Scalar viewer with `public/openapi.json` as the single source of truth
- [x] Completed item — Encoding/asset hygiene check wired into CI and git hooks
- [x] Completed item — Visual overhaul: unified system fonts, hero/sections/cards, cleaned titles/footers; spec + status pages aligned
- [ ] CURRENT PRIORITY — Consolidate CSP in `vercel.json`; minimize inline scripts; ensure no external CDNs
- [ ] Next item — Trust Center polish (governance transparency) and publish rotation schedule

## Vision & Positioning
- Vision: Universal receipt protocol — open standard, not SaaS.
- Positioning: Protocol owner building an ecosystem; infrastructure mindset.
- Phase: 1 (0–6 months) — Prove the standard works.

## Strategic Pillars
- Standards-first (JWS, JCS, JWKS) and ecosystem enablement.
- Enterprise credibility: trust center, JWKS rotation, security headers, governance.
- Developer-first: SDKs, examples, validator, OpenAPI, public test vectors.
- Usage metering: foundational limits, metrics, billing primitives.

## Roadmap Status (Sep 2025)
- [x] Completed — Node SDK EdDSA verification fix + tests
- [x] Completed — JWKS endpoint Content-Type: application/jwk-set+json
- [x] Completed — Unified OpenAPI serving (local + prod) using local Scalar
- [x] Completed — Encoding/asset hygiene checks added to CI
- [ ] CURRENT PRIORITY: Consolidate CSP in vercel.json; remove inline scripts via hashes/nonces; eliminate external CDNs
- [ ] Next item — Repo-wide UTF-8 normalization and restoration of long-form strategic docs; confirm pa11y/axe thresholds

## Immediate Objectives
1) Professional site infrastructure — strict security headers + CSP
2) Standards governance signals — transparent rotation log + trust docs
3) Developer experience — quickstarts, validator polish, cross-language vectors
4) Metering foundations — usage, limits, and observability

## Success Metrics (Phase 1)
- 1,000+ developers engaged
- Recognized standards positioning
- Enterprise credibility established
- Revenue model validated

Note: Document normalized to UTF-8 (no BOM). Previous encoding artifacts removed.
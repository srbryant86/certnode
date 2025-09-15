# Website Plan — CertNode

This document defines the initial public website IA, visual system, and approved messaging. It is implementation‑ready and respects project guardrails (strict CSP, a11y, performance).

## Audience & Tone

- Audience: Engineering leaders, compliance/security stakeholders, and developers.
- Tone: Clear, factual, trustworthy, technically credible. No hype. Short sentences, concrete claims.

## Information Architecture (MVP)

- Home (`index.html`)
  - Hero: concise value prop and primary CTAs
  - How it works (3 steps)
  - Benefits (pillars)
  - Use cases (4 tiles)
  - Proof (metrics + trust signals)
  - Developer CTAs (OpenAPI, SDKs, GitHub)
- Verify (`verify.html`) — already implemented; integrate with site nav
- API Docs (`openapi.html`) — already present; note CSP caveat if hosted in prod
- Pitch/Story (`pitch.html`) — optional; align copy and link from Home

Future (Later): Case studies, Pricing, Blog/Changelog, Security/Compliance page.

## Visual System (reuse existing)

- Keep current dark theme (`web/assets/certnode.css`), utility classes, and layout.
- Strict CSP (no inline JS/CSS). All scripts as modules or external files.
- A11y: labeled inputs, aria-live for status, visible focus, aria-busy while verifying.
- Performance: no new heavy JS; hero SVG only; budget < 50KB gzipped for Home (excluding Swagger UI page).

## Messaging (approved copy)

### Hero

- Headline: Receipts for Digital Truth
- Subhead: CertNode gives any JSON or document a tamper‑evident receipt you can verify offline.
- Primary CTAs: Try the 60‑second demo (links to `verify.html`), View the API (links to `openapi.html`), Install SDKs.

### Pillars (Benefits)

- Offline verifiability — Verify anywhere with public JWKS; no vendor call required.
- Tamper‑evident receipts — JCS‑canonicalized JSON + ES256 signature.
- Simple to adopt — Zero‑dependency SDKs for Node/Web; copy‑paste in minutes.
- Production‑ready — Metrics, rate limiting, health checks, provenance releases.

### How It Works (3 steps)

1) Submit payload → We canonicalize (RFC 8785 JCS) and sign (ES256).
2) Receive receipt → JSON `{ protected, signature, payload, kid, payload_jcs_sha256, receipt_id[, tsr] }`.
3) Verify offline → Use our SDK or CLI with published JWKS.

### Use Cases

- Invoices & payouts — Prove the exact numbers sent.
- Webhooks & APIs — Detect payload tampering in transit.
- Policies & PDFs — Match the published version.
- AI outputs — Sign the approved result.

### Proof / Trust Signals

- p99 < 100ms (Small/Medium/Large test payloads)
- Strict CSP & a11y; no inline scripts
- Prometheus metrics; SLSA provenance on releases
- JWKS integrity/rotation tooling

### Developer CTAs

- OpenAPI: `/openapi.html`
- Node SDK: `npm i @certnode/sdk`
- Web SDK: `npm i @certnode/sdk-web`
- CLI: `tools/verify-receipt.js`
- GitHub: link repo

## Home Layout (wireframe)

- Header: Logo (text), nav (Verify, API, GitHub)
- Hero: Headline, subhead, 2–3 CTAs
- How it works: 3 columns
- Pillars: 4 concise bullets with icons (SVG inline in CSS background)
- Use cases: 4 tiles
- Proof: metrics block + short bullets
- Footer: SDK installs, links to docs, security/monitoring

## Implementation Notes

- Files:
  - `web/index.html` (create): static home using existing CSS; no JS required beyond nav interactions.
  - `web/assets/certnode.css` (reuse): add minimal home utilities if needed.
  - Update `verify.html` to include site header/nav (no inline JS; keep a11y).
  - Keep `openapi.html` separate; add CSP note if served in prod.
- CSP: maintain `script-src 'self'`; no inline. Avoid external fonts.
- A11y: headings order, landmark roles, focus visible, aria‑busy where applicable.

## Success Criteria (MVP)

- Home under 50KB gzipped; validates with axe (no critical issues).
- Verify page accessible; nav consistent across pages.
- Clear developer CTAs and links work.

## Next Steps (tracked)

- w14 — Website home + nav integration
  - Build `web/index.html` from this plan
  - Add header/nav to `verify.html`
  - Link to OpenAPI and GitHub
  - Add minimal tests (link presence) if practical


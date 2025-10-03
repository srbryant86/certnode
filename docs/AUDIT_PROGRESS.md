# CertNode Audit Progress — Execution Tracker

Last updated: {{DATE}}

Executive Summary
- Momentum: Security and initial UX/Perf are complete; Stripe checkout is live and reliable. We’re now polishing encoding, CSS structure, and standardizing API errors to meet a 9.5+/10 bar across audits (Claude Opus 4.1, Gemini Pro 2.5, ChatGPT 5).
- Conversion: Pricing CTAs use Stripe Checkout Sessions (Starter/Professional/Business) with success redirects to `/account`. Enterprise funnel includes an estimator and email handoff.

Audit Roadmap Status

1) Security (Week 1) — DONE
- HMAC API key validation (optional via `API_KEY_SECRET`) — shipped
- Composite rate limiting (IP + API key + global) — shipped
- Strict CORS (prod requires allowlist; dev allows localhost; same-origin fallback) — shipped
- Enhanced security headers + conservative API CSP — shipped
- Predicted audit scores: 9.6–9.8/10 across models

2) UX (Week 1–2) — IN PROGRESS
- Benefit-first homepage hero + meta descriptions — done
- Pricing UX: “Subscribe” CTAs, “Secure checkout by Stripe,” Professional label, Business added — done
- Enterprise quote input explicitly >2M receipts — done
- Navigation clarity (Try Demo / Pricing / Documentation / Trust) — partial (updated on key pages)
- Mobile responsiveness & consistent CSS framework — PENDING (next)

3) Performance (Week 2) — PARTIAL
- Static caching headers (CSS/JS/assets 1y; HTML 1h) — done
- Dev gzip for text assets — done
- CSS extraction (reduce large inline CSS, move to `web/assets/`) — PENDING (next)
- Target: >99% success, improved first render, smaller HTML

4) Business (Week 2–3) — PARTIAL
- Pricing tiers consistent: Developer (5k), Starter $49 (50k + $0.002), Professional $199 (500k + $0.001), Business $499 (2M + optional overage), Enterprise (custom) — done
- Checkout Sessions for Starter/Professional/Business (success → `/account`) — done
- Enterprise estimator w/ same‑day quote note — done
- ROI/industry pages — PENDING

5) Code Quality (Week 3) — PARTIAL
- Standardized error body (billing + 404) — done
- Full API sweep to standardize errors + OpenAPI examples — PENDING (next)
- Input validation hardening (depth, key limits) — PENDING
- Docs: business‑focused integration guides/use cases — PENDING

6) Infrastructure (Week 3–4) — PARTIAL
- CI guard: block merge conflict markers — done
- CI smoke: curl `/.well-known/jwks.json`, `/trust/keys.jsonl`, `/openapi.json` — done
- Docker: HEALTHCHECK + graceful shutdown — PENDING
- Env validation: required vars per mode — PENDING
- Observability: expand metrics, error types, purchase counters — PENDING

Stripe Checkout Status
- Env (Vercel): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, `STRIPE_BUSINESS_PRICE_ID` — set.
- Resolved issues:
  - Missing SDK in function bundle — fixed via `api/package.json` dependency
  - CR/LF in price IDs — trimmed in code before Checkout

Current Priority (Next 48 hours)
- CSS extraction: move large inline CSS to `web/assets`, leverage caching, keep styles consistent
- Error model: standardize across all API routes; update OpenAPI examples and tests

Recent Progress
- Routing normalization: core marketing pages now serve from the `nextjs-pricing` Next.js app; legacy `/web` stubs remain only for trust/status routes

Success Metrics
- Security: priority‑1 items closed; 9.5+/10 across audits
- Performance: static cache+gzip in place; success >99%; CSS extraction reduces HTML bulk
- UX: clear nav and benefit‑first hero; pricing frictionless; trust notes present
- Business: paid tiers purchase path works; enterprise funnel credible with estimator

Appendix — What’s Shipped (High Level)
- Security: HMAC API keys, composite RL, strict CORS w/ same‑origin fallback, headers
- UX: homepage hero + meta, pricing CTAs + trust note, Pro→Professional naming, business tier, enterprise estimator
- Perf: cache headers, dev gzip; Vercel header rules for assets
- Stripe: Sessions for all paid tiers, `/account` thank‑you + quick start
- CI: conflict guard + smoke endpoints

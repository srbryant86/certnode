# Billion Dollar Blueprint - Phase 1

## Roadmap Rollup
- [x] Completed item - Published AGENTS.md to codify canonical integration workflow and enforcement guardrails
- [ ] CURRENT PRIORITY - Design canonical integration event normalization and routing so DAG linking stays standards-first
- [ ] Next item - Implement provider adapters with idempotent mapping, HMAC verification, and telemetry hooks

## Strategic Insights
- Homepage now positions CertNode as the universal receipt protocol, reinforcing standards ownership across developer and executive audiences.
- Canonical Shopify ingestion now lands in the Integration Event Ledger, deduping webhooks before receipts write to the DAG service.
- Operationalizing AGENTS.md forces every session to uphold the standards-first integration ledger before code changes land.
- Turnkey connectors must ride on a canonical integration event ledger so partner ecosystems adopt the CertNode spec instead of bespoke webhook glue.
- Automatic receipt linking demands an indexed external identifier map; without it, concurrent webhooks will generate orphaned nodes and erode the dispute-defense story.

- Receipt graph UI still behaves like a sequential builder, so prospects never see the cross-domain DAG moat we promised; publishing the gap keeps Phase 1 focused on proving standards ownership.
- Standing up the support steward shows CertNode owns the protocol guidance loop while preserving human escalation authority.
- Launching the dedicated dashboard workspace locks Phase 1 around standards ownership with a Prisma schema that mirrors the protocol data model.
- API key lifecycle governance with single-use secrets and audit trails positions CertNode as the protocol security authority.
- Owning the credential flow with Argon2id-backed NextAuth sessions reinforces enterprise-grade trust while we scale standards adoption.
- Instrumenting overview metrics via Prisma keeps the dashboard narrative tied to real protocol usage, a key proof point for standards stewardship.
- Directing yearly checkouts through dedicated Stripe payment links protects enterprise billing flows while unlocking higher ACV conversions immediately.
- Canonical asset delivery now flows through the `/nextjs-pricing` prefix while a compatibility rewrite catches legacy `/_next` requests, so we restore styling without compromising future multi-app separation.
- Keeping business-route rewrites separate from framework internals protects infrastructure scale and credibility as we evolve into the universal receipt protocol owner.
- Aligning Vercel asset delivery with the explicit Next.js asset prefix keeps the multi-app deployment resilient without entangling API and static layers.
- Re-establishing the Tailwind/PostCSS pipeline ensures the premium pricing experience ships with the intended visual polish across every deploy.

## Execution Notes
- Updated RECEIPT_GRAPH_QUICK_WINS.md with baseline cleanup, SLA alignment, and Phase 1 quick win guidance.
- Rerouted production marketing routes to `nextjs-pricing`, updated Vercel rewrites, and aligned docs so deploys no longer fall back to legacy `/web` pages.
- Restored certnode-dashboard deployability by aligning billing helper exports with normalizePlanTier/comparePlanTiers and validating Next.js builds locally.
- Refreshed certnode.io landing experience with enterprise-grade storytelling, domain pillars, and Integration Event Ledger messaging.
- Ported Kajabi and Stripe adapters onto the Integration Event Ledger so HMAC-verified webhooks now write receipts through the Next.js graph service.
- Registered the Shopify adapter on the integration gateway, wiring ledger + orchestrator updates end-to-end.
- Authored AGENTS.md to align all agents with the canonical integration ledger, graph service authority, and mandatory documentation cadence.

- Reviewed "ReceiptGraphMultiMode.tsx" and documented why the current visualization stops at linear chains instead of the cryptographically linked DAG across transaction, content, and operations domains.
- Launched the /support AI steward with a curated knowledge base and contextual mailto escalation so support and sales teams get structured transcripts.
- Hardened the authentication perimeter with NextAuth v5, Argon2id hashing, and App Router guards so only verified enterprises reach Phase 1 surfaces.
- Brought the overview telemetry online with Prisma aggregation, API surface, and seeded audit/receipt data to showcase the enterprise heartbeat.
- Activated the API management module with rate limits, IP allowlisting, and audit trail generation for every key lifecycle event.
- Enforced dual-axis pricing (receipts + transaction value) with analytics, overage billing, and upgrade cues inside the dashboard.
- Connected Stripe portal access with plan telemetry so billing acts as part of the dashboard narrative.
- Captured the enterprise schema via Prisma with scripts for migrations, seeds, and environment scaffolding, aligning the dashboard with billion-transaction resilience goals.
- Initialized the Next.js 14 certnode-dashboard repo with strict TypeScript, Tailwind, and Prisma tooling so the authenticated experience can ship on enterprise-ready rails.
- Launched an enterprise-scale savings calculator that showcases bulk receipt automation ROI and routes high-volume leads to contact@certnode.io.
- Pricing experience at `certnode.io/pricing` now satisfies the professional site infrastructure objective with full styling and interactivity restored.
- Yearly billing toggle now routes Starter, Growth, and Business plans to the correct Stripe payment links, eliminating accidental monthly subscriptions.
- Removed the public analytics dashboard route (`/analytics`) and now surface contact@certnode.io and Support links while preserving analytics library architecture for future authenticated release.
- Checkout analytics events typed (`checkout_start`/`checkout_error`) so revenue instrumentation stays intact while passing production builds.
- Legacy `/_next` requests now rewrite to the prefixed path so cached clients recover immediately while new builds stay standards-aligned.
- Tailwind globals load through `app/globals.css`, keeping typography, gradients, and layout utilities consistent with our enterprise positioning.
- Checkout API bridge now targets the billing service directly, restoring Stripe redirects while keeping the Next.js experience seamless.
- Navigation component now mirrors the core site links, reinforcing unified developer journeys across static and Next.js surfaces.
- Mobile navigation interaction matches the static site experience with outside-click dismissal and overlay for consistent polish.
- Desktop navigation typography and spacing now match the static site, maintaining brand consistency across every route.

## Session TODOs
- [x] Review and update RECEIPT_GRAPH_QUICK_WINS.md guidance so dashboard graph quick fixes stay aligned with Phase 1 standards (completed)
- [x] Diagnose deployment regressions so nextjs-pricing stays the live marketing surface
- [ ] Rebuild receipt graph data model with explicit parent/child relationship storage
- [ ] Render cross-domain edges with relationship labels in the interactive demo
- [ ] Expose graph query/pattern examples that map to Phase 1 enterprise use cases
- [x] Stand up integration event index and idempotency flow so platform webhooks resolve to single receipts
- [x] Resolve Vercel deployment failure on latest commit and restore green deploys
- [ ] Extend provider adapters (Kajabi, Stripe, Shippo, ShipStation, Teachable, WooCommerce) to the new ledger pipeline with provider-specific HMAC + telemetry hooks









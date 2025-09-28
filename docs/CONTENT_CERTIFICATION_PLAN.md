# Content Certification Expansion Plan (Updated Week 4)

**Last Updated:** 2025-09-27
**Status:** Phases 0-4 complete; Phase 5 kicking off
**Timeline:** 6-week delivery (Weeks 5-6 remaining)

---

## Phase Completion Snapshot
| Phase | Scope | Status | Notes |
| --- | --- | --- | --- |
| 0 | Alignment & guardrails | ✅ Complete | Threat model, data classification, governance sign-off |
| 1 | Data model & storage | ✅ Complete | Prisma schema + migration staged (`certnode-dashboard/prisma/schema.prisma`, `.../migrations/20240927_add_content_receipts`) |
| 2 | Ingestion pipeline | ✅ Complete | Hashing, metadata, provenance services live (`certnode-dashboard/lib/content/*`) |
| 3 | API surface | ✅ Complete | `/api/v1/receipts/content` and verify endpoints shipped (`app/api/v1/receipts/content/route.ts`, `app/api/v1/verify/content/*`) |
| 4 | Signing & ledger | ✅ Complete | `ContentReceiptService` persists signed payloads; ledger indexes updated |
| 5 | AI detection layer | ⚙️ In Progress | Heuristics + in-memory queue built; vendor abstraction TBD |
| 6 | Dashboard & reporting | ✅ Complete (MVP) | Dedicated dashboard section with analytics (`app/(dashboard)/dashboard/content`) |
| 7 | Security/compliance/billing | ⚙️ In Progress | Needs auth hardening, rate limits, billing metrics |
| 8 | QA & launch prep | ⏳ Pending | Tests + performance + pilot rollout |
| 9 | Post-MVP enhancements | ⏳ Backlog | Provenance chaining, browser widgets, etc. |

---

## Delivered in Weeks 1-4
- **Schema & migrations** — Content fields, type discriminator, indexes ready (`certnode-dashboard/prisma/schema.prisma:10`).
- **Service layer** — End-to-end `ContentReceiptService` orchestration including signing (`lib/content/service.ts:1`).
- **Detection MVP** — Advanced text/image heuristics (`lib/content/detectors/advanced-text.ts:1`, `.../image-metadata.ts:1`) plus async processing queue (`lib/queue/detection-jobs.ts:1`).
- **API & rate limiting hooks** — Content certification + verification endpoints with basic rate limiting (`app/api/v1/receipts/content/route.ts:1`).
- **Dashboard UX** — New content tab, analytics, detail modal (`app/(dashboard)/dashboard/content/page.tsx:1`).

---

## Work Remaining (Weeks 5-6)
### Phase 5 – AI Detection Layer Hardening
- Replace in-memory queue with Redis/BullMQ; persist job state, add retries & DLQ.
- External detector adapters (Hive, Originality, Writer) behind feature flag.
- Calibration harness + datasets to tune heuristics to >90% precision/recall.

### Phase 7 – Security, Compliance, Billing
- Enforce API-key auth and enterprise scoping in content routes (no hardcoded IDs).
- Wire audit logging + rate limiting parity with transaction receipts.
- Extend usage metering for `contentCertifications` (Stripe/reporting pipeline).
- Update privacy/terms copy with AI analysis & artifact retention language.

### Phase 8 – QA & Launch Prep
- Test coverage: unit (`lib/content/*`), integration (`app/api/v1/receipts/content`), e2e dashboard flows.
- Performance/load: large file uploads, concurrent detector jobs.
- Security review: file-type validation, DoS protections, provenance tamper cases.
- Pilot enablement + feedback loop.

### Phase 9 – Backlog / Enhancements
- Provenance chaining & verification portal v2.
- Additional detectors (audio, watermark validation/embedding).
- ML anomaly detection for hash submissions.
- Public verification widgets/extensions.

---

## Immediate Action Items
1. Execute Prisma migration in target environments (`npm run db:migrate`).
2. Stand up signing service (`SIGNING_SERVICE_URL`) locally or via Docker; validate `lib/signing.ts:1` integration.
3. Replace dev stub enterprise in content route with authenticated API key lookup (`app/api/v1/receipts/content/route.ts:28`).
4. Swap detection queue implementation to Redis-backed service for reliability.
5. Begin test harness builds; add CI gates for content receipts.

---

## Dependencies & Risks
- **Signing service availability** — Without running signer, certification fails; ensure local Docker stack ready.
- **Auth coverage** — Current dev stub bypasses enterprise ownership checks; must fix before staging launch.
- **Detector accuracy** — Need calibration datasets; schedule data collection/labeling sprint.
- **Queue durability** — In-memory queue unsuitable for production; migration to persistent worker stack is mandatory.

---

## References
- Operational doc: `docs/HANDOFF_CONTENT_CERT.md`
- Queue implementation: `certnode-dashboard/lib/queue/detection-jobs.ts`
- Dashboard UI: `certnode-dashboard/app/(dashboard)/dashboard/content/_components/content-receipts-client.tsx`
- API routes: `certnode-dashboard/app/api/v1/receipts/content/route.ts`, `.../verify/content/*`
- Strategic roadmap: `docs/UNIFIED_PLATFORM_PLAN.md`

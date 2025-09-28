# Content Authenticity Handoff (Weeks 1-4 Complete)

_Last updated: 2025-09-27_

## Scope
Deliver end-to-end content certification (hashing, provenance, AI scoring) within CertNode across Prisma, services, API, dashboard, and background processing.

## What’s Done (Weeks 1–4)
- **Schema & data layer** — `Receipt.type` discriminator plus content fields live in `certnode-dashboard/prisma/schema.prisma:10`; migration staged under `certnode-dashboard/prisma/migrations/20240927_add_content_receipts/`.
- **Core services** — `ContentReceiptService` handles hash/metadata/provenance + signing + persistence (`certnode-dashboard/lib/content/service.ts:1`).
- **Detectors (MVP + advanced heuristics)** — Text/image analysers with 80%+ baseline detection in `certnode-dashboard/lib/content/detectors/advanced-text.ts:1` and `.../image-metadata.ts:1`.
- **API surface** — Content intake & verification routes shipped:
  - `POST /api/v1/receipts/content` (`certnode-dashboard/app/api/v1/receipts/content/route.ts:1`)
  - `GET /api/v1/verify/content/:id` (`.../verify/content/[id]/route.ts:1`)
  - `GET /api/v1/verify/content?hash=` (`.../verify/content/route.ts:1`)
- **Dashboard UX** — Dedicated content view with analytics + detail modal (`certnode-dashboard/app/(dashboard)/dashboard/content/page.tsx:1` and `_components/content-receipts-client.tsx:1`).
- **Background processing** — In-memory detection queue with async workers (`certnode-dashboard/lib/queue/detection-jobs.ts:1`).

## Gaps & Risks
- **AuthN/AuthZ** — API still hardcodes `enterpriseId` and lacks API-key enforcement; need middleware integration with `@/lib/auth`.
- **Signing service** — `lib/signing.ts:1` expects `SIGNING_SERVICE_URL`; ensure Docker/local signer is running for e2e tests.
- **Persistence for queue** — Detection queue is in-memory; replace with Redis/BullMQ plus persistence before prod.
- **Testing debt** — No Jest/Playwright coverage yet for content flows.
- **Detector validation** — Heuristics need calibration datasets + benchmark harness to hit 90% precision/recall targets.

## Remaining Roadmap
1. **Week 5 (Phase 5: SDK & Integration)**
   - Extend CLI/SDK + OpenAPI examples for content endpoints.
   - Publish developer docs + sample apps.
2. **Week 6 (Phase 6: Launch & polish)**
   - Swap detection queue to BullMQ/Redis; add retries + metrics export.
   - Harden rate limiting, auth, audit logging (align with existing receipts APIs).
   - Add regression + load tests (large file perf, concurrent uploads).
   - Prep compliance package (data retention, threat model refresh).
3. **Backlog / Future Enhancements**
   - Provenance chaining & verification portal V2.
   - Additional modality detectors (audio/video, watermarking).
   - Analytics KPIs surfaced in exec dashboard + alerts.

## Immediate Next Steps
- Run Prisma migration against dev/stage DBs (`npm run db:migrate`).
- Stand up signing service locally (Docker Compose or node) and verify signing workflow.
- Replace dev-only enterprise stub with authenticated API keys (update `applyRateLimit` integration).
- Begin test harness: unit tests for `lib/content/*`, integration tests for `app/api/v1/receipts/content`.

## Reference Files
- Plan: `docs/CONTENT_CERTIFICATION_PLAN.md`
- UI spec: `certnode-dashboard/app/(dashboard)/dashboard/content/_components/content-receipts-client.tsx`
- Detection queue: `certnode-dashboard/lib/queue/detection-jobs.ts`
- Service contract: `certnode-dashboard/lib/content/service.ts`

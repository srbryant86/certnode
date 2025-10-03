# Integration Event Ledger Plan

## Purpose

Define the canonical ingestion pipeline that normalizes third-party webhook events, persists them in a standards-friendly ledger, and invokes the CertNode receipt graph service without bypassing existing guarantees. This plan is mandatory for all turnkey connectors (Kajabi, Shopify, Stripe, Shippo, ShipStation, Teachable, WooCommerce) and any future integrations.

## Guiding Objectives

- **Standards-first:** Incoming payloads are mapped into a single `IntegrationEvent` schema that mirrors the CertNode protocol so partners can implement alternate stacks.
- **Idempotency + lineage:** Each event is deduped via `(provider, externalId, enterpriseId)` before receipts are written; replaying events never creates duplicate graph nodes.
- **Graph authority:** All receipt creation flows through `createReceiptWithGraph`, preserving hashing, depth enforcement, and webhook fan-out.
- **Observability:** Every stage emits metrics and audit logs to prove reliability to enterprise buyers.

## High-Level Flow

1. **Adapter Route (Next.js)**
   - Location: `certnode-dashboard/app/api/integrations/<provider>/route.ts`.
   - Responsibilities:
     - Authenticate request via provider HMAC/shared secret and enterprise API key check.
     - Parse payload, derive `providerEventType`, `externalId`, `enterpriseId`.
     - Enqueue normalized payload into the ledger service (synchronous write for now, async queue later).

2. **Ledger Service (New module)**
   - Location: `certnode-dashboard/lib/integrations/ledger.ts` (new).
   - Responsibilities:
     - Persist a record in `IntegrationEventLedger` table with status `received`.
     - Upsert into `IntegrationEventIndex` keyed by `(provider, external_id, enterprise_id)`.
     - Guard idempotency: if an event with matching key and checksum already processed, exit early with pointer to existing receipt IDs.
     - Push normalized `ReceiptInstruction` objects to the orchestration layer.

3. **Orchestration Layer**
   - Location: `certnode-dashboard/lib/integrations/orchestrator.ts` (new).
   - Responsibilities:
     - For each instruction, call `createReceiptWithGraph` with mapped domain/type, payload, and parent relationships.
     - Record success/failure updates back to ledger (status `processed`, `failed`, `replayed`).
     - Trigger metrics + structured logs.

4. **Metrics + Logging**
   - Extend `monitoring` module to capture:
     - `integration_events_received_total{provider=}`
     - `integration_events_deduped_total{provider=}`
     - `integration_processing_duration_ms` summary
     - `integration_failures_total{provider=,stage=}`
   - Emit audit entries into `AuditLog` for enterprise visibility.

## Proposed Prisma Schema Additions

```prisma
model IntegrationEventLedger {
  id              String   @id @default(cuid())
  enterpriseId    String   @map("enterprise_id")
  provider        String
  providerEvent   String   @map("provider_event")
  externalId      String   @map("external_id")
  payload         Json
  checksum        String
  status          IntegrationEventStatus @default(RECEIVED)
  receiptIds      String[] @map("receipt_ids")
  error           String?
  retries         Int       @default(0)
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt      @map("updated_at")

  enterprise      Enterprise @relation(fields: [enterpriseId], references: [id])

  @@index([enterpriseId, provider])
  @@index([provider, externalId])
  @@unique([enterpriseId, provider, externalId, checksum])
}

enum IntegrationEventStatus {
  RECEIVED
  PROCESSED
  FAILED
  REPLAYED
}

model IntegrationEventIndex {
  id              String   @id @default(cuid())
  enterpriseId    String   @map("enterprise_id")
  provider        String
  externalId      String   @map("external_id")
  receiptId       String   @map("receipt_id")
  lastEventId     String   @map("last_event_id")
  lastSeenAt      DateTime @map("last_seen_at")

  @@unique([enterpriseId, provider, externalId])
  @@index([receiptId])
}
```

> Note: final Prisma names to be confirmed; adjust casing to match existing conventions.

## Adapter Mapping Guidelines

- **Kajabi / Teachable**
  - `externalId` derives from order/member/course IDs supplied by payload.
  - Parent chain: transaction (offer purchase) ? operations (member login) ? content (lesson viewed/completed).
- **Shopify / WooCommerce**
  - Use `order.id` for primary external reference.
  - Link fulfillment/refund/dispute events via parent relationships to the original transaction receipt.
- **Stripe**
  - Normalize `charge`, `payment_intent`, `invoice`, `dispute` events into consistent transaction/operations nodes.
  - Deduplicate multiple `invoice.payment_succeeded` events using idempotency key.
- **Shippo / ShipStation**
  - Ensure shipping label and tracking updates attach to parent order receipt; reuse `tracking_number` or `shipment_id` as `externalId`.

## Error Handling & Replay

- On adapter verification failure ? respond `401` with structured error, do not write ledger record.
- On orchestration failure ? mark ledger row `FAILED`, increment retries, schedule exponential backoff via queue (future work) or manual trigger.
- Provide CLI script `node cli/integrations/replay-event.ts <eventId>` to re-run failed entries after fix.

## Observability Checklist

- Add Grafana dashboard panels for ingress rate, dedupe %, failure heatmap by provider.
- Wire alerts for sustained failure rate >2% over 5 minutes per provider.
- Log correlation IDs (`requestId`, `eventId`, `receiptId`) in all stages for dispute investigations.

## Rollout Steps

1. Implement Prisma migrations for ledger + index tables.
2. Build shared ledger/orchestrator modules with unit tests.
3. Convert one provider (Shopify) end-to-end; validate idempotency + graph linking in staging.
4. Backfill other providers using same pipeline, updating support docs + onboarding guide.
5. Enable replay tooling and monitoring dashboards.
6. Update SDK examples and support agent responses to mention automatic linking sourced from ledger pipeline.

## Open Questions

- Should we introduce a message queue (e.g., BullMQ) immediately or defer until volume increases?
- Do we need separate retention policy per provider, or a unified 90-day ledger window?
- Confirm whether enterprise-specific webhook secrets live in existing API key table or require new configuration entity.

Document owner: Protocol Engineering. Keep this file current as connectors evolve.

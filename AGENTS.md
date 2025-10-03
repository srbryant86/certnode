# AGENTS.md — CertNode Repository Guide

Scope: Governs the entire CertNode monorepo for all human and automated agents. Read and follow this before taking any action.

## Reading Order

1. `BILLION_DOLLAR_BLUEPRINT.md` — Strategic roadmap, priorities, required doc updates
2. `docs/PHASE1_IMPLEMENTATION.md` and `docs/DASHBOARD_ARCHITECTURE.md` — Execution context & architecture
3. `docs/RECEIPT_GRAPH_API.md` — DAG semantics and receipt graph guarantees
4. GitHub Issues / Linear (mirrors) — Confirm task scope, acceptance criteria
5. Task-specific docs (e.g., `docs/quickstarts`, `/compliance`, `/integrations`)

## Intent & Principles

- Standards-first: every feature must reinforce CertNode as the universal receipt protocol owner
- Canonical integration event ledger: webhook adapters normalize into one spec before touching Prisma
- Ecosystem enablement: design hooks so third parties can implement alternate stacks without us
- Infrastructure-grade trust: zero-trust defaults, signed outputs, auditable trails
- Developer-first clarity: typed APIs, deterministic tooling, reproducible local setup

## Expectations for Agents / Contributors

- Start every session by updating the roadmap status in `BILLION_DOLLAR_BLUEPRINT.md` (mandatory).
- Use the provided plan tool unless the task is trivial; keep plans in sync with actions.
- Never delete or overwrite user-managed files (e.g., existing integrations) without prior alignment; extend instead.
- Treat `certnode-dashboard` Next.js API as the authoritative write path for receipts; route new ingestion there.
- Keep changes minimal and standards-compliant; open an ADR in `docs/adr/` if deviating from existing architecture.
- Tests: maintain existing coverage; add integration tests for any new connector, verifier, or DAG path.
- Logging: structured, tenant-aware, no console prints in production bundles.
- All secrets & keys flow through `api/src/config/security.js` or platform equivalents; never hard-code.

## Session Protocol (No Exceptions)

1. **Start**
   - Read the roadmap, confirm current priority.
   - Draft a plan (unless the work is truly one-step) and mark tasks you will touch.
2. **During**
   - Keep `TODO`s inside `BILLION_DOLLAR_BLUEPRINT.md` accurate.
   - When editing Prisma or ingestion logic, run lint/test suites relevant to the touched package.
3. **End**
   - Update `BILLION_DOLLAR_BLUEPRINT.md` with accomplishments, current priority, next steps.
   - Update any docs you touched (`CUSTOMER_ONBOARDING_GUIDE.md`, `/docs/quickstarts`, etc.).
   - No commits without prior doc updates and strategic context per repository protocol.

## Integration Workflow Guardrails

- Always build adapters inside `certnode-dashboard/app/api/integrations/<provider>/route.ts` (or equivalent).
- Verify incoming payloads using provider-specific HMAC/shared-secret rules before invoking domain logic.
- Normalize payloads into the shared `IntegrationEvent` schema, write to the integration ledger, then call `createReceiptWithGraph`.
- Maintain an `(provider, externalId)` idempotency index; never rely on raw payload search.
- Link receipts using `ReceiptRelationship`; do not bypass the graph service for manual mutations.
- Emit metrics (ingestion latency, dedupe hits, signature failures) via the existing monitoring hooks.

## Code Organization Quick Map

- `/api` — Node edge server (legacy); do not introduce new receipt ingestion paths here.
- `/certnode-dashboard` — Source of truth for receipt writes, Prisma schema, authenticated dashboard.
- `/nextjs-pricing` — Public site & support agent (update knowledge base when features change).
- `/docs` — Architecture, plans, compliance; keep in sync with shipped behavior.
- `/sdk`, `/integrations` — Client libraries; version-lock against protocol changes.

## Workflow & Quality

- TypeScript strict mode stays enabled; keep lint warnings at zero.
- Prisma migrations require schema review + generated SQL checked into `/prisma/migrations`.
- Feature toggles go through configuration entries; never fork environment logic in code.
- CI: maintain or add scripts so adapters and ledger logic run in automated pipelines.
- Observability: extend existing Prometheus metrics; document new dashboards in `/monitoring`.

## Roadmap Hooks

- Current Phase: `Phase 1 — Prove the Standard Works`
- Immediate priorities:
  - Canonical integration pipeline
  - Standards governance signals
  - Developer-first experience with test vectors
  - Usage metering foundation
- Keep GitHub issues mapped to these pillars; no orphan workstreams.

## Coding Standards

- Node/TypeScript: ES2022 modules, async/await with `AbortSignal` support.
- Prisma: enums map to protocol values; migrations named `<timestamp>_<snake_case_summary>`.
- Testing: Vitest/Jest for unit, Playwright/Next API tests for integration; use fixtures, not live services.
- Naming: camelCase for vars, PascalCase for types/components, kebab-case for files unless Next.js route.
- Comments: only when non-obvious; keep docs in Markdown files instead of inline essays.

## Documentation Rules

- Every repo change must reference updated docs (roadmap + relevant guides).
- `CUSTOMER_ONBOARDING_GUIDE.md` and `/docs/quickstarts` must mirror live integration behavior.
- Add new provider specs to `/docs/examples` and mention HMAC requirements.
- Support agent scripts (`nextjs-pricing/components/TechnicalSupportAgent.tsx`) require updates whenever responses change.

## Ambiguity & Escalation

- When requirements conflict, prioritize user instructions over this file; flag discrepancies in `BILLION_DOLLAR_BLUEPRINT.md`.
- If unsure about protocol decisions, propose an ADR before implementation.
- Stop work immediately if unexpected repository changes appear or if security posture is at risk; escalate via issue.

Stay aligned with the billion-dollar receipt infrastructure vision: everything we build must reinforce standards ownership, enterprise credibility, and developer delight.

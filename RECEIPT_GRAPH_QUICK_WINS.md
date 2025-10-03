# Receipt Graph Quick Wins - Implementation Guide

## Context

- The September audit flagged that the marketing receipt graph reads like demo theater instead of showing the cryptographic core of CertNode.
- Phase 1 requires the marketing surfaces to reinforce the canonical receipt graph story while the dashboard remains the write authority.
- These quick wins are scoped to the `nextjs-pricing` workspace and should take roughly 4-5 hours in total when executed as a batch.

## Baseline Cleanup (do this before other work)

- Replace the corrupted placeholder glyphs (strings such as `dY`, stray `?` characters created by the U+FFFD replacement glyph, or sequences like `?+'`) with accessible icons or plain text. Prefer Heroicons (`@heroicons/react/24/outline`) or simple emoji fallbacks.
  - `rg "dY" nextjs-pricing/components` to locate the broken characters.
  - When keeping decorative icons, wrap them in `<span aria-hidden="true">` and pair them with screen-reader friendly text.
- Normalize any content that still contains the U+FFFD replacement glyph. It often renders as `?`; do not ship builds that include it.
- Confirm meta tags, CTAs, and badges reference the same constants as the rest of the page once the SLA fix lands.

## Priority Quick Wins (do these next)

### Quick Win 1 - Align SLA Messaging (critical, ~10 minutes)

**Current gap**

`nextjs-pricing/lib/config.ts` already ships the SLA constants, but several pages (home, platform, pricing, support) still hardcode 99.97% or other values.

**Steps**

1. Keep the existing constants in `nextjs-pricing/lib/config.ts`:
```ts
export const SLA_UPTIME = '99.9%';
export const SLA_LATENCY_P95 = '210ms';
export const RECEIPTS_INCLUDED = '50,000';
```
2. Grep for lingering literals:
```bash
rg "99\\.97" nextjs-pricing/app
rg "99\\.9" nextjs-pricing/app
```
3. Import and render the constants everywhere SLA copy appears:
```ts
import { SLA_UPTIME, SLA_LATENCY_P95 } from '@/lib/config';
```
4. Update CTAs, footers, pricing comparison tables, and meta descriptions to reference the constants.

**Acceptance**

All public routes show the same uptime, latency, and included receipt volume.

### Quick Win 2 - Surface cryptographic metadata per node (high value, 1-2 hours)

**Target component**

`nextjs-pricing/components/ReceiptGraphMultiMode.tsx` (and `ReceiptGraphDemo.tsx` if reused elsewhere).

**Implementation**

1. Extend the receipt type to include the cryptographic payload:
```ts
type ReceiptCrypto = {
  hash: string;
  signature: string;
  timestamp: string;
  jwksKeyId: string;
  parentHash: string | null;
};

type Receipt = {
  id: string;
  domain: ReceiptDomain;
  type: string;
  label: string;
  description: string;
  status: 'pending' | 'created' | 'linked';
  parentIds?: string[];
  relationType?: RelationType;
  depth?: number;
  crypto: ReceiptCrypto;
};
```
2. Add a helper in `nextjs-pricing/lib/demoCrypto.ts` that deterministically generates hashes and signatures so the demo stays stable between reloads.
3. Render a `View cryptographic details` toggle in the node drawer or details card with truncated hashes (`hash.slice(0, 32)`), the signature algorithm, timestamp, key id, and parent hash when present.
4. Make sure timestamps use ISO 8601 and key ids match the dashboard JWKS naming convention (for now `certnode-2024-01`).

**Acceptance**

- Clicking any node reveals hash, signature, timestamp, key id, and optional parent hash.
- Values look realistic and align with the schema used by `certnode-dashboard`.

### Quick Win 3 - Differentiate industry presets structurally (medium, 2-3 hours)

**Goal**

Template changes must alter the node and edge structure, not just the narrative copy.

**Implementation**

- Update the `scenarios` definitions in `ReceiptGraphMultiMode.tsx` so each preset includes unique receipt arrays and relationships.
- E-commerce should show logistics receipts (shipping label, carrier scans, delivery photo).
- Digital products should surface C2PA receipts and access logs.
- High-ticket or professional services should include compliance, KYC, or contract signatures.
- Verify that the playback path (`queryPath`) and parent relationships still form a valid DAG.

**Acceptance**

Switching between presets re-renders a materially different graph with distinct node types and relationships.

### Quick Win 4 - Export graph JSON (high leverage, ~1 hour)

**Implementation**

1. Create an `exportGraph` handler that assembles the current scenario into a serializable object:
```ts
const payload = {
  template: currentTemplate,
  generatedAt: new Date().toISOString(),
  receipts,
  edges,
  policy: {
    id: `${currentTemplate.toUpperCase()}_V1`,
    verdict: 'VERIFIED',
    explanation: scenario.title,
  },
};
```
2. Use `URL.createObjectURL` plus `Blob` to trigger a `certnode-graph-${currentTemplate}.json` download.
3. Ensure the payload matches the schema expected by the integration event ledger (nodes with crypto fields, relationships, template metadata).

**Acceptance**

Pressing `Export Graph JSON` downloads a readable JSON file that passes `jq .` formatting and contains the new crypto fields.

### Quick Win 5 - Add a "Cryptographically Verifiable" badge (low effort, ~15 minutes)

**Implementation**

- Place a badge above the graph hero in both the home and platform pages:
```tsx
<div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 mb-4">
  <ShieldCheckIcon className="h-4 w-4 text-green-600" aria-hidden="true" />
  <span className="text-sm font-semibold text-green-700">Cryptographically verifiable</span>
  <a href="#verify" className="text-xs text-green-600 underline">See details</a>
</div>
```
- Anchor the link to a new `id="verify"` section that explains the verification flow and points to the dashboard for full validation.

**Acceptance**

Badge is visible on marketing routes and links to a clear explanation section.

## Do Not Implement Yet

- Offline command-line verifiers.
- Weighted policy engines or configurable scoring.
- Browser WASM verifiers.
- Real-time telemetry or Prometheus instrumentation on the marketing site.
- Deep-linked URL parameters and failure simulators.

Keep the focus on credibility wins that reinforce the Phase 1 narrative.

## Acceptance Criteria (all quick wins)

1. SLA copy is sourced from `nextjs-pricing/lib/config.ts` across every page.
2. Node details reveal hash, signature, timestamp, key id, and parent hash.
3. Template switching changes the underlying DAG structure, not just labels.
4. Export button downloads valid JSON with receipts, edges, crypto metadata, and policy info.
5. A cryptographic badge is visible and links to a verification explainer.
6. No replacement characters (U+FFFD showing up as `?`) or placeholder glyphs (`dY...`) remain in the graph surfaces.

## Testing Checklist

- [ ] `rg "99\\.97" nextjs-pricing/app` returns no results.
- [ ] `npm --prefix nextjs-pricing run lint` passes.
- [ ] `npm --prefix nextjs-pricing run build` succeeds.
- [ ] Manually click through each template and confirm node structures update.
- [ ] Open the exported JSON in a text editor and validate formatting.
- [ ] Verify the badge link navigates to the verification section.

## Files to Touch

- `nextjs-pricing/lib/config.ts`
- `nextjs-pricing/lib/demoCrypto.ts` (new helper)
- `nextjs-pricing/components/ReceiptGraphMultiMode.tsx`
- `nextjs-pricing/components/ReceiptGraphDemo.tsx` (if reused on homepage)
- `nextjs-pricing/app/page.tsx`
- `nextjs-pricing/app/platform/page.tsx`
- `nextjs-pricing/app/pricing/page.tsx`
- `nextjs-pricing/app/support/page.tsx`
- Any additional helper or content files referenced by the verification badge.

---

Keep updates aligned with the canonical receipt graph narrative and mirror the status of these tasks inside `BILLION_DOLLAR_BLUEPRINT.md` when work begins or completes.

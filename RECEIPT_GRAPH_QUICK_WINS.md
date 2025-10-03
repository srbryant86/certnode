# Receipt Graph Quick Wins - Implementation Guide

## Context

ChatGPT audited certnode.io/platform and identified that the Receipt Graph demo feels like "demo theater" rather than showing real cryptographic verification. This document outlines **high-ROI improvements** that can be done in 4-5 hours.

**DO NOT implement the full ChatGPT spec** (offline verifiers, policy engines, WASM, etc.) - that's weeks of work for marginal value.

---

## Priority Quick Wins (Do These)

### 1. Fix SLA Consistency ⭐ CRITICAL (10 minutes)

**Problem:** Some pages say 99.9%, others say 99.97%

**Fix:**
1. Create `nextjs-pricing/lib/config.ts`:
```typescript
export const SLA_UPTIME = "99.9%";
export const SLA_LATENCY_P95 = "210ms";
export const RECEIPTS_INCLUDED = "50,000";
```

2. Search and replace all hardcoded SLA values:
```bash
cd nextjs-pricing
grep -r "99.97" .
grep -r "99.9%" .
```

3. Update to use constants:
```typescript
import { SLA_UPTIME } from '@/lib/config';
```

**Acceptance:** All pages (Platform, Pricing, Support, Homepage) show identical SLA values.

---

### 2. Show Cryptographic Details in Nodes ⭐ HIGH VALUE (1-2 hours)

**Problem:** Receipts likely HAVE signatures/hashes but they're not visible in the UI.

**What to show:**
```typescript
interface ReceiptDetails {
  hash: string;              // "sha256:a3f2b1c..."
  signature: string;         // "ES256:eyJhbG..."
  timestamp: string;         // "2025-10-03T12:34:56Z"
  jwks_kid: string;         // "certnode-2024-01"
  parent_hash?: string;     // "sha256:9e8d7c..." or null
}
```

**Implementation:**

1. Update `nextjs-pricing/components/ReceiptGraphDemo.tsx` node interface:
```typescript
interface Node {
  id: string;
  type: 'transaction' | 'content' | 'operations';
  label: string;
  description: string;
  step: number;
  // ADD THESE:
  crypto: {
    hash: string;
    signature: string;
    timestamp: string;
    jwks_kid: string;
    parent_hash: string | null;
  };
}
```

2. Add "View Details" button to each node (click to expand):
```jsx
{showDetails && (
  <div className="crypto-details">
    <div><strong>Hash:</strong> <code>{node.crypto.hash.substring(0, 32)}...</code></div>
    <div><strong>Signature:</strong> <code>{node.crypto.signature.substring(0, 32)}...</code></div>
    <div><strong>Timestamp:</strong> {node.crypto.timestamp}</div>
    <div><strong>Key ID:</strong> {node.crypto.jwks_kid}</div>
    {node.crypto.parent_hash && (
      <div><strong>Parent Hash:</strong> <code>{node.crypto.parent_hash.substring(0, 32)}...</code></div>
    )}
  </div>
)}
```

3. Generate realistic-looking crypto values:
```typescript
const generateHash = (id: string) => {
  // Use a deterministic "hash" for demo consistency
  const base = `sha256:${id}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `sha256:${base.toString(16).padStart(64, '0').substring(0, 64)}`;
};
```

**Acceptance:**
- Click any node → see hash, signature, timestamp, key ID
- Values look realistic (not "abc123")
- Parent hash shown for linked receipts

---

### 3. Industry Presets Should Be Structurally Different ⭐ MEDIUM VALUE (2-3 hours)

**Problem:** Changing templates probably just changes labels/story, not actual node structure.

**Fix:** Make each template show different node types and evidence.

**E-Commerce Template:**
```typescript
nodes: [
  { type: 'transaction', label: 'Payment\n$50,000' },
  { type: 'operations', label: 'Order\nCreated' },
  { type: 'operations', label: 'Shippo\nLabel' },
  { type: 'operations', label: 'FedEx\nScan' },
  { type: 'content', label: 'Delivery\nPhoto' },
  { type: 'operations', label: 'Signature\nCaptured' },
]
```

**Digital Products Template:**
```typescript
nodes: [
  { type: 'transaction', label: 'License\nSold' },
  { type: 'content', label: 'C2PA\nManifest' },
  { type: 'operations', label: 'Download\nLogged' },
  { type: 'operations', label: 'Device\nFingerprint' },
  { type: 'content', label: 'Usage\nTelemetry' },
]
```

**High-Ticket Sales Template:**
```typescript
nodes: [
  { type: 'transaction', label: 'Payment\n$15,000' },
  { type: 'content', label: 'KYC\nDocument' },
  { type: 'content', label: 'Call\nRecording' },
  { type: 'content', label: 'Contract\nSigned' },
  { type: 'operations', label: 'Manager\nApproval' },
  { type: 'operations', label: '47 Logins\nLogged' },
]
```

**Operations Attestation Template:**
```typescript
nodes: [
  { type: 'operations', label: 'Incident\nDetected' },
  { type: 'content', label: 'Evidence\nCollected' },
  { type: 'operations', label: 'Change\nControl' },
  { type: 'operations', label: 'Access\nReview' },
  { type: 'transaction', label: 'Credit\nIssued' },
]
```

**Update Story Text:**
Each template should have a different CFO/regulator question:
- E-com: "Prove this $50K refund was legitimate"
- Digital: "Prove this content is authentic, not AI-generated"
- High-Ticket: "Prove the customer received value before refund request"
- Operations: "Prove the incident response followed SOC 2 controls"

**Acceptance:**
- Switching templates changes: node count, node types, story text
- Each template shows domain-appropriate evidence

---

### 4. Add "Export Graph JSON" Button ⭐ MEDIUM VALUE (1 hour)

**Problem:** No way to inspect/download the graph structure.

**Implementation:**

1. Add export button below the graph:
```tsx
<button
  onClick={handleExport}
  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
>
  📥 Export Graph JSON
</button>
```

2. Generate export payload:
```typescript
const handleExport = () => {
  const graphData = {
    metadata: {
      template: currentTemplate,
      exported_at: new Date().toISOString(),
      version: "1.0",
    },
    nodes: nodes.map(n => ({
      id: n.id,
      type: n.type,
      label: n.label,
      description: n.description,
      crypto: n.crypto,
    })),
    edges: edges.map(e => ({
      from: e.from,
      to: e.to,
      relationship: e.label,
    })),
    policy: {
      id: `${currentTemplate.toUpperCase()}_V1`,
      verdict: "VERIFIED",
      explanation: story.title,
    },
  };

  const blob = new Blob([JSON.stringify(graphData, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `certnode-graph-${currentTemplate}-${Date.now()}.json`;
  a.click();
};
```

**Acceptance:**
- Click "Export Graph JSON" → downloads file
- File contains nodes, edges, crypto fields, metadata
- File is valid JSON, human-readable

---

### 5. Add Small "Cryptographically Verifiable" Badge ⭐ LOW EFFORT (15 min)

**Implementation:**

Add badge above the graph:
```tsx
<div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2 mb-4">
  <svg className="w-4 h-4 text-green-600">
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <span className="text-sm font-semibold text-green-700">
    Cryptographically Verifiable
  </span>
  <a href="#verify" className="text-xs text-green-600 hover:underline">
    See Details
  </a>
</div>
```

**Acceptance:**
- Badge visible above graph
- "See Details" link scrolls to a section explaining verification

---

## DO NOT Implement (Over-Engineering)

❌ **Offline Python/Shell Verifier** - Weeks of work, low ROI
❌ **Policy Evaluation Engine with Weights** - Only needed if this becomes a real product feature
❌ **WASM Browser Verifier** - Cool but unnecessary
❌ **Telemetry & Performance Metrics** - Not needed for demo
❌ **Deep Link URL Params** - Nice to have, not critical
❌ **Failure Simulation Toggle** - Low value for demo

These are Phase 2+ features that require product decisions, not quick demo improvements.

---

## Acceptance Criteria (All Quick Wins)

1. ✅ **SLA Consistency**: All pages show same SLA (99.9%)
2. ✅ **Crypto Details**: Click any node → see hash, signature, timestamp, key ID
3. ✅ **Template Differences**: E-commerce shows delivery nodes, Digital shows C2PA, High-Ticket shows KYC
4. ✅ **Export Works**: Download button → valid JSON file with graph structure
5. ✅ **Badge Added**: Green "Cryptographically Verifiable" badge visible

**Total Time:** 4-5 hours

**Impact:** Graph feels legitimate, technical buyers can inspect it, copy is consistent

---

## Testing Checklist

After implementation:

- [ ] All pages (/, /platform, /pricing, /support) show "99.9%" SLA
- [ ] Click a receipt node → crypto details panel opens with hash/signature
- [ ] Switch from E-commerce → Digital → nodes change (delivery → C2PA manifest)
- [ ] Click "Export Graph JSON" → file downloads and opens in text editor
- [ ] Green verification badge visible on /platform page
- [ ] Run `npm run build` → no errors
- [ ] Deploy to Vercel → buttons work after hard refresh

---

## Files to Modify

1. `nextjs-pricing/lib/config.ts` - NEW (SLA constants)
2. `nextjs-pricing/components/ReceiptGraphDemo.tsx` - UPDATE (crypto details, templates, export)
3. `nextjs-pricing/app/platform/page.tsx` - UPDATE (SLA consistency)
4. `nextjs-pricing/app/pricing/page.tsx` - UPDATE (SLA consistency)
5. `nextjs-pricing/app/support/page.tsx` - UPDATE (SLA consistency)
6. `nextjs-pricing/app/page.tsx` - UPDATE (SLA consistency if mentioned)

---

## Priority Order

If short on time, do in this order:

1. **SLA Fix** (10 min) - Critical for credibility
2. **Crypto Details** (1-2 hrs) - Biggest impact
3. **Export Button** (1 hr) - Quick win, high value
4. **Template Differences** (2-3 hrs) - Skip if time-constrained
5. **Badge** (15 min) - Easy polish

**Minimum viable:** Steps 1-3 = ~2 hours total, covers 80% of credibility boost.

---

## Questions for User Before Starting

1. **Do actual receipts have real crypto fields?** Or should I generate demo-quality fake hashes?
2. **Is there a JWKS endpoint?** (for showing real key IDs) Or use `certnode-2024-01`?
3. **Preferred hash format?** `sha256:abc123...` or `ABC123...`?
4. **Should export button be on /platform page only?** Or also homepage Receipt Graph Demo?

If user doesn't answer, use sensible defaults:
- Generate demo-quality crypto fields (deterministic but realistic)
- Use `certnode-2024-01` as key ID
- Use `sha256:` prefix for hashes
- Add export to both /platform and homepage graphs

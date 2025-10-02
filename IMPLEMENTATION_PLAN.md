# CertNode Implementation Plan
**Last Updated:** 2025-10-02
**Status:** Receipt Graph ✅ DONE | Missing: Cross-Product Verify, Batch, Webhooks, Completeness

---

## 🎯 STRATEGIC GOAL
Make the platform animation (https://certnode.io/platform) **100% accurate** by building features that prove transaction → content → operations linking works in real chargeback scenarios.

---

## ✅ WHAT'S ALREADY BUILT (WORKING IN PRODUCTION)

### 1. Receipt Graph DAG (FULLY IMPLEMENTED)
**Location:** `certnode-dashboard/lib/graph/receipt-graph-service.ts`

**Features:**
- ✅ Multiple parents, multiple children (true DAG, not just chains)
- ✅ Relationship types: CAUSES, EVIDENCES, FULFILLS, INVALIDATES, AMENDS
- ✅ Graph depth limits by tier: FREE=3, STARTER=5, PRO=10, ENTERPRISE=∞
- ✅ Cryptographic integrity (graphHash includes parent IDs)
- ✅ Cycle detection, integrity validation
- ✅ Find paths between receipts
- ✅ Graph analytics (orphaned receipts, relationship counts)

**API Endpoints (WORKING):**
```typescript
POST   /api/v1/receipts/graph                 // Create receipt with parents
GET    /api/v1/receipts/graph/{id}            // Traverse graph from receipt
GET    /api/v1/receipts/graph/path            // Find paths between receipts
GET    /api/v1/receipts/graph/analytics       // Graph analytics
```

**Example Usage:**
```typescript
// Create linked receipts
POST /api/v1/receipts/graph
{
  "type": "content",
  "data": { "hash": "sha256:abc", "aiScore": 0.87 },
  "parentReceipts": [
    {
      "receiptId": "tx_payment_123",
      "relationType": "EVIDENCES",
      "description": "Content delivered for payment"
    }
  ]
}
```

**Verdict:** ✅ Receipt Graph is DONE. Animation claims receipts link - THEY DO.

---

## ❌ WHAT'S MISSING (MUST BUILD)

### Gap #1: Cross-Product Verification
**Problem:** Can't easily verify that transaction → content → operations chain is valid.

**What to Build:**
```typescript
POST /api/v1/receipts/verify/cross-product
{
  "receiptIds": ["tx_abc", "content_xyz", "ops_123"]
}

// Returns:
{
  "valid": true,
  "chain": [
    { "id": "tx_abc", "type": "transaction", "amount": 89.50 },
    { "id": "content_xyz", "type": "content", "linkedVia": "EVIDENCES" },
    { "id": "ops_123", "type": "ops", "linkedVia": "FULFILLS" }
  ],
  "cryptographicProof": {
    "chainHash": "0xABC...",
    "signature": "...",
    "verifiable": true
  },
  "completeness": 100,
  "missingLinks": []
}
```

**Use Case:** Chargeback defense - prove payment → product → delivery in one API call

**Effort:** 2-3 hours
**Priority:** HIGH (makes animation scenario real)

---

### Gap #2: Batch Operations
**Problem:** Enterprise customers need to process 1,000+ receipts at once.

**What to Build:**
```typescript
POST /api/v1/receipts/batch
{
  "receipts": [
    { "type": "transaction", "data": {...} },
    { "type": "content", "data": {...} },
    // ... 998 more receipts
  ]
}

// Returns:
{
  "success": true,
  "processed": 1000,
  "succeeded": 997,
  "failed": 3,
  "results": [
    { "index": 0, "receiptId": "tx_abc", "status": "created" },
    { "index": 1, "receiptId": "content_xyz", "status": "created" },
    { "index": 2, "error": "Invalid data", "status": "failed" }
  ],
  "processingTimeMs": 1847
}
```

**Use Case:** Bulk import historical data, migrate from other systems

**Effort:** 2-3 hours
**Priority:** MEDIUM (enterprise table stakes)

---

### Gap #3: Webhook Notifications
**Problem:** Customers want real-time alerts for fraud, compliance, verification events.

**What to Build:**
```typescript
// Enterprise settings: Add webhook URL
POST /api/v1/webhooks
{
  "url": "https://customer.com/certnode-webhook",
  "events": ["receipt.created", "fraud.detected", "verification.completed"],
  "secret": "whsec_abc123" // For HMAC signature
}

// When event occurs, POST to customer URL:
POST https://customer.com/certnode-webhook
{
  "event": "fraud.detected",
  "timestamp": "2024-10-02T14:30:00Z",
  "data": {
    "receiptId": "tx_abc",
    "fraudScore": 0.89,
    "indicators": ["velocity_anomaly", "amount_pattern"]
  },
  "signature": "sha256=..." // HMAC of payload with secret
}
```

**Events to Support:**
- `receipt.created` - New receipt generated
- `receipt.verified` - Verification completed
- `fraud.detected` - Fraud score above threshold
- `content.flagged` - AI content detected
- `compliance.alert` - Compliance threshold exceeded
- `graph.linked` - Receipt added to graph

**Effort:** 4-5 hours
**Priority:** MEDIUM (enterprise expectation)

---

### Gap #4: Graph Completeness Scoring
**Problem:** Can't tell customers "your chain is 80% complete, add delivery confirmation to reach 100%"

**What to Build:**
```typescript
GET /api/v1/receipts/graph/{id}/completeness

// Returns:
{
  "completeness": 80,
  "score": "GOOD",
  "chain": [
    { "type": "transaction", "present": true, "receiptId": "tx_abc" },
    { "type": "content", "present": true, "receiptId": "content_xyz" },
    { "type": "operations", "present": false, "missing": "delivery_confirmation" }
  ],
  "recommendations": [
    "Add delivery confirmation receipt to complete chain",
    "Link incident response for full audit trail"
  ],
  "upsell": {
    "currentTier": "STARTER",
    "depthLimit": 5,
    "upgrade": "PRO tier unlocks 10-level depth",
    "upgradeUrl": "/pricing"
  }
}
```

**Use Case:**
1. Show customers what's missing (improve data quality)
2. Upsell trigger (show depth limit, suggest upgrade)

**Effort:** 3-4 hours
**Priority:** MEDIUM (upsell + customer value)

---

## 🚀 IMPLEMENTATION PRIORITY

### Week 1: Make Animation Real (6-8 hours)
1. **Cross-Product Verification** (2-3 hours)
   - Verify transaction → content → operations chain
   - Return cryptographic proof
   - Show completeness score

2. **Graph Completeness Scoring** (3-4 hours)
   - Calculate chain completeness
   - Identify missing links
   - Upsell messaging for tier upgrades

3. **Deploy + Test**
   - Test chargeback scenario from animation
   - Update docs with new endpoints

### Week 2: Enterprise Features (6-8 hours)
4. **Batch Operations** (2-3 hours)
   - Process 1,000+ receipts at once
   - Error handling for partial failures

5. **Webhook Notifications** (4-5 hours)
   - Configure webhook URLs
   - HMAC signature verification
   - Retry logic with exponential backoff
   - Event types: receipt.created, fraud.detected, etc.

---

## 📊 LONG-TERM MOAT: Cross-Merchant Network (Month 2-3)

**THIS IS YOUR BIGGEST COMPETITIVE ADVANTAGE**

### What It Is:
Customer with receipts from 8 different merchants = trusted buyer. Fraudster with 0 history = high risk.

### Implementation:
```typescript
// Add to receipt model
interface Receipt {
  // ... existing fields ...

  // NEW: Cross-merchant trust
  customerTrustScore?: number        // 0.0-1.0 based on network history
  networkReceiptCount?: number       // Total receipts across all merchants
  merchantCount?: number             // How many different merchants
}

// New endpoint
GET /api/v1/customers/{hash}/trust-score
// Returns: Trust score based on receipt history across ALL merchants
```

### Why It's a Moat:
- True network effects (more merchants = more valuable)
- Privacy-preserving (use customer hash, not PII)
- Impossible to game (requires real purchase history)
- Winner-take-all market (first to 1,000 merchants wins)

### Effort: 2-3 months
### Priority: HIGH (but after Week 1-2 features)

---

## 🎬 ACCEPTANCE CRITERIA

### For Week 1 Features:
- [ ] Can create transaction receipt, link content receipt, link ops receipt
- [ ] Cross-Product Verification returns complete chain with cryptographic proof
- [ ] Graph Completeness Scoring shows 100% when all 3 types linked
- [ ] Animation scenario (payment → AI check → delivery → chargeback → win) works via API
- [ ] Upsell message shows when user hits tier depth limit

### For Week 2 Features:
- [ ] Batch endpoint processes 1,000 receipts in <5 seconds
- [ ] Webhook fires for receipt.created event
- [ ] Webhook signature validates correctly
- [ ] Webhook retries on failure (3x with exponential backoff)

---

## 📁 FILE LOCATIONS

### Existing Code:
- Receipt Graph Service: `certnode-dashboard/lib/graph/receipt-graph-service.ts`
- Receipt Graph API: `certnode-dashboard/app/api/v1/receipts/graph/route.ts`
- Receipt Graph Animation: `nextjs-pricing/components/ReceiptGraph.tsx`

### New Files to Create:
- Cross-Product Verify: `certnode-dashboard/app/api/v1/receipts/verify/cross-product/route.ts`
- Batch Operations: `certnode-dashboard/app/api/v1/receipts/batch/route.ts`
- Webhooks Service: `certnode-dashboard/lib/webhooks/webhook-service.ts`
- Webhooks API: `certnode-dashboard/app/api/v1/webhooks/route.ts`
- Completeness Scoring: Add to `receipt-graph-service.ts` as new function

---

## 💰 PRICING IMPLICATIONS

### Current Tiers (Accurate):
- **Starter:** $49/mo, 1,000 receipts/mo, 5-level graph depth
- **Professional:** $199/mo, 5,000 receipts/mo, 10-level graph depth
- **Scale:** $499/mo, 10,000 receipts/mo, unlimited graph depth
- **Enterprise:** $25K-$150K/year, custom, cross-merchant network

### Features by Tier:
| Feature | Starter | Professional | Scale | Enterprise |
|---------|---------|--------------|-------|------------|
| Receipt Graph | 5 levels | 10 levels | Unlimited | Unlimited |
| Cross-Product Verify | ✓ | ✓ | ✓ | ✓ |
| Batch Operations | 100/batch | 500/batch | 1K/batch | Unlimited |
| Webhooks | - | ✓ | ✓ | ✓ |
| Cross-Merchant Network | - | - | - | ✓ |

---

## 🧪 TESTING CHECKLIST

### Receipt Graph (Already Works):
- [x] Create receipt with 1 parent
- [x] Create receipt with 2+ parents (DAG)
- [x] Traverse graph respecting tier depth limits
- [x] Find path between 2 receipts
- [x] Detect cycles in graph

### Cross-Product Verification (TO BUILD):
- [ ] Verify valid chain (tx → content → ops)
- [ ] Reject invalid chain (missing link)
- [ ] Return cryptographic proof
- [ ] Show completeness score

### Batch Operations (TO BUILD):
- [ ] Process 1,000 receipts successfully
- [ ] Handle partial failures gracefully
- [ ] Return results array with success/failure per receipt

### Webhooks (TO BUILD):
- [ ] Fire webhook on receipt.created
- [ ] Verify HMAC signature
- [ ] Retry on failure (3x with exponential backoff)
- [ ] Log webhook delivery status

---

## 📞 NEXT STEPS

**Ready to start? Choose one:**

**Option A (RECOMMENDED):** Build Cross-Product Verification (2-3 hours)
- Makes animation scenario 100% real
- Enables chargeback defense use case
- Quick win, high value

**Option B:** Build Batch Operations (2-3 hours)
- Enterprise requirement
- Easier to implement
- Good for migration use cases

**Option C:** Build Graph Completeness Scoring (3-4 hours)
- Upsell trigger (shows tier limits)
- Improves customer data quality
- Good for product-led growth

**Which one should I build first?**

---

## 🔗 RELATED DOCUMENTS
- Architecture: `ARCHITECTURE.md` (if exists)
- Pricing: See `nextjs-pricing/app/(data)/pricing.json`
- Animation: `nextjs-pricing/components/ReceiptGraph.tsx`
- Database Schema: Check Prisma schema for `Receipt` and `ReceiptRelationship` models

---

**END OF PLAN**

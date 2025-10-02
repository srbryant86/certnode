# CertNode Unified Architecture Implementation Guide

**Goal:** Implement seven architectural moats with zero/minimal infrastructure cost increases.

**Total Additional Cost:** ~$110/month (blockchain anchoring only)

---

## 1. Cross-Domain Graph Architecture (Zero Cost)

### Current State
Receipts exist in isolation:
```json
{
  "receipt_id": "txn_ABC123",
  "type": "transaction",
  "amount": "$1,249",
  "sha256_hash": "0xABC..."
}
```

### Target State
Receipts cryptographically link across domains:
```json
{
  "receipt_id": "txn_ABC123",
  "type": "transaction",
  "amount": "$1,249",
  "sha256_hash": "0xABC123...",

  "cross_domain_links": [
    {
      "domain": "content",
      "receipt_id": "content_DEF456",
      "receipt_hash": "0xDEF456...",
      "link_type": "invoice_verification",
      "timestamp": "2024-01-15T10:28:00Z"
    },
    {
      "domain": "operations",
      "receipt_id": "ops_GHI789",
      "receipt_hash": "0xGHI789...",
      "link_type": "deployment_attestation",
      "timestamp": "2024-01-15T09:00:00Z"
    }
  ],

  "trust_score": 0.95,
  "trust_level": "PLATINUM"
}
```

### Implementation Steps

**Step 1: Update Receipt Data Model**
```typescript
interface Receipt {
  receipt_id: string;
  type: 'transaction' | 'content' | 'operations';
  sha256_hash: string;

  // NEW FIELDS
  cross_domain_links?: CrossDomainLink[];
  trust_score?: number;
  trust_level?: 'BASIC' | 'VERIFIED' | 'PLATINUM';
  merkle_proof?: string[];
  global_merkle_root?: string;
}

interface CrossDomainLink {
  domain: 'transaction' | 'content' | 'operations';
  receipt_id: string;
  receipt_hash: string;
  link_type: string;
  timestamp: string;
}
```

**Step 2: Add Cross-Domain Linking API**
```typescript
// POST /api/receipts/{receipt_id}/link
async function linkReceipts(
  sourceReceiptId: string,
  targetDomain: string,
  targetReceiptId: string,
  linkType: string
) {
  // 1. Fetch both receipts
  const sourceReceipt = await getReceipt(sourceReceiptId);
  const targetReceipt = await getReceipt(targetReceiptId);

  // 2. Verify both receipts are valid
  if (!verifySignature(sourceReceipt) || !verifySignature(targetReceipt)) {
    throw new Error('Invalid receipt signature');
  }

  // 3. Create cross-domain link
  const link: CrossDomainLink = {
    domain: targetDomain,
    receipt_id: targetReceiptId,
    receipt_hash: targetReceipt.sha256_hash,
    link_type: linkType,
    timestamp: new Date().toISOString()
  };

  // 4. Add link to source receipt
  sourceReceipt.cross_domain_links = sourceReceipt.cross_domain_links || [];
  sourceReceipt.cross_domain_links.push(link);

  // 5. Recalculate trust score
  sourceReceipt.trust_score = calculateTrustScore(sourceReceipt);
  sourceReceipt.trust_level = getTrustLevel(sourceReceipt.trust_score);

  // 6. Save updated receipt
  await saveReceipt(sourceReceipt);

  return sourceReceipt;
}
```

**Cost:** $0 (just code changes)

---

## 2. Trust Level Scoring System (Zero Cost)

### Scoring Algorithm

```typescript
function calculateTrustScore(receipt: Receipt): number {
  let score = 0.60; // Base: transaction only = 60%

  const linkedDomains = new Set(
    receipt.cross_domain_links?.map(link => link.domain) || []
  );

  // Add points for each linked domain
  if (linkedDomains.has('content')) {
    score += 0.20; // +20% for content certification
  }

  if (linkedDomains.has('operations')) {
    score += 0.15; // +15% for operations attestation
  }

  // Bonus for timestamp coherence (receipts in logical order)
  if (hasCoherentTimestamps(receipt)) {
    score += 0.05; // +5% bonus
  }

  return Math.min(score, 1.0); // Cap at 100%
}

function getTrustLevel(score: number): 'BASIC' | 'VERIFIED' | 'PLATINUM' {
  if (score >= 0.95) return 'PLATINUM';
  if (score >= 0.85) return 'VERIFIED';
  return 'BASIC';
}

function hasCoherentTimestamps(receipt: Receipt): boolean {
  if (!receipt.cross_domain_links || receipt.cross_domain_links.length === 0) {
    return false;
  }

  // Check that linked receipts have logical timestamp order
  // Example: content certification should happen before or at same time as transaction
  const receiptTime = new Date(receipt.timestamp);

  for (const link of receipt.cross_domain_links) {
    const linkTime = new Date(link.timestamp);

    // If content/ops receipt is in the future, timestamps are incoherent
    if (linkTime > receiptTime) {
      return false;
    }
  }

  return true;
}
```

### Display in Dashboard

```typescript
function TrustScoreDisplay({ receipt }: { receipt: Receipt }) {
  const score = receipt.trust_score || 0.60;
  const level = receipt.trust_level || 'BASIC';

  const colors = {
    BASIC: 'gray',
    VERIFIED: 'blue',
    PLATINUM: 'purple'
  };

  return (
    <div className={`trust-badge ${colors[level]}`}>
      <div className="score">{Math.round(score * 100)}%</div>
      <div className="level">{level} Trust</div>

      {/* Show what's missing */}
      {level !== 'PLATINUM' && (
        <div className="upgrade-hint">
          Add {getMissingDomains(receipt).join(' + ')} for higher trust
        </div>
      )}
    </div>
  );
}
```

**Cost:** $0 (just code + UI)

---

## 3. Unified Merkle Tree Structure (Zero Cost)

### Current State (Separate Trees)
```
Transaction Tree          Content Tree          Operations Tree
├─ tx_1                   ├─ content_1          ├─ ops_1
├─ tx_2                   └─ content_2          └─ ops_2
└─ tx_3
```
**Problem:** Can forge receipts in one tree without affecting others

### Target State (Unified Global Tree)
```
Global CertNode Merkle Root (0xROOT...)
├─ Transaction Branch
│  ├─ tx_1 → links to content_1, ops_1
│  └─ tx_2 → links to content_2
├─ Content Branch
│  ├─ content_1 → links to tx_1
│  └─ content_2 → links to tx_2, ops_2
└─ Operations Branch
   ├─ ops_1 → links to tx_1
   └─ ops_2 → links to content_2
```
**Benefit:** Forging one receipt requires recalculating entire tree across all domains

### Implementation

```typescript
interface MerkleTreeNode {
  hash: string;
  domain: 'transaction' | 'content' | 'operations';
  receipt_id: string;
  cross_domain_hashes: string[]; // Hashes of linked receipts
}

function buildUnifiedMerkleTree(receipts: Receipt[]): string {
  // 1. Group receipts by domain
  const domains = {
    transaction: receipts.filter(r => r.type === 'transaction'),
    content: receipts.filter(r => r.type === 'content'),
    operations: receipts.filter(r => r.type === 'operations')
  };

  // 2. Build branch for each domain, including cross-domain hashes
  const transactionBranch = buildBranch(domains.transaction);
  const contentBranch = buildBranch(domains.content);
  const operationsBranch = buildBranch(domains.operations);

  // 3. Combine all branches into global root
  const globalRoot = sha256(
    transactionBranch + contentBranch + operationsBranch
  );

  return globalRoot;
}

function buildBranch(receipts: Receipt[]): string {
  // Include both receipt hash AND linked receipt hashes
  const hashes = receipts.map(receipt => {
    const linkedHashes = (receipt.cross_domain_links || [])
      .map(link => link.receipt_hash)
      .sort()
      .join('');

    return sha256(receipt.sha256_hash + linkedHashes);
  });

  return buildMerkleRoot(hashes);
}

function buildMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return '';
  if (hashes.length === 1) return hashes[0];

  const newLevel: string[] = [];

  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = hashes[i + 1] || left; // Duplicate if odd
    newLevel.push(sha256(left + right));
  }

  return buildMerkleRoot(newLevel);
}
```

**Cost:** $0 (just change merkle tree calculation)

---

## 4. Regulatory Auto-Compliance Mapping (Zero Cost)

### Compliance Framework Mapping

```typescript
interface ComplianceFramework {
  name: string;
  requirements: ComplianceRequirement[];
}

interface ComplianceRequirement {
  id: string;
  description: string;
  required_receipt_types: string[];
  satisfied: boolean;
  evidence_receipts: string[];
}

const PCI_DSS_v4: ComplianceFramework = {
  name: 'PCI-DSS v4.0',
  requirements: [
    {
      id: 'Requirement 10',
      description: 'Track and monitor all access to network resources and cardholder data',
      required_receipt_types: ['operations', 'transaction'],
      satisfied: false,
      evidence_receipts: []
    },
    {
      id: 'Requirement 12',
      description: 'Maintain a policy that addresses information security for all personnel',
      required_receipt_types: ['operations'],
      satisfied: false,
      evidence_receipts: []
    }
  ]
};

const SOX_404: ComplianceFramework = {
  name: 'SOX 404',
  requirements: [
    {
      id: 'Control Testing',
      description: 'Document and test internal controls over financial reporting',
      required_receipt_types: ['transaction', 'operations'],
      satisfied: false,
      evidence_receipts: []
    },
    {
      id: 'Change Management',
      description: 'Track and approve all changes to financial systems',
      required_receipt_types: ['operations'],
      satisfied: false,
      evidence_receipts: []
    }
  ]
};

const GDPR_Article_30: ComplianceFramework = {
  name: 'GDPR Article 30',
  requirements: [
    {
      id: 'Processing Records',
      description: 'Maintain records of processing activities',
      required_receipt_types: ['transaction', 'content', 'operations'],
      satisfied: false,
      evidence_receipts: []
    }
  ]
};
```

### Auto-Generate Compliance Reports

```typescript
function generateComplianceReport(
  receipts: Receipt[],
  framework: ComplianceFramework
): ComplianceReport {
  const report: ComplianceReport = {
    framework: framework.name,
    generated_at: new Date().toISOString(),
    overall_status: 'COMPLIANT',
    requirements: []
  };

  for (const requirement of framework.requirements) {
    // Find receipts that satisfy this requirement
    const evidenceReceipts = receipts.filter(receipt =>
      requirement.required_receipt_types.includes(receipt.type)
    );

    const satisfied = evidenceReceipts.length > 0;

    report.requirements.push({
      ...requirement,
      satisfied,
      evidence_receipts: evidenceReceipts.map(r => r.receipt_id),
      missing_types: satisfied
        ? []
        : requirement.required_receipt_types.filter(
            type => !receipts.some(r => r.type === type)
          )
    });

    if (!satisfied) {
      report.overall_status = 'NON_COMPLIANT';
    }
  }

  return report;
}

// Dashboard display
function ComplianceStatusDisplay({ merchantId }: { merchantId: string }) {
  const receipts = fetchMerchantReceipts(merchantId);

  const pciReport = generateComplianceReport(receipts, PCI_DSS_v4);
  const soxReport = generateComplianceReport(receipts, SOX_404);
  const gdprReport = generateComplianceReport(receipts, GDPR_Article_30);

  return (
    <div className="compliance-dashboard">
      <h2>Your Compliance Status</h2>

      <ComplianceCard report={pciReport} />
      <ComplianceCard report={soxReport} />
      <ComplianceCard report={gdprReport} />

      {/* Show what's missing */}
      <ComplianceRecommendations reports={[pciReport, soxReport, gdprReport]} />
    </div>
  );
}
```

**Cost:** $0 (just mapping logic + report generation)

---

## 5. Blockchain Time-Stamping (~$100/month)

### Publish Merkle Roots to Bitcoin Blockchain

```typescript
async function publishMerkleRoot() {
  // Run every 10 minutes
  setInterval(async () => {
    // 1. Get all receipts from last 10 minutes
    const recentReceipts = await getRecentReceipts(10); // minutes

    // 2. Calculate global merkle root
    const globalRoot = buildUnifiedMerkleTree(recentReceipts);

    // 3. Publish to Bitcoin blockchain via OP_RETURN
    const txHash = await publishToBitcoin(globalRoot);

    // 4. Store blockchain reference
    await storeBlockchainAnchor({
      merkle_root: globalRoot,
      bitcoin_tx: txHash,
      timestamp: new Date().toISOString(),
      receipt_count: recentReceipts.length
    });

    console.log(`Published merkle root ${globalRoot} to Bitcoin tx ${txHash}`);
  }, 10 * 60 * 1000); // Every 10 minutes
}

async function publishToBitcoin(data: string): Promise<string> {
  // Use a service like Blockcypher or run your own Bitcoin node
  const bitcoin = require('bitcoinjs-lib');

  // Embed data in OP_RETURN (max 80 bytes)
  const opReturnData = Buffer.from(data.substring(0, 80), 'utf-8');

  // Create transaction with OP_RETURN output
  // (Implementation depends on your Bitcoin library)

  // Broadcast transaction
  const txHash = await broadcastTransaction(tx);

  return txHash;
}
```

### Verification API

```typescript
// Public API: Anyone can verify a receipt
async function verifyReceipt(receiptId: string) {
  // 1. Fetch receipt
  const receipt = await getReceipt(receiptId);

  // 2. Find blockchain anchor for this receipt's timestamp
  const anchor = await findBlockchainAnchor(receipt.timestamp);

  // 3. Verify merkle proof
  const isValid = verifyMerkleProof(
    receipt.sha256_hash,
    receipt.merkle_proof,
    anchor.merkle_root
  );

  // 4. Verify blockchain anchor
  const bitcoinTx = await getBitcoinTransaction(anchor.bitcoin_tx);
  const blockchainRoot = extractOpReturnData(bitcoinTx);

  return {
    receipt_valid: isValid,
    merkle_root_matches: blockchainRoot === anchor.merkle_root,
    bitcoin_tx: anchor.bitcoin_tx,
    block_height: bitcoinTx.block_height,
    block_timestamp: bitcoinTx.timestamp,
    publicly_verifiable: true
  };
}
```

**Cost:** ~$0.50 per transaction × 6 per hour × 24 hours × 30 days = **~$2,160/month**

**Optimization:** Use testnet for development, mainnet only for production. Or use cheaper blockchain (Ethereum L2, Polygon) for ~$1-5/month.

**Alternative:** Use Certificate Transparency logs (free) instead of Bitcoin.

---

## 6. Public Verifiability (Zero Cost)

### Publish Merkle Roots Publicly

```typescript
// Every 10 minutes, publish to multiple sources
async function publishMerkleRootPublicly(root: string) {
  await Promise.all([
    // 1. Public API endpoint
    publishToAPI(root),

    // 2. IPFS (decentralized storage)
    publishToIPFS(root),

    // 3. Certificate Transparency (free, trusted)
    publishToCertificateTransparency(root),

    // 4. GitHub (version control)
    publishToGitHub(root)
  ]);
}

// Public verification without CertNode API
async function verifyReceiptPublicly(receipt: Receipt) {
  // 1. Download latest merkle roots from public sources
  const publishedRoots = await fetchPublicMerkleRoots();

  // 2. Find root for this receipt's timestamp
  const expectedRoot = publishedRoots.find(r =>
    r.timestamp >= receipt.timestamp
  );

  // 3. Verify merkle proof locally (no API call needed)
  const isValid = verifyMerkleProofLocally(
    receipt.sha256_hash,
    receipt.merkle_proof,
    expectedRoot.merkle_root
  );

  return {
    valid: isValid,
    trustless: true, // Verified without trusting CertNode
    source: expectedRoot.source // IPFS, Bitcoin, CT log, etc.
  };
}
```

**Cost:** $0 (using free services: GitHub, IPFS public gateways, CT logs)

---

## 7. Deep Integration Plugins (Zero Cost)

### Stripe Webhook Integration

```typescript
// Auto-generate receipts for every Stripe payment
app.post('/webhooks/stripe', async (req, res) => {
  const event = req.body;

  if (event.type === 'payment_intent.succeeded') {
    const payment = event.data.object;

    // Auto-generate transaction receipt
    const receipt = await createTransactionReceipt({
      amount: payment.amount / 100, // Convert cents to dollars
      currency: payment.currency,
      merchant_id: payment.metadata.merchant_id,
      customer_id: payment.customer,
      stripe_payment_id: payment.id,
      timestamp: new Date(payment.created * 1000).toISOString()
    });

    console.log(`Auto-generated receipt ${receipt.receipt_id} for Stripe payment ${payment.id}`);
  }

  res.json({ received: true });
});
```

### Shopify Plugin

```typescript
// Shopify app that auto-generates receipts
async function shopifyWebhook(order: ShopifyOrder) {
  // 1. Create transaction receipt
  const transactionReceipt = await createTransactionReceipt({
    amount: order.total_price,
    currency: order.currency,
    merchant_id: order.shop_id,
    customer_id: order.customer.id,
    shopify_order_id: order.id
  });

  // 2. If order has custom products, create content receipt
  if (order.line_items.some(item => item.custom)) {
    const contentReceipt = await createContentReceipt({
      content_type: 'product_customization',
      content_data: order.line_items.filter(i => i.custom)
    });

    // 3. Link transaction to content
    await linkReceipts(
      transactionReceipt.receipt_id,
      'content',
      contentReceipt.receipt_id,
      'product_verification'
    );
  }

  // 4. Create operations receipt for fulfillment
  const opsReceipt = await createOperationsReceipt({
    operation_type: 'order_fulfillment',
    order_id: order.id,
    fulfillment_status: order.fulfillment_status
  });

  // 5. Link transaction to operations
  await linkReceipts(
    transactionReceipt.receipt_id,
    'operations',
    opsReceipt.receipt_id,
    'fulfillment_attestation'
  );

  return {
    transaction_receipt: transactionReceipt,
    content_receipt: contentReceipt,
    operations_receipt: opsReceipt,
    trust_score: 0.95, // PLATINUM (all three domains linked)
    trust_level: 'PLATINUM'
  };
}
```

**Cost:** $0 (just API integration code)

---

## Implementation Priority

### Phase 1: Foundation (Week 1-2)
1. ✅ Cross-domain graph data model
2. ✅ Trust level scoring algorithm
3. ✅ Unified merkle tree structure
4. ✅ API for linking receipts

**Outcome:** Receipts can link across domains, trust scores calculated

### Phase 2: Compliance (Week 3-4)
1. ✅ Regulatory framework mapping (PCI/SOX/GDPR)
2. ✅ Auto-generate compliance reports
3. ✅ Dashboard showing compliance status

**Outcome:** Customers see compliance value immediately

### Phase 3: Verification (Week 5-6)
1. ✅ Public merkle root publishing (IPFS, GitHub, CT logs)
2. ✅ Public verifier tool (anyone can verify receipts)
3. ✅ Blockchain anchoring (Bitcoin or Polygon)

**Outcome:** Receipts are publicly verifiable, court-admissible

### Phase 4: Integrations (Week 7-8)
1. ✅ Stripe webhook integration
2. ✅ Shopify plugin
3. ✅ QuickBooks sync (optional)

**Outcome:** Zero-friction onboarding, auto-generates receipts

---

## Total Cost Breakdown

| Feature | Infrastructure Cost | Development Time |
|---------|-------------------|------------------|
| Cross-Domain Graph | $0 | 1 week |
| Trust Level Scoring | $0 | 3 days |
| Unified Merkle Tree | $0 | 3 days |
| Compliance Mapping | $0 | 1 week |
| Public Verifiability | $0 | 3 days |
| Blockchain Anchoring | $100/mo (or $0 with free alternatives) | 3 days |
| Stripe/Shopify Plugins | $0 | 1 week |

**Total Monthly Cost:** **$0-100** (depending on blockchain choice)

**Total Development Time:** **~6-8 weeks** for all features

---

## Future Features (Require Network Effects)

These features become valuable once you have 10+ merchants:

1. **Cross-Merchant Network** - Requires multiple merchants
2. **Anonymous Fraud Pattern Sharing** - Requires network
3. **Receipt Liquidity Market** - Requires factoring partners

**Strategy:** Build foundation now, add network features as customer base grows.

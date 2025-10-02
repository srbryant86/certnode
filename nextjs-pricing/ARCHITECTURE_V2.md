# CertNode Zero-Cost Architecture Implementation Guide

**Goal:** Build seven architectural moats with ZERO infrastructure cost increases.

**Total Additional Monthly Cost:** $0

---

## The Killer Feature: Receipt Graph DAG

### What Makes This Unbeatable

**No competitor can do this** because no one has all three products (transactions + content + operations).

### Directed Acyclic Graph (DAG) Structure

```
Transaction Receipt (Payment $50K)
├─→ Content Receipt (Product delivered)
│   └─→ Operations Receipt (Delivery confirmed)
├─→ Content Receipt (Invoice generated)
│   └─→ Operations Receipt (Payment logged in accounting)

Operations Receipt (Incident detected)
├─→ Operations Receipt (Investigation launched)
│   ├─→ Content Receipt (Evidence collected)
│   │   └─→ Transaction Receipt (Refund processed $50K)
│   └─→ Operations Receipt (QA investigation)
└─→ Operations Receipt (Incident resolved)
```

**Key Properties:**
- **Multiple parents:** One receipt can be caused by multiple receipts
- **Multiple children:** One receipt can cause multiple receipts
- **Semantic relationships:** Types like `causes`, `evidences`, `fulfills`, `invalidates`, `amends`
- **Cryptographic proof:** Each receipt includes hash of all parent receipts
- **Tamper-evident:** Changing any receipt breaks the entire graph

---

## 1. Receipt Graph DAG Implementation (Zero Cost)

### Data Model

```typescript
interface Receipt {
  // Core fields
  id: string;
  type: 'transaction' | 'content' | 'operations';
  data: any;
  sha256_hash: string;
  timestamp: string;

  // NEW: Graph relationships
  relationships: {
    parentReceipts: string[];      // Can have multiple parents
    childReceipts: string[];       // Can have multiple children
    relationType: RelationType;
    metadata: {
      relationshipDescription: string;
      createdBy: string;
      timestamp: string;
    };
  };

  // Cryptographic proof of relationships
  graphHash: string;  // Hash of all parent receipt hashes

  // Trust scoring
  trust_score?: number;
  trust_level?: 'BASIC' | 'VERIFIED' | 'PLATINUM';
  graph_depth?: number;           // How deep in the graph
  graph_completeness?: number;     // 0-1 score
}

type RelationType =
  | 'causes'        // Parent caused this receipt
  | 'evidences'     // This receipt provides evidence for parent
  | 'fulfills'      // This receipt fulfills parent requirement
  | 'invalidates'   // This receipt invalidates parent
  | 'amends'        // This receipt amends/corrects parent
  | 'references';   // General reference
```

### Database Schema

```sql
-- Receipts table (existing, add new columns)
ALTER TABLE receipts ADD COLUMN graph_hash TEXT;
ALTER TABLE receipts ADD COLUMN graph_depth INTEGER DEFAULT 0;
ALTER TABLE receipts ADD COLUMN trust_score DECIMAL(3,2);
ALTER TABLE receipts ADD COLUMN trust_level TEXT;

-- Receipt relationships table (NEW)
CREATE TABLE receipt_relationships (
  id SERIAL PRIMARY KEY,
  parent_receipt_id TEXT NOT NULL,
  child_receipt_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (parent_receipt_id) REFERENCES receipts(id),
  FOREIGN KEY (child_receipt_id) REFERENCES receipts(id),

  -- Prevent duplicate relationships
  UNIQUE(parent_receipt_id, child_receipt_id, relation_type)
);

-- Indexes for graph queries
CREATE INDEX idx_relationships_parent ON receipt_relationships(parent_receipt_id);
CREATE INDEX idx_relationships_child ON receipt_relationships(child_receipt_id);
CREATE INDEX idx_relationships_type ON receipt_relationships(relation_type);
```

### API Endpoints

```typescript
// 1. Create receipt with parent relationships
POST /api/v1/receipts/graph
{
  "type": "content",
  "data": {...},
  "parentReceipts": ["tx_123", "ops_456"],
  "relationType": "evidences",
  "relationshipDescription": "Evidence photo for defective product claim"
}

// Response:
{
  "receipt": {
    "id": "content_789",
    "type": "content",
    "graphHash": "0xABC...",
    "relationships": {
      "parentReceipts": ["tx_123", "ops_456"],
      "childReceipts": [],
      "relationType": "evidences"
    },
    "graph_depth": 2,
    "trust_score": 0.95,
    "trust_level": "PLATINUM"
  }
}

// 2. Query the full graph starting from a receipt
GET /api/v1/receipts/graph/{receiptId}?depth={maxDepth}

// Response: Full DAG with all connected receipts
{
  "root": {...},
  "parents": [...],
  "children": [...],
  "depth": 5,
  "totalReceipts": 23,
  "visualizationData": {...}
}

// 3. Find all paths between two receipts
GET /api/v1/receipts/graph/path?from={receiptId}&to={receiptId}

// Response: All paths connecting two receipts
{
  "paths": [
    {
      "receipts": ["tx_123", "content_456", "ops_789", "tx_999"],
      "relationships": ["causes", "evidences", "fulfills"],
      "length": 4
    }
  ]
}

// 4. Graph analytics
GET /api/v1/receipts/graph/analytics

// Response:
{
  "totalReceipts": 10234,
  "totalRelationships": 15678,
  "mostConnectedReceipts": [...],
  "orphanedReceipts": [...],
  "averageGraphDepth": 4.2,
  "relationshipTypeDistribution": {
    "causes": 5234,
    "evidences": 3421,
    "fulfills": 2345
  },
  "graphCompletenessScore": 0.87
}

// 5. Graph pattern queries (SQL-like)
POST /api/v1/receipts/graph/query
{
  "pattern": "Transaction -> Content -> Operations",
  "filters": {
    "transactionAmount": { "gt": 10000 },
    "contentType": "ai_generated",
    "operationsType": "human_review",
    "missing": true  // Find patterns where operations is missing
  }
}

// Response: Receipts matching the pattern
{
  "matches": [
    {
      "transaction": {...},
      "content": {...},
      "operations": null,  // Missing!
      "riskScore": 0.85,
      "recommendation": "High-value transaction with AI content lacking human review"
    }
  ]
}
```

### Implementation Functions

```typescript
// Create receipt with graph relationships
async function createReceiptWithGraph(
  type: string,
  data: any,
  parentReceiptIds: string[],
  relationType: RelationType,
  description: string
): Promise<Receipt> {
  // 1. Fetch parent receipts
  const parentReceipts = await Promise.all(
    parentReceiptIds.map(id => getReceipt(id))
  );

  // 2. Verify all parents exist and are valid
  for (const parent of parentReceipts) {
    if (!verifySignature(parent)) {
      throw new Error(`Invalid parent receipt: ${parent.id}`);
    }
  }

  // 3. Calculate graph hash (includes parent hashes)
  const parentHashes = parentReceipts
    .map(r => r.sha256_hash)
    .sort()
    .join('');
  const graphHash = sha256(parentHashes);

  // 4. Calculate graph depth (max parent depth + 1)
  const graphDepth = Math.max(...parentReceipts.map(r => r.graph_depth || 0)) + 1;

  // 5. Create receipt
  const receipt: Receipt = {
    id: generateReceiptId(),
    type,
    data,
    sha256_hash: sha256(JSON.stringify(data)),
    timestamp: new Date().toISOString(),
    relationships: {
      parentReceipts: parentReceiptIds,
      childReceipts: [],
      relationType,
      metadata: {
        relationshipDescription: description,
        createdBy: getCurrentUser(),
        timestamp: new Date().toISOString()
      }
    },
    graphHash,
    graph_depth: graphDepth,
    trust_score: calculateTrustScore({ ...receipt, graph_depth: graphDepth }),
    trust_level: getTrustLevel(receipt.trust_score)
  };

  // 6. Save receipt
  await saveReceipt(receipt);

  // 7. Update parent receipts (add this as child)
  for (const parentId of parentReceiptIds) {
    await addChildToReceipt(parentId, receipt.id);
  }

  // 8. Save relationships
  for (const parentId of parentReceiptIds) {
    await saveRelationship({
      parent_receipt_id: parentId,
      child_receipt_id: receipt.id,
      relation_type: relationType,
      description
    });
  }

  return receipt;
}

// Query full graph from a receipt
async function getReceiptGraph(
  receiptId: string,
  maxDepth: number = 10
): Promise<ReceiptGraph> {
  const visited = new Set<string>();
  const graph: ReceiptGraph = {
    root: null,
    nodes: [],
    edges: []
  };

  async function traverse(id: string, depth: number) {
    if (visited.has(id) || depth > maxDepth) return;
    visited.add(id);

    const receipt = await getReceipt(id);
    graph.nodes.push(receipt);

    // Get parent relationships
    const parentRels = await getRelationships(id, 'parent');
    for (const rel of parentRels) {
      graph.edges.push({
        from: rel.parent_receipt_id,
        to: id,
        type: rel.relation_type
      });
      await traverse(rel.parent_receipt_id, depth + 1);
    }

    // Get child relationships
    const childRels = await getRelationships(id, 'child');
    for (const rel of childRels) {
      graph.edges.push({
        from: id,
        to: rel.child_receipt_id,
        type: rel.relation_type
      });
      await traverse(rel.child_receipt_id, depth + 1);
    }
  }

  await traverse(receiptId, 0);
  graph.root = graph.nodes.find(n => n.id === receiptId);

  return graph;
}

// Find all paths between two receipts
async function findPaths(
  fromId: string,
  toId: string
): Promise<Path[]> {
  const paths: Path[] = [];

  async function dfs(
    currentId: string,
    targetId: string,
    visited: Set<string>,
    path: string[],
    relationships: string[]
  ) {
    if (currentId === targetId) {
      paths.push({
        receipts: [...path, currentId],
        relationships: [...relationships],
        length: path.length + 1
      });
      return;
    }

    visited.add(currentId);

    // Traverse children
    const childRels = await getRelationships(currentId, 'child');
    for (const rel of childRels) {
      if (!visited.has(rel.child_receipt_id)) {
        await dfs(
          rel.child_receipt_id,
          targetId,
          visited,
          [...path, currentId],
          [...relationships, rel.relation_type]
        );
      }
    }

    visited.delete(currentId);
  }

  await dfs(fromId, toId, new Set(), [], []);
  return paths;
}
```

### Trust Score Calculation (Enhanced with Graph)

```typescript
function calculateTrustScore(receipt: Receipt): number {
  let score = 0.60; // Base: single receipt = 60%

  // Factor 1: Domain coverage (existing)
  const linkedDomains = new Set<string>();

  // Check what domains this receipt connects to
  if (receipt.type === 'transaction') linkedDomains.add('transaction');
  if (receipt.type === 'content') linkedDomains.add('content');
  if (receipt.type === 'operations') linkedDomains.add('operations');

  // Check parent receipts for domain diversity
  if (receipt.relationships?.parentReceipts?.length > 0) {
    for (const parentId of receipt.relationships.parentReceipts) {
      const parent = getReceipt(parentId); // cached
      linkedDomains.add(parent.type);
    }
  }

  if (linkedDomains.has('content')) score += 0.20;
  if (linkedDomains.has('operations')) score += 0.15;

  // Factor 2: Graph depth bonus
  const graphDepth = receipt.graph_depth || 0;
  if (graphDepth >= 3) score += 0.05; // Deep graphs = more context

  // Factor 3: Relationship quality
  if (receipt.relationships?.parentReceipts?.length > 0) {
    score += 0.05; // Has provenance
  }

  return Math.min(score, 1.0);
}
```

**Cost:** $0 (just database queries + code)

---

## 2. Graph Pattern Detection (Zero Cost)

### Fraud Pattern Detection

```typescript
interface GraphPattern {
  name: string;
  description: string;
  pattern: string;
  riskLevel: 'high' | 'medium' | 'low';
  action: string;
}

const FRAUD_PATTERNS: GraphPattern[] = [
  {
    name: 'Refund Abuse',
    description: 'Same parties repeatedly: Transaction → Refund → Transaction → Refund',
    pattern: 'Transaction -> Transaction -> Transaction',
    riskLevel: 'high',
    action: 'Flag for manual review'
  },
  {
    name: 'AI Content High-Value Transaction',
    description: 'High-value transaction with AI-generated content lacking human review',
    pattern: 'Transaction (>$10K) -> Content (AI) -> !Operations (human_review)',
    riskLevel: 'high',
    action: 'Require human review before processing'
  },
  {
    name: 'Missing Delivery Confirmation',
    description: 'Transaction completed but no delivery confirmation',
    pattern: 'Transaction -> Content (product) -> !Operations (delivery)',
    riskLevel: 'medium',
    action: 'Request delivery confirmation'
  },
  {
    name: 'Incident Without Resolution',
    description: 'Security incident detected but no resolution receipt',
    pattern: 'Operations (incident) -> !Operations (resolution)',
    riskLevel: 'high',
    action: 'Escalate to security team'
  }
];

async function detectPatterns(): Promise<PatternMatch[]> {
  const matches: PatternMatch[] = [];

  for (const pattern of FRAUD_PATTERNS) {
    const results = await queryGraphPattern(pattern.pattern);

    for (const result of results) {
      matches.push({
        pattern: pattern.name,
        description: pattern.description,
        receipts: result.receipts,
        riskLevel: pattern.riskLevel,
        recommendation: pattern.action,
        detectedAt: new Date().toISOString()
      });
    }
  }

  return matches;
}
```

**Cost:** $0 (just queries on existing data)

---

## 3. Graph Completeness Scoring (Zero Cost)

```typescript
function calculateGraphCompleteness(receipt: Receipt): number {
  let score = 0;
  const checks: string[] = [];

  // Check 1: Has parent receipts? (+25%)
  if (receipt.relationships?.parentReceipts?.length > 0) {
    score += 0.25;
    checks.push('✓ Has provenance');
  } else {
    checks.push('✗ Missing parent receipts');
  }

  // Check 2: Connects multiple domains? (+25%)
  const domains = new Set([receipt.type]);
  receipt.relationships?.parentReceipts?.forEach(id => {
    const parent = getReceipt(id);
    domains.add(parent.type);
  });

  if (domains.size >= 2) {
    score += 0.25;
    checks.push('✓ Multi-domain links');
  } else {
    checks.push('✗ Single domain only');
  }

  // Check 3: Has fulfillment receipt? (+25%)
  const children = receipt.relationships?.childReceipts || [];
  if (children.some(id => {
    const rel = getRelationship(receipt.id, id);
    return rel.relation_type === 'fulfills';
  })) {
    score += 0.25;
    checks.push('✓ Has fulfillment');
  } else {
    checks.push('✗ No fulfillment receipt');
  }

  // Check 4: No orphaned receipts in graph? (+25%)
  if (receipt.graph_depth > 0) {
    score += 0.25;
    checks.push('✓ Part of larger graph');
  } else {
    checks.push('✗ Orphaned receipt');
  }

  return {
    score,
    checks,
    recommendation: score < 0.75 ? 'Add missing receipts to improve completeness' : 'Graph is complete'
  };
}
```

**Cost:** $0 (just calculations)

---

## 4. Cross-Product Verification (Zero Cost)

```typescript
// Verify content receipt matches transaction receipt
POST /api/v1/verify/cross
{
  "contentReceiptId": "content_123",
  "transactionReceiptId": "tx_456"
}

async function verifyCrossProduct(
  contentReceiptId: string,
  transactionReceiptId: string
): Promise<VerificationResult> {
  const content = await getReceipt(contentReceiptId);
  const transaction = await getReceipt(transactionReceiptId);

  const checks = [];

  // Check 1: Receipts are connected in graph
  const paths = await findPaths(transactionReceiptId, contentReceiptId);
  const connected = paths.length > 0;
  checks.push({
    name: 'Graph Connection',
    passed: connected,
    message: connected
      ? `Connected via ${paths.length} path(s)`
      : 'Receipts are not connected in graph'
  });

  // Check 2: Content hash matches transaction metadata
  const transactionContentHash = transaction.data.contentHash;
  const contentHash = content.sha256_hash;
  const hashesMatch = transactionContentHash === contentHash;
  checks.push({
    name: 'Content Hash Match',
    passed: hashesMatch,
    message: hashesMatch
      ? 'Content hash in transaction matches content receipt'
      : 'Content hash mismatch - possible tampering'
  });

  // Check 3: Timestamps align
  const transactionTime = new Date(transaction.timestamp);
  const contentTime = new Date(content.timestamp);
  const timeDiff = Math.abs(transactionTime.getTime() - contentTime.getTime());
  const timeAligns = timeDiff < 24 * 60 * 60 * 1000; // Within 24 hours
  checks.push({
    name: 'Timestamp Alignment',
    passed: timeAligns,
    message: timeAligns
      ? 'Timestamps are coherent'
      : 'Timestamps are too far apart'
  });

  // Check 4: Same merchant/enterprise
  const sameEnterprise = transaction.data.merchantId === content.data.merchantId;
  checks.push({
    name: 'Enterprise Match',
    passed: sameEnterprise,
    message: sameEnterprise
      ? 'Both receipts belong to same enterprise'
      : 'Receipts belong to different enterprises'
  });

  const allPassed = checks.every(c => c.passed);

  return {
    valid: allPassed,
    checks,
    trustScore: allPassed ? 0.95 : 0.60,
    recommendation: allPassed
      ? 'Cross-product verification passed'
      : 'Manual review recommended'
  };
}
```

**Cost:** $0 (just hash comparison + queries)

---

## 5. Public Verification Widget (Zero Cost)

### Embeddable Widget

```typescript
// Generate embeddable widget code
GET /api/v1/widget/{receiptId}

// Returns JavaScript snippet:
<script src="https://certnode.io/widget.js"></script>
<div id="certnode-badge" data-receipt-id="tx_123"></div>

// Widget displays:
// ✅ Verified by CertNode
// Transaction Receipt
// Verified: Jan 15, 2025
// [Click to view full verification]
```

### Widget Implementation

```html
<!-- widget.js -->
<script>
(function() {
  const CertNodeWidget = {
    init: function() {
      const badges = document.querySelectorAll('[data-receipt-id]');
      badges.forEach(badge => {
        const receiptId = badge.dataset.receiptId;
        this.renderBadge(badge, receiptId);
      });
    },

    renderBadge: async function(element, receiptId) {
      // Fetch receipt data
      const receipt = await fetch(`https://certnode.io/api/v1/receipts/${receiptId}/public`)
        .then(r => r.json());

      // Render badge
      element.innerHTML = `
        <div class="certnode-badge">
          <div class="badge-header">
            <svg class="checkmark" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944"/>
            </svg>
            <span>Verified by CertNode</span>
          </div>
          <div class="badge-body">
            <div class="receipt-type">${receipt.type} Receipt</div>
            <div class="timestamp">Verified: ${new Date(receipt.timestamp).toLocaleDateString()}</div>
            <div class="trust-level">${receipt.trust_level} Trust</div>
          </div>
          <a href="https://certnode.io/verify/${receiptId}" class="verify-link" target="_blank">
            View Full Verification →
          </a>
        </div>
      `;
    }
  };

  // Auto-init on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CertNodeWidget.init());
  } else {
    CertNodeWidget.init();
  }
})();
</script>

<style>
.certnode-badge {
  border: 2px solid #2563eb;
  border-radius: 8px;
  padding: 16px;
  background: #f0f9ff;
  max-width: 300px;
}
.badge-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #2563eb;
  margin-bottom: 12px;
}
.checkmark {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: #10b981;
  stroke-width: 2;
}
</style>
```

**Cost:** $0 (client-side JS, served from your domain)

---

## 6. Webhook Notifications (Zero Cost)

```typescript
interface WebhookEvent {
  type: string;
  data: any;
  timestamp: string;
  signature: string;  // HMAC for security
}

const WEBHOOK_EVENTS = [
  'receipt.created',
  'receipt.verified',
  'fraud.detected',
  'content.flagged',
  'compliance.alert',
  'graph.pattern_detected'
];

async function sendWebhook(
  url: string,
  event: WebhookEvent,
  secret: string
): Promise<void> {
  const payload = JSON.stringify(event);
  const signature = hmac_sha256(payload, secret);

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CertNode-Signature': signature,
        'X-CertNode-Event': event.type
      },
      body: payload
    });
  } catch (error) {
    // Retry logic with exponential backoff
    await retryWithBackoff(url, event, secret);
  }
}

async function retryWithBackoff(
  url: string,
  event: WebhookEvent,
  secret: string,
  attempt: number = 1
): Promise<void> {
  if (attempt > 5) {
    console.error('Webhook delivery failed after 5 attempts');
    return;
  }

  const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s, 16s, 32s
  await sleep(delay);

  try {
    await sendWebhook(url, event, secret);
  } catch (error) {
    await retryWithBackoff(url, event, secret, attempt + 1);
  }
}
```

**Cost:** $0 (HTTP POST to customer URLs)

---

## 7. Receipt Templates (Zero Cost)

```typescript
// Pre-built templates for common use cases
const TEMPLATES = {
  ecommerce: {
    name: 'E-Commerce Transaction',
    endpoint: '/api/v1/receipts/template/ecommerce',
    schema: {
      orderId: 'string',
      amount: 'number',
      currency: 'string',
      items: 'array',
      customer: 'object'
    }
  },
  article: {
    name: 'News Article Content',
    endpoint: '/api/v1/receipts/template/article',
    schema: {
      title: 'string',
      author: 'string',
      content: 'string',
      publishDate: 'string',
      aiGenerated: 'boolean'
    }
  },
  incident: {
    name: 'Incident Response',
    endpoint: '/api/v1/receipts/template/incident',
    schema: {
      severity: 'string',
      affectedSystems: 'array',
      description: 'string',
      detectedAt: 'string'
    }
  }
};

// Usage:
POST /api/v1/receipts/template/ecommerce
{
  "orderId": "ORD-12345",
  "amount": 1249.99,
  "currency": "USD",
  "items": [...]
}

// Automatically creates properly formatted receipt
```

**Cost:** $0 (just JSON schemas)

---

## 8. Receipt QR Codes (Zero Cost)

```typescript
// Generate QR code for receipt verification
GET /api/v1/receipts/{receiptId}/qr

// Returns PNG image of QR code encoding:
// https://certnode.io/verify/{receiptId}

import QRCode from 'qrcode';

async function generateReceiptQR(receiptId: string): Promise<Buffer> {
  const verificationUrl = `https://certnode.io/verify/${receiptId}`;

  const qrCode = await QRCode.toBuffer(verificationUrl, {
    width: 300,
    margin: 2,
    color: {
      dark: '#2563eb',
      light: '#ffffff'
    }
  });

  return qrCode;
}
```

**Cost:** $0 (QR encoding library, serves images)

---

## 9. Advanced Search & Filtering (Zero Cost)

```typescript
// Search receipts
GET /api/v1/receipts/search?query={params}

interface SearchParams {
  // Time range
  startDate?: string;
  endDate?: string;

  // Receipt properties
  type?: 'transaction' | 'content' | 'operations';
  trustLevel?: 'BASIC' | 'VERIFIED' | 'PLATINUM';

  // Transaction filters
  amountMin?: number;
  amountMax?: number;
  currency?: string;

  // Content filters
  aiGenerated?: boolean;
  contentType?: string;

  // Operations filters
  severity?: string;
  incidentType?: string;

  // Graph filters
  graphDepthMin?: number;
  graphDepthMax?: number;
  orphaned?: boolean;  // Receipts with no parent/children

  // Fraud flags
  fraudFlags?: boolean;

  // Compliance
  complianceFramework?: 'PCI' | 'SOX' | 'GDPR';
  compliant?: boolean;

  // Sorting
  sortBy?: 'timestamp' | 'amount' | 'trust_score' | 'graph_depth';
  sortOrder?: 'asc' | 'desc';

  // Pagination
  page?: number;
  limit?: number;
}

async function searchReceipts(params: SearchParams): Promise<SearchResults> {
  let query = 'SELECT * FROM receipts WHERE 1=1';
  const values: any[] = [];

  // Build dynamic SQL query based on filters
  if (params.startDate) {
    query += ' AND timestamp >= $1';
    values.push(params.startDate);
  }

  if (params.type) {
    query += ` AND type = $${values.length + 1}`;
    values.push(params.type);
  }

  if (params.amountMin) {
    query += ` AND (data->>'amount')::numeric >= $${values.length + 1}`;
    values.push(params.amountMin);
  }

  if (params.orphaned) {
    query += ` AND graph_depth = 0`;
  }

  // Add sorting
  query += ` ORDER BY ${params.sortBy || 'timestamp'} ${params.sortOrder || 'DESC'}`;

  // Add pagination
  query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(params.limit || 50);
  values.push((params.page || 0) * (params.limit || 50));

  const receipts = await db.query(query, values);

  return {
    receipts,
    total: receipts.length,
    page: params.page || 0,
    pages: Math.ceil(receipts.length / (params.limit || 50))
  };
}
```

**Cost:** $0 (just database queries)

---

## 10. Batch Operations (Zero Cost)

```typescript
// Batch create receipts
POST /api/v1/receipts/batch
{
  "receipts": [
    { "type": "transaction", "data": {...} },
    { "type": "content", "data": {...} },
    { "type": "operations", "data": {...} }
  ]
}

// Response: Array of created receipts

// Batch verify receipts
POST /api/v1/verify/batch
{
  "receiptIds": ["receipt_1", "receipt_2", "receipt_3"]
}

// Response: Array of verification results

async function batchCreateReceipts(receipts: ReceiptInput[]): Promise<Receipt[]> {
  const created: Receipt[] = [];

  // Process in transaction for atomicity
  await db.transaction(async (tx) => {
    for (const input of receipts) {
      const receipt = await createReceipt(input, tx);
      created.push(receipt);
    }
  });

  return created;
}
```

**Cost:** $0 (just API endpoint logic)

---

## 11. Compliance Report Generation (Zero Cost)

```typescript
// Auto-generate compliance report
GET /api/v1/compliance/report/{framework}?startDate={}&endDate={}

async function generateComplianceReport(
  framework: 'PCI' | 'SOX' | 'GDPR',
  startDate: string,
  endDate: string
): Promise<ComplianceReport> {
  const receipts = await getReceiptsInDateRange(startDate, endDate);

  const report = {
    framework,
    period: { startDate, endDate },
    generated: new Date().toISOString(),
    summary: {},
    requirements: [],
    recommendations: []
  };

  if (framework === 'PCI') {
    report.requirements = [
      {
        id: 'Requirement 10',
        description: 'Track and monitor all access to network resources',
        required_receipts: ['operations', 'transaction'],
        receipts_found: receipts.filter(r =>
          r.type === 'operations' || r.type === 'transaction'
        ).length,
        compliant: receipts.some(r => r.type === 'operations'),
        evidence: receipts.filter(r => r.type === 'operations').map(r => r.id)
      }
    ];
  }

  // Calculate overall compliance
  const compliantRequirements = report.requirements.filter(r => r.compliant).length;
  const totalRequirements = report.requirements.length;
  report.summary.compliancePercentage = (compliantRequirements / totalRequirements) * 100;

  return report;
}

// Export as PDF
GET /api/v1/compliance/report/{framework}/pdf

// Use puppeteer or similar to convert HTML → PDF
async function generatePDFReport(report: ComplianceReport): Promise<Buffer> {
  const html = renderReportHTML(report);
  const pdf = await htmlToPDF(html);
  return pdf;
}
```

**Cost:** $0 (templating + PDF generation library)

---

## 12. Time-Series Validation (Zero Cost)

```typescript
// Detect replay attacks and suspicious timing
async function validateTimeSeries(receipt: Receipt): Promise<ValidationResult> {
  const checks = [];

  // Check 1: Timestamp is not in the future
  const now = new Date();
  const receiptTime = new Date(receipt.timestamp);
  const notInFuture = receiptTime <= now;
  checks.push({
    name: 'Future Timestamp',
    passed: notInFuture,
    message: notInFuture
      ? 'Timestamp is valid'
      : 'Timestamp is in the future - possible tampering'
  });

  // Check 2: Timestamps are sequential (parent before child)
  if (receipt.relationships?.parentReceipts?.length > 0) {
    for (const parentId of receipt.relationships.parentReceipts) {
      const parent = await getReceipt(parentId);
      const parentTime = new Date(parent.timestamp);
      const sequential = parentTime <= receiptTime;
      checks.push({
        name: `Sequential: ${parentId}`,
        passed: sequential,
        message: sequential
          ? 'Parent receipt timestamp is before child'
          : 'Parent receipt timestamp is after child - causality violation'
      });
    }
  }

  // Check 3: Detect duplicate submissions (nonce-based)
  const nonce = receipt.data.nonce;
  const duplicate = await checkNonce(nonce);
  checks.push({
    name: 'Replay Detection',
    passed: !duplicate,
    message: duplicate
      ? 'Nonce already used - possible replay attack'
      : 'Nonce is unique'
  });

  // Check 4: Velocity check (too many receipts too quickly)
  const recentReceipts = await getRecentReceiptsByMerchant(
    receipt.data.merchantId,
    60000 // last 60 seconds
  );
  const velocity = recentReceipts.length;
  const velocityOk = velocity < 100; // Max 100 receipts per minute
  checks.push({
    name: 'Velocity Check',
    passed: velocityOk,
    message: velocityOk
      ? 'Receipt velocity is normal'
      : 'Abnormally high receipt velocity - possible attack'
  });

  return {
    valid: checks.every(c => c.passed),
    checks
  };
}
```

**Cost:** $0 (timestamp validation + nonce tracking)

---

## 13. Multi-Signature Receipts (Zero Cost)

```typescript
// Require multiple approvers for high-value receipts
POST /api/v1/receipts/multisig
{
  "type": "transaction",
  "data": { "amount": 50000 },
  "requiredSigners": 2,
  "signers": ["cfo@company.com", "ceo@company.com"]
}

interface MultiSigReceipt {
  id: string;
  type: string;
  data: any;
  requiredSigners: number;
  signers: string[];
  signatures: Signature[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface Signature {
  signer: string;
  signature: string;  // ES256 signature
  signedAt: string;
  approved: boolean;
}

async function createMultiSigReceipt(
  type: string,
  data: any,
  requiredSigners: number,
  signers: string[]
): Promise<MultiSigReceipt> {
  const receipt: MultiSigReceipt = {
    id: generateReceiptId(),
    type,
    data,
    requiredSigners,
    signers,
    signatures: [],
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  await saveMultiSigReceipt(receipt);

  // Send notifications to all signers
  for (const signer of signers) {
    await sendSignerNotification(signer, receipt.id);
  }

  return receipt;
}

// Signer approves receipt
POST /api/v1/receipts/multisig/{receiptId}/sign
{
  "approved": true,
  "signature": "..." // ES256 signature of receipt data
}

async function signMultiSigReceipt(
  receiptId: string,
  signer: string,
  approved: boolean,
  signature: string
): Promise<MultiSigReceipt> {
  const receipt = await getMultiSigReceipt(receiptId);

  // Verify signer is authorized
  if (!receipt.signers.includes(signer)) {
    throw new Error('Unauthorized signer');
  }

  // Verify signature
  const valid = verifyES256Signature(receipt.data, signature, signer);
  if (!valid) {
    throw new Error('Invalid signature');
  }

  // Add signature
  receipt.signatures.push({
    signer,
    signature,
    signedAt: new Date().toISOString(),
    approved
  });

  // Check if enough signatures
  const approvals = receipt.signatures.filter(s => s.approved).length;
  if (approvals >= receipt.requiredSigners) {
    receipt.status = 'approved';

    // Create final receipt
    const finalReceipt = await createReceipt({
      type: receipt.type,
      data: {
        ...receipt.data,
        multiSigId: receipt.id,
        signatures: receipt.signatures
      }
    });
  } else if (receipt.signatures.length >= receipt.signers.length && approvals < receipt.requiredSigners) {
    receipt.status = 'rejected';
  }

  await saveMultiSigReceipt(receipt);
  return receipt;
}
```

**Cost:** $0 (crypto operations + database)

---

## 14. Analytics Dashboard (Zero Cost)

```typescript
// Dashboard data aggregation
GET /api/v1/analytics/dashboard

async function getDashboardAnalytics(): Promise<DashboardData> {
  const receipts = await getAllReceipts();

  return {
    // Volume metrics
    totalReceipts: receipts.length,
    receiptsByType: {
      transaction: receipts.filter(r => r.type === 'transaction').length,
      content: receipts.filter(r => r.type === 'content').length,
      operations: receipts.filter(r => r.type === 'operations').length
    },
    receiptVolumeOverTime: calculateVolumeOverTime(receipts),

    // Trust metrics
    averageTrustScore: average(receipts.map(r => r.trust_score)),
    trustLevelDistribution: {
      BASIC: receipts.filter(r => r.trust_level === 'BASIC').length,
      VERIFIED: receipts.filter(r => r.trust_level === 'VERIFIED').length,
      PLATINUM: receipts.filter(r => r.trust_level === 'PLATINUM').length
    },

    // Graph metrics
    averageGraphDepth: average(receipts.map(r => r.graph_depth)),
    totalRelationships: await countRelationships(),
    orphanedReceipts: receipts.filter(r => r.graph_depth === 0).length,

    // Fraud metrics
    fraudDetectionRate: calculateFraudRate(receipts),
    fraudPatternMatches: await detectPatterns(),

    // Compliance metrics
    complianceAdherence: {
      PCI: await checkCompliance('PCI'),
      SOX: await checkCompliance('SOX'),
      GDPR: await checkCompliance('GDPR')
    },

    // Usage metrics
    receiptsUsedThisMonth: countReceiptsThisMonth(receipts),
    receiptsRemainingInPlan: calculateRemainingReceipts(),
    projectedOverage: projectOverage(receipts)
  };
}
```

**Cost:** $0 (data aggregation on existing receipts)

---

## 15. Public Verifiability (Zero Cost with Free Services)

### Publish Merkle Roots to Free Services

```typescript
// Every 10 minutes, publish global merkle root
async function publishMerkleRootPublicly() {
  setInterval(async () => {
    const receipts = await getRecentReceipts(10); // last 10 minutes
    const globalRoot = buildUnifiedMerkleTree(receipts);

    await Promise.all([
      // 1. GitHub (free, version controlled)
      publishToGitHub(globalRoot),

      // 2. IPFS public gateway (free, decentralized)
      publishToIPFS(globalRoot),

      // 3. Certificate Transparency (free, trusted by browsers)
      publishToCertificateTransparency(globalRoot),

      // 4. Public API endpoint (your server)
      publishToPublicAPI(globalRoot)
    ]);

    console.log(`Published merkle root ${globalRoot} publicly`);
  }, 10 * 60 * 1000); // Every 10 minutes
}

// Verify receipt without trusting CertNode
async function verifyReceiptPublicly(receipt: Receipt): Promise<boolean> {
  // 1. Fetch published merkle roots from public sources
  const githubRoots = await fetch('https://raw.githubusercontent.com/certnode/merkle-roots/main/roots.json')
    .then(r => r.json());

  const ipfsRoots = await fetch('https://ipfs.io/ipfs/QmXXX...')
    .then(r => r.json());

  // 2. Find root for this receipt's timestamp
  const expectedRoot = githubRoots.find(r =>
    new Date(r.timestamp) >= new Date(receipt.timestamp)
  );

  // 3. Verify merkle proof locally (no API call to CertNode needed!)
  const isValid = verifyMerkleProofLocally(
    receipt.sha256_hash,
    receipt.merkle_proof,
    expectedRoot.merkle_root
  );

  return isValid;
}

async function publishToGitHub(merkleRoot: string): Promise<void> {
  // Commit merkle root to public GitHub repo
  const commit = {
    timestamp: new Date().toISOString(),
    merkle_root: merkleRoot,
    receipt_count: await getReceiptCount()
  };

  // Use GitHub API to commit to certnode/merkle-roots repo
  await githubAPI.commit('roots.json', JSON.stringify(commit));
}

async function publishToIPFS(merkleRoot: string): Promise<string> {
  // Publish to IPFS via public gateway
  const data = {
    timestamp: new Date().toISOString(),
    merkle_root: merkleRoot
  };

  const cid = await ipfs.add(JSON.stringify(data));
  return cid; // Returns IPFS hash like QmXXX...
}
```

**Cost:** $0 (GitHub free, IPFS public gateways free, CT logs free)

---

## Implementation Timeline

### Week 1-2: Receipt Graph DAG
- ✅ Database schema updates
- ✅ Graph API endpoints
- ✅ Basic graph visualization
- ✅ Trust score calculation with graph

**Outcome:** Killer feature is live

### Week 3-4: Zero-Cost Features Batch 1
- ✅ Cross-product verification
- ✅ Public verification widget
- ✅ Webhook notifications
- ✅ Receipt templates

**Outcome:** Moats strengthened, easier integration

### Week 5-6: Zero-Cost Features Batch 2
- ✅ Graph pattern detection
- ✅ Compliance report generation
- ✅ Batch operations
- ✅ Time-series validation

**Outcome:** Enterprise-ready

### Week 7-8: Polish & Marketing
- ✅ Receipt QR codes
- ✅ Advanced search/filtering
- ✅ Analytics dashboard
- ✅ Multi-signature receipts
- ✅ Public verifiability

**Outcome:** Production-ready platform

---

## Total Monthly Cost: $0

All features use:
- ✅ Existing database (PostgreSQL)
- ✅ Existing compute (your servers)
- ✅ Free services (GitHub, IPFS, CT logs)
- ✅ Open-source libraries
- ✅ Client-side JavaScript

**No additional infrastructure required.**

# Receipt Graph API Documentation

## Overview

The Receipt Graph API allows you to create receipts with relationships to other receipts, forming a directed acyclic graph (DAG) that represents complex business workflows across transactions, content, and operations.

## Key Concepts

### Receipt Relationships

Receipts can be linked together using relationship types:

- **CAUSES**: Parent event caused this receipt (e.g., incident caused refund)
- **EVIDENCES**: This receipt provides evidence for parent (e.g., photo evidences delivery)
- **FULFILLS**: This receipt fulfills parent requirement (e.g., payment fulfills order)
- **INVALIDATES**: This receipt invalidates parent (e.g., refund invalidates original transaction)
- **AMENDS**: This receipt amends parent (e.g., updated terms amend original policy)

### Graph Depth Limits by Tier

| Tier | Max Depth |
|------|-----------|
| FREE | 3 levels |
| STARTER | 5 levels |
| PRO | 10 levels |
| ENTERPRISE | Unlimited |

---

## API Endpoints

### 1. Create Receipt with Graph Relationships

**Endpoint:** `POST /api/v1/receipts/graph`

**Headers:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "content",
  "data": {
    "description": "Product delivery photo",
    "contentHash": "sha256:abc123..."
  },
  "parentReceipts": [
    {
      "receiptId": "receipt_transaction_xyz",
      "relationType": "EVIDENCES",
      "description": "Photo evidences transaction delivery",
      "metadata": {
        "deliveryConfirmed": true
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "receipt": {
    "id": "receipt_content_abc",
    "type": "CONTENT",
    "enterpriseId": "ent_123",
    "graphDepth": 1,
    "graphHash": "sha256:def456...",
    "createdAt": "2025-09-30T10:00:00Z",
    "parentCount": 1
  },
  "graph": {
    "depth": 1,
    "hasParents": true
  },
  "platform": {
    "platform": "Receipt Graph Infrastructure",
    "feature": "Graph-connected receipts",
    "validation": "Cryptographic integrity with relationships"
  }
}
```

---

### 2. Traverse Receipt Graph

**Endpoint:** `GET /api/v1/receipts/graph/{receiptId}?direction=both`

**Query Parameters:**
- `direction` (optional): `ancestors`, `descendants`, or `both` (default: `both`)

**Response:**
```json
{
  "success": true,
  "receipt": {
    "id": "receipt_content_abc",
    "type": "CONTENT",
    "graphDepth": 1
  },
  "graph": {
    "nodes": [
      {
        "id": "receipt_transaction_xyz",
        "type": "TRANSACTION",
        "depth": 0,
        "graphDepth": 0,
        "createdAt": "2025-09-30T09:00:00Z",
        "path": ["receipt_transaction_xyz"]
      },
      {
        "id": "receipt_content_abc",
        "type": "CONTENT",
        "depth": 1,
        "graphDepth": 1,
        "createdAt": "2025-09-30T10:00:00Z",
        "path": ["receipt_transaction_xyz", "receipt_content_abc"]
      }
    ],
    "edges": [
      {
        "from": "receipt_transaction_xyz",
        "to": "receipt_content_abc",
        "relationType": "EVIDENCES",
        "description": "Photo evidences transaction delivery"
      }
    ],
    "totalNodes": 2,
    "totalEdges": 1,
    "totalDepth": 1,
    "depthLimitReached": false
  },
  "limits": {
    "tier": "PRO",
    "maxDepth": 10,
    "depthLimitReached": false
  }
}
```

---

### 3. Find Paths Between Receipts

**Endpoint:** `GET /api/v1/receipts/graph/path?from={id}&to={id}&maxPaths=10`

**Query Parameters:**
- `from` (required): Starting receipt ID
- `to` (required): Ending receipt ID
- `maxPaths` (optional): Maximum number of paths to return (default: 10)

**Response:**
```json
{
  "success": true,
  "from": {
    "id": "receipt_transaction_xyz",
    "type": "TRANSACTION"
  },
  "to": {
    "id": "receipt_ops_incident",
    "type": "OPS"
  },
  "paths": [
    {
      "receiptIds": [
        "receipt_transaction_xyz",
        "receipt_content_abc",
        "receipt_ops_incident"
      ],
      "steps": 2,
      "relationships": [
        {
          "from": "receipt_transaction_xyz",
          "to": "receipt_content_abc",
          "type": "EVIDENCES",
          "description": "Photo evidences delivery"
        },
        {
          "from": "receipt_content_abc",
          "to": "receipt_ops_incident",
          "type": "CAUSES",
          "description": "Defective product caused incident"
        }
      ]
    }
  ],
  "totalPaths": 1,
  "maxPathsReached": false
}
```

---

### 4. Get Graph Analytics

**Endpoint:** `GET /api/v1/receipts/graph/analytics?validateIntegrity=true`

**Query Parameters:**
- `validateIntegrity` (optional): Run integrity validation (default: false)

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalReceipts": 150,
    "totalRelationships": 95,
    "receiptsByType": [
      { "type": "TRANSACTION", "count": 60 },
      { "type": "CONTENT", "count": 50 },
      { "type": "OPS", "count": 40 }
    ],
    "relationshipsByType": [
      { "type": "CAUSES", "count": 25 },
      { "type": "EVIDENCES", "count": 40 },
      { "type": "FULFILLS", "count": 20 },
      { "type": "INVALIDATES", "count": 5 },
      { "type": "AMENDS", "count": 5 }
    ],
    "maxDepth": 8,
    "orphanedReceipts": {
      "count": 15,
      "receipts": [...]
    },
    "graphMetrics": {
      "avgRelationshipsPerReceipt": "0.63",
      "graphConnectivity": "90.0%"
    }
  },
  "integrity": {
    "valid": true,
    "issues": []
  },
  "timestamp": "2025-09-30T12:00:00Z"
}
```

---

## Use Case Examples

### Example 1: E-Commerce Dispute Protection

```
1. Create transaction receipt (payment)
2. Create content receipt (product delivered) with parent = transaction
3. Create ops receipt (delivery confirmed) with parent = content
4. Customer disputes charge
5. Query graph from transaction → show complete evidence chain
```

**API Calls:**
```bash
# 1. Transaction
curl -X POST https://certnode.io/api/v1/receipts/graph \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "type": "transaction",
    "data": {
      "amount": 50000,
      "orderId": "order_123",
      "customerId": "cust_456"
    }
  }'

# 2. Content (evidence of delivery)
curl -X POST https://certnode.io/api/v1/receipts/graph \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "type": "content",
    "data": {
      "contentHash": "sha256:photo_hash",
      "description": "Delivery photo"
    },
    "parentReceipts": [{
      "receiptId": "receipt_transaction_xyz",
      "relationType": "EVIDENCES"
    }]
  }'

# 3. Operations (delivery confirmation)
curl -X POST https://certnode.io/api/v1/receipts/graph \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "type": "ops",
    "data": {
      "operationType": "delivery_confirmation",
      "signature": "customer_signature"
    },
    "parentReceipts": [{
      "receiptId": "receipt_content_abc",
      "relationType": "FULFILLS"
    }]
  }'

# 4. Get complete graph for dispute
curl "https://certnode.io/api/v1/receipts/graph/receipt_transaction_xyz?direction=descendants" \
  -H "Authorization: Bearer $API_KEY"
```

---

### Example 2: Content Licensing

```
1. Create content receipt (original photo)
2. Create transaction receipt (license sold) with parent = content
3. Create content receipt (photo used in article) with parent = content
4. Prove: "This content is properly licensed"
```

**API Calls:**
```bash
# 1. Original content
curl -X POST https://certnode.io/api/v1/receipts/graph \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "type": "content",
    "data": {
      "contentHash": "sha256:original_photo",
      "creator": "photographer_123"
    }
  }'

# 2. License transaction
curl -X POST https://certnode.io/api/v1/receipts/graph \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "type": "transaction",
    "data": {
      "amount": 50000,
      "licenseType": "commercial"
    },
    "parentReceipts": [{
      "receiptId": "receipt_content_original",
      "relationType": "FULFILLS",
      "description": "License for commercial use"
    }]
  }'

# 3. Derivative work
curl -X POST https://certnode.io/api/v1/receipts/graph \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "type": "content",
    "data": {
      "contentHash": "sha256:article_with_photo",
      "usageType": "article"
    },
    "parentReceipts": [{
      "receiptId": "receipt_content_original",
      "relationType": "EVIDENCES",
      "description": "Derivative work from licensed content"
    }]
  }'

# 4. Verify complete provenance chain
curl "https://certnode.io/api/v1/receipts/graph/receipt_content_original?direction=descendants" \
  -H "Authorization: Bearer $API_KEY"
```

---

### Example 3: Security Incident Response

```
1. Create ops receipt (incident detected)
2. Create ops receipt (investigation) with parent = incident
3. Create content receipt (evidence collected) with parent = investigation
4. Create transaction receipt (credits issued) with parent = incident
5. Create ops receipt (incident resolved) with parent = investigation
6. Prove: "We followed security SLA at every step"
```

---

## Best Practices

### 1. Choose Appropriate Relationship Types

- Use **CAUSES** for causal relationships (incident → refund)
- Use **EVIDENCES** when providing proof (photo → transaction)
- Use **FULFILLS** for completion (payment → order)
- Use **INVALIDATES** sparingly (refund → original payment)
- Use **AMENDS** for corrections (updated policy → old policy)

### 2. Include Descriptive Metadata

```json
{
  "parentReceipts": [{
    "receiptId": "receipt_123",
    "relationType": "EVIDENCES",
    "description": "High-resolution delivery photo with timestamp",
    "metadata": {
      "photoQuality": "high",
      "gpsCoordinates": "lat,lng",
      "timestamp": "2025-09-30T10:00:00Z"
    }
  }]
}
```

### 3. Plan Your Graph Structure

- Start with root receipts (no parents)
- Build depth gradually
- Use consistent relationship patterns
- Document your graph conventions

### 4. Monitor Graph Health

- Check analytics regularly
- Monitor orphaned receipts
- Validate graph integrity
- Track depth trends

### 5. Handle Depth Limits Gracefully

```javascript
const response = await fetch('/api/v1/receipts/graph/receipt_123')
const data = await response.json()

if (data.graph.depthLimitReached) {
  console.warn('Graph depth limit reached. Consider upgrading tier.')
  // Show upgrade prompt to user
}
```

---

## Error Handling

### Common Errors

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Invalid receipt type",
  "code": "INVALID_RECEIPT_TYPE"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "error": "One or more parent receipts not found",
  "code": "PARENT_RECEIPT_NOT_FOUND"
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

---

## Migration from Simple Receipts

If you have existing receipts without graph relationships, you can gradually migrate:

1. Continue creating simple receipts
2. Start adding `parentReceipts` to new receipts
3. Build graph connections over time
4. Existing receipts remain valid (orphaned but functional)

---

## Limitations

- Maximum 100 parent receipts per receipt
- Cycles not allowed (will be rejected)
- Depth limits enforced by tier
- Cross-enterprise relationships not allowed

---

## Support

For questions or issues:
- Documentation: https://certnode.io/docs
- API Reference: https://certnode.io/openapi.html
- Email: support@certnode.io
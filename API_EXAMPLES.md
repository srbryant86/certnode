# CertNode API Examples - Cross-Product Verification

**Base URL:** `https://api.certnode.io` or `http://localhost:3000` (dev)

---

## 1. Cross-Product Verification

**Verify that receipts across domains (transaction, content, operations) are cryptographically linked.**

### Endpoint
```
POST /api/v1/receipts/verify/cross-product
```

### Use Cases
- **Chargeback defense:** Prove payment → product → delivery
- **Compliance audits:** Show complete transaction lifecycle
- **Fraud investigation:** Verify all steps in a transaction
- **Refund validation:** Prove legitimacy of refund request

### Request Example
```bash
curl -X POST https://api.certnode.io/api/v1/receipts/verify/cross-product \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "receiptIds": [
      "receipt_tx_abc123",
      "receipt_content_xyz789",
      "receipt_ops_def456"
    ],
    "expectedChain": "transaction-content-ops"
  }'
```

### Response Example (Valid Chain)
```json
{
  "success": true,
  "data": {
    "valid": true,
    "completeness": 100,
    "chain": [
      {
        "id": "receipt_tx_abc123",
        "type": "TRANSACTION",
        "position": 0,
        "linkedVia": null,
        "linkedToNext": true,
        "data": {
          "transactionId": "tx_89a7f2",
          "amount": 89.50,
          "createdAt": "2024-10-01T14:30:00Z"
        }
      },
      {
        "id": "receipt_content_xyz789",
        "type": "CONTENT",
        "position": 1,
        "linkedVia": "EVIDENCES",
        "linkedToNext": true,
        "data": {
          "transactionId": "content_4f8a9",
          "contentHash": "sha256:abc...",
          "createdAt": "2024-10-01T14:31:00Z"
        }
      },
      {
        "id": "receipt_ops_def456",
        "type": "OPS",
        "position": 2,
        "linkedVia": "FULFILLS",
        "linkedToNext": false,
        "data": {
          "transactionId": "ops_7d3e1",
          "operationType": "delivery_confirmed",
          "createdAt": "2024-10-01T14:35:00Z"
        }
      }
    ],
    "missingLinks": [],
    "cryptographicProof": {
      "chainHash": "0xabc123def456...",
      "receiptsVerified": 3,
      "allSignaturesValid": true,
      "graphDepth": 2
    },
    "recommendation": "Chain is complete and valid. This provides strong evidence for dispute resolution."
  },
  "metadata": {
    "platform": "Cross-Product Verification",
    "feature": "Multi-domain receipt chain validation",
    "validation": "Chain verified"
  }
}
```

### Response Example (Incomplete Chain)
```json
{
  "success": true,
  "data": {
    "valid": false,
    "completeness": 67,
    "chain": [
      {
        "id": "receipt_tx_abc123",
        "type": "TRANSACTION",
        "position": 0,
        "linkedVia": null,
        "linkedToNext": true,
        "data": {
          "transactionId": "tx_89a7f2",
          "amount": 89.50,
          "createdAt": "2024-10-01T14:30:00Z"
        }
      },
      {
        "id": "receipt_content_xyz789",
        "type": "CONTENT",
        "position": 1,
        "linkedVia": "EVIDENCES",
        "linkedToNext": false,
        "data": {
          "transactionId": "content_4f8a9",
          "contentHash": "sha256:abc...",
          "createdAt": "2024-10-01T14:31:00Z"
        }
      }
    ],
    "missingLinks": ["operations"],
    "cryptographicProof": {
      "chainHash": "0xdef789ghi012...",
      "receiptsVerified": 2,
      "allSignaturesValid": true,
      "graphDepth": 1
    },
    "recommendation": "Add operations receipt(s) to complete the chain."
  },
  "metadata": {
    "platform": "Cross-Product Verification",
    "feature": "Multi-domain receipt chain validation",
    "validation": "Chain incomplete"
  }
}
```

### Error Responses
```json
// Missing receipts
{
  "success": false,
  "error": {
    "message": "Receipts not found: receipt_invalid_123",
    "code": "RECEIPTS_NOT_FOUND"
  }
}

// Invalid input
{
  "success": false,
  "error": {
    "message": "receiptIds array is required and must contain at least one receipt",
    "code": "INVALID_INPUT"
  }
}

// Too many receipts
{
  "success": false,
  "error": {
    "message": "Maximum 50 receipts can be verified at once",
    "code": "TOO_MANY_RECEIPTS"
  }
}
```

---

## 2. Graph Completeness Scoring

**Calculate how complete a receipt's graph chain is and get upgrade recommendations.**

### Endpoint
```
GET /api/v1/receipts/graph/{receiptId}/completeness
```

### Use Cases
- **Data quality:** Show customers what's missing
- **Upsell trigger:** Display tier limits and upgrade paths
- **Audit readiness:** Identify incomplete chains

### Request Example
```bash
curl -X GET https://api.certnode.io/api/v1/receipts/graph/receipt_tx_abc123/completeness \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Response Example (100% Complete)
```json
{
  "success": true,
  "data": {
    "completeness": 100,
    "score": "EXCELLENT",
    "chain": [
      {
        "type": "transaction",
        "present": true,
        "receiptId": "receipt_tx_abc123"
      },
      {
        "type": "content",
        "present": true,
        "receiptId": "receipt_content_xyz789"
      },
      {
        "type": "operations",
        "present": true,
        "receiptId": "receipt_ops_def456"
      }
    ],
    "missingLinks": [],
    "recommendations": [
      "Chain is complete - provides strong evidence for dispute resolution"
    ],
    "graphStats": {
      "totalReceipts": 3,
      "maxDepth": 2,
      "depthLimit": "10",
      "depthLimitReached": false
    }
  },
  "metadata": {
    "platform": "Receipt Graph Completeness",
    "feature": "Chain quality scoring",
    "validation": "100% complete"
  }
}
```

### Response Example (Incomplete with Upsell)
```json
{
  "success": true,
  "data": {
    "completeness": 67,
    "score": "GOOD",
    "chain": [
      {
        "type": "transaction",
        "present": true,
        "receiptId": "receipt_tx_abc123"
      },
      {
        "type": "content",
        "present": true,
        "receiptId": "receipt_content_xyz789"
      },
      {
        "type": "operations",
        "present": false,
        "receiptId": null
      }
    ],
    "missingLinks": ["operations receipt"],
    "recommendations": [
      "Add operations receipt to complete the chain",
      "Graph depth limit reached (5 levels). Upgrade to PRO for deeper chains."
    ],
    "graphStats": {
      "totalReceipts": 8,
      "maxDepth": 5,
      "depthLimit": "5",
      "depthLimitReached": true
    },
    "upsell": {
      "currentTier": "STARTER",
      "recommendation": "Upgrade to PRO (10 levels)",
      "upgradeUrl": "/pricing"
    }
  },
  "metadata": {
    "platform": "Receipt Graph Completeness",
    "feature": "Chain quality scoring",
    "validation": "67% complete"
  }
}
```

---

## 3. Creating Linked Receipts (Graph)

**Create receipts with parent relationships to build chains.**

### Endpoint
```
POST /api/v1/receipts/graph
```

### Example: E-commerce Chargeback Defense Chain

#### Step 1: Create Transaction Receipt
```bash
curl -X POST https://api.certnode.io/api/v1/receipts/graph \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "transaction",
    "data": {
      "amount": 89.50,
      "currency": "USD",
      "customerId": "cust_abc123",
      "orderId": "order_xyz789"
    }
  }'

# Response:
{
  "success": true,
  "data": {
    "receipt": {
      "id": "receipt_tx_abc123",
      "type": "TRANSACTION",
      "graphDepth": 0
    }
  }
}
```

#### Step 2: Create Content Receipt (linked to payment)
```bash
curl -X POST https://api.certnode.io/api/v1/receipts/graph \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "content",
    "data": {
      "contentHash": "sha256:abc...",
      "aiScore": 0.87,
      "contentType": "product_images"
    },
    "parentReceipts": [
      {
        "receiptId": "receipt_tx_abc123",
        "relationType": "EVIDENCES",
        "description": "Product images delivered for payment"
      }
    ]
  }'

# Response:
{
  "success": true,
  "data": {
    "receipt": {
      "id": "receipt_content_xyz789",
      "type": "CONTENT",
      "graphDepth": 1,
      "parentCount": 1
    }
  }
}
```

#### Step 3: Create Operations Receipt (delivery confirmation)
```bash
curl -X POST https://api.certnode.io/api/v1/receipts/graph \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ops",
    "data": {
      "operationType": "delivery_confirmed",
      "trackingNumber": "1Z999AA10123456784",
      "deliveredAt": "2024-10-01T14:35:00Z"
    },
    "parentReceipts": [
      {
        "receiptId": "receipt_content_xyz789",
        "relationType": "FULFILLS",
        "description": "Delivery confirms product receipt"
      }
    ]
  }'

# Response:
{
  "success": true,
  "data": {
    "receipt": {
      "id": "receipt_ops_def456",
      "type": "OPS",
      "graphDepth": 2,
      "parentCount": 1
    }
  }
}
```

#### Step 4: Verify Complete Chain
```bash
curl -X POST https://api.certnode.io/api/v1/receipts/verify/cross-product \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "receiptIds": [
      "receipt_tx_abc123",
      "receipt_content_xyz789",
      "receipt_ops_def456"
    ]
  }'

# Response: valid=true, completeness=100%
```

---

## Relationship Types

| Type | Description | Use Case |
|------|-------------|----------|
| `CAUSES` | Parent event caused this receipt | Incident → Investigation → Resolution |
| `EVIDENCES` | This receipt provides evidence for parent | Payment → Product delivered |
| `FULFILLS` | This receipt fulfills parent requirement | Order → Delivery confirmed |
| `INVALIDATES` | This receipt invalidates parent | Original receipt → Corrected receipt |
| `AMENDS` | This receipt amends parent | Document v1 → Document v2 |

---

## Tier Limits

| Tier | Graph Depth | Monthly Receipts | Price |
|------|-------------|------------------|-------|
| FREE | 3 levels | 100 | $0 |
| STARTER | 5 levels | 1,000 | $49/mo |
| PROFESSIONAL | 10 levels | 5,000 | $199/mo |
| SCALE | Unlimited | 10,000 | $499/mo |
| ENTERPRISE | Unlimited | Custom | $25K+/year |

---

## Error Handling

All endpoints return standard error format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {} // Optional additional info
  }
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request (invalid input)
- `401` - Unauthorized (missing/invalid API key)
- `404` - Not found
- `500` - Internal server error

---

---

## 4. Batch Operations

**Process multiple receipts in a single API call. Handles partial failures gracefully.**

### Endpoint
```
POST /api/v1/receipts/batch
```

### Use Cases
- **Bulk import:** Load historical data from other systems
- **ETL pipelines:** Generate receipts from data warehouses
- **Daily batch processing:** Create receipts for overnight transactions
- **Migration:** Move data from legacy systems

### Request Example (Simple Batch)
```bash
curl -X POST https://api.certnode.io/api/v1/receipts/batch \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "receipts": [
      {
        "type": "transaction",
        "data": {
          "amount": 89.50,
          "currency": "USD",
          "orderId": "order_001"
        }
      },
      {
        "type": "transaction",
        "data": {
          "amount": 125.00,
          "currency": "USD",
          "orderId": "order_002"
        }
      },
      {
        "type": "content",
        "data": {
          "contentHash": "sha256:abc123...",
          "contentType": "image/jpeg"
        }
      }
    ],
    "options": {
      "parallel": true,
      "stopOnError": false
    }
  }'
```

### Response Example (All Success)
```json
{
  "success": true,
  "data": {
    "success": true,
    "processed": 3,
    "succeeded": 3,
    "failed": 0,
    "results": [
      {
        "index": 0,
        "success": true,
        "receiptId": "receipt_tx_abc123",
        "data": {
          "id": "receipt_tx_abc123",
          "type": "TRANSACTION",
          "graphDepth": 0,
          "createdAt": "2024-10-02T15:00:00Z"
        }
      },
      {
        "index": 1,
        "success": true,
        "receiptId": "receipt_tx_def456",
        "data": {
          "id": "receipt_tx_def456",
          "type": "TRANSACTION",
          "graphDepth": 0,
          "createdAt": "2024-10-02T15:00:01Z"
        }
      },
      {
        "index": 2,
        "success": true,
        "receiptId": "receipt_content_xyz789",
        "data": {
          "id": "receipt_content_xyz789",
          "type": "CONTENT",
          "graphDepth": 0,
          "createdAt": "2024-10-02T15:00:02Z"
        }
      }
    ],
    "processingTimeMs": 1847
  },
  "metadata": {
    "platform": "Batch Operations",
    "feature": "Bulk receipt creation",
    "validation": "3 succeeded, 0 failed"
  }
}
```

### Response Example (Partial Failure)
```json
{
  "success": false,
  "data": {
    "success": false,
    "processed": 3,
    "succeeded": 2,
    "failed": 1,
    "results": [
      {
        "index": 0,
        "success": true,
        "receiptId": "receipt_tx_abc123",
        "data": {
          "id": "receipt_tx_abc123",
          "type": "TRANSACTION",
          "graphDepth": 0,
          "createdAt": "2024-10-02T15:00:00Z"
        }
      },
      {
        "index": 1,
        "success": false,
        "error": {
          "message": "Receipt data is required",
          "code": "MISSING_DATA"
        }
      },
      {
        "index": 2,
        "success": true,
        "receiptId": "receipt_content_xyz789",
        "data": {
          "id": "receipt_content_xyz789",
          "type": "CONTENT",
          "graphDepth": 0,
          "createdAt": "2024-10-02T15:00:02Z"
        }
      }
    ],
    "processingTimeMs": 1523,
    "errors": {
      "summary": "1 of 3 receipts failed",
      "details": [
        {
          "index": 1,
          "message": "Receipt data is required"
        }
      ]
    }
  },
  "metadata": {
    "platform": "Batch Operations",
    "feature": "Bulk receipt creation",
    "validation": "2 succeeded, 1 failed"
  }
}
```

### Request Example (Batch with Graph Links)
```bash
# Create parent receipt first
PARENT_ID="receipt_tx_abc123"

# Then create child receipts linked to parent
curl -X POST https://api.certnode.io/api/v1/receipts/batch \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"receipts\": [
      {
        \"type\": \"content\",
        \"data\": {
          \"contentHash\": \"sha256:abc...\",
          \"aiScore\": 0.87
        },
        \"parentReceipts\": [
          {
            \"receiptId\": \"$PARENT_ID\",
            \"relationType\": \"EVIDENCES\"
          }
        ]
      },
      {
        \"type\": \"ops\",
        \"data\": {
          \"operationType\": \"delivery_confirmed\"
        },
        \"parentReceipts\": [
          {
            \"receiptId\": \"$PARENT_ID\",
            \"relationType\": \"FULFILLS\"
          }
        ]
      }
    ]
  }"
```

### Batch Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `parallel` | boolean | `true` | Process receipts in parallel for better performance |
| `stopOnError` | boolean | `false` | Stop processing if one receipt fails |

### Performance Guidelines

| Batch Size | Avg Processing Time | Recommended Use |
|------------|---------------------|-----------------|
| 1-10 receipts | <500ms | Real-time operations |
| 11-100 receipts | 500ms-2s | Standard batches |
| 101-500 receipts | 2s-10s | Large batches |
| 501-1,000 receipts | 10s-30s | Maximum batch size |

**Tips:**
- Use `parallel: true` for faster processing (default)
- Use `stopOnError: true` for critical operations where all must succeed
- Split batches >1,000 into multiple requests
- Check `errors.details` for specific failure reasons

---

## Next Steps

1. **Test the APIs** using the examples above
2. ~~**Build Batch Operations**~~ ✅ DONE - Process 1,000+ receipts at once
3. **Implement Webhooks** for real-time event notifications (NEXT)
4. **Deploy Cross-Merchant Network** for trust scoring across merchants

See `IMPLEMENTATION_PLAN.md` for full roadmap.

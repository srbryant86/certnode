# Deployment Scripts

Scripts for deploying and testing CertNode features.

---

## Receipt Graph Deployment

### Quick Start (Windows)

```bash
# From project root
scripts\deploy-receipt-graph.bat
```

### Quick Start (Mac/Linux)

```bash
# From project root
bash scripts/deploy-receipt-graph.sh
```

### What It Does

1. ✅ Checks environment variables
2. ✅ Installs dependencies
3. ✅ Generates Prisma Client (TypeScript types)
4. ✅ Creates and applies database migration
5. ✅ Validates TypeScript compilation
6. ✅ Runs tests
7. ✅ Verifies database schema

### After Running

The script will:
- Create `certnode-dashboard/dev.db` (SQLite database)
- Add receipt graph tables and relationships
- Generate TypeScript types for graph APIs
- Show deployment summary

---

## Testing Receipt Graph

### Run Interactive Demo

```bash
cd certnode-dashboard
npx tsx ../scripts/test-receipt-graph.ts
```

### What It Does

Creates a sample e-commerce scenario:
1. Transaction receipt ($500 payment)
2. Content receipt (delivery photo) → evidences transaction
3. Operations receipt (delivery confirmation) → fulfills content
4. Demonstrates complete evidence chain for dispute protection

### Sample Output

```
🎯 Receipt Graph Demo
====================

Step 1: Setting up demo enterprise...
✅ Created demo enterprise: ent_abc123

Step 2: Creating transaction receipt (payment)...
✅ Transaction receipt created: receipt_tx_xyz
   Graph depth: 0

Step 3: Creating content receipt (delivery photo)...
✅ Content receipt created: receipt_content_abc
   Graph depth: 1
   Relationship: EVIDENCES transaction

Step 4: Creating operations receipt (confirmation)...
✅ Operations receipt created: receipt_ops_def
   Graph depth: 2
   Relationship: FULFILLS content evidence

Step 5: Traversing complete receipt graph...
✅ Graph traversal complete
   Total nodes: 3
   Total edges: 2
   Total depth: 2

📊 Graph structure:
├─ [TRANSACTION] receipt_tx_xyz (depth: 0)
  ├─ [CONTENT] receipt_content_abc (depth: 1)
    ├─ [OPS] receipt_ops_def (depth: 2)

🎉 Chargeback reversed! Complete cryptographic proof of delivery.
```

---

## Running Tests

### Full Test Suite

```bash
cd certnode-dashboard
npm test __tests__/receipt-graph.test.ts
```

### Watch Mode

```bash
cd certnode-dashboard
npm test -- --watch __tests__/receipt-graph.test.ts
```

### What's Tested

- ✅ Create receipts with parent relationships
- ✅ Calculate graph depth correctly
- ✅ Traverse graphs (ancestors, descendants, both)
- ✅ Respect tier-based depth limits
- ✅ Find paths between receipts
- ✅ Graph analytics and metrics
- ✅ Graph integrity validation (cycle detection)
- ✅ All relationship types (CAUSES, EVIDENCES, FULFILLS, etc.)
- ✅ Multiple parent receipts
- ✅ Orphaned receipt detection

---

## Troubleshooting

### "Prisma Client not found"

**Solution:**
```bash
cd certnode-dashboard
npx prisma generate
```

### "Migration failed"

**Solution:**
```bash
cd certnode-dashboard
npx prisma migrate reset  # WARNING: Deletes all data
npx prisma migrate dev
```

### "Cannot find module"

**Solution:**
```bash
cd certnode-dashboard
npm install
```

### "Database locked"

**Solution:**
- Close any database browsers (DB Browser for SQLite, etc.)
- Stop dev server
- Try again

### TypeScript errors after migration

**Solution:**
```bash
cd certnode-dashboard
npx prisma generate  # Regenerate TypeScript types
npm run typecheck    # Verify
```

---

## Manual Deployment Steps

If scripts don't work, run these manually:

```bash
cd certnode-dashboard

# 1. Generate Prisma Client
npx prisma generate

# 2. Apply migration
npx prisma migrate dev --name add_receipt_graph

# 3. Verify
npx prisma validate

# 4. Test
npm test __tests__/receipt-graph.test.ts

# 5. Start dev server
npm run dev
```

---

## API Testing

### Using cURL

```bash
# Get API info
curl http://localhost:3000/api/v1/receipts/graph \
  -H "Authorization: Bearer YOUR_API_KEY"

# Create receipt with graph
curl -X POST http://localhost:3000/api/v1/receipts/graph \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "transaction",
    "data": {
      "amount": 50000,
      "orderId": "order_123"
    }
  }'

# Get receipt graph
curl http://localhost:3000/api/v1/receipts/graph/receipt_123?direction=both \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Using Postman

1. Import OpenAPI spec: `/openapi.json`
2. Set authorization header
3. Test endpoints

---

## Production Deployment

### Vercel

```bash
# From project root
git add -A
git commit -m "feat: deploy receipt graph MVP"
git push

# Migrations run automatically on Vercel
# Or manually:
npx prisma migrate deploy
```

### Other Platforms

```bash
# Set environment variables
DATABASE_URL="your-production-db-url"

# Run migrations
cd certnode-dashboard
npx prisma migrate deploy

# Build
npm run build

# Start
npm start
```

---

## Next Steps After Deployment

1. **Week 2 Features:**
   - Batch operations
   - Public verification widget
   - Webhooks

2. **Dashboard:**
   - Graph visualization component
   - Analytics page
   - Receipt explorer

3. **Documentation:**
   - Update API docs
   - Create video demos
   - Customer onboarding guides

4. **Marketing:**
   - Update homepage with graph messaging
   - Create demo environment
   - Launch announcement

---

## Support

- **Documentation:** `/docs/RECEIPT_GRAPH_API.md`
- **Master Plan:** `/docs/MASTER_IMPLEMENTATION_PLAN.md`
- **Issues:** Check logs in `certnode-dashboard/logs/`
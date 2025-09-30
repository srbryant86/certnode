/**
 * Receipt Graph Demo Script
 *
 * Run with: npx tsx scripts/test-receipt-graph.ts
 *
 * This script demonstrates the receipt graph by creating a sample
 * e-commerce dispute scenario with complete evidence chain.
 */

import { PrismaClient } from '@prisma/client'
import {
  createReceiptWithGraph,
  getReceiptGraph,
  findPathsBetweenReceipts,
  getGraphAnalytics
} from '../certnode-dashboard/lib/graph/receipt-graph-service'

const prisma = new PrismaClient()

async function main() {
  console.log('🎯 Receipt Graph Demo')
  console.log('====================\n')

  // Step 1: Create or get demo enterprise
  console.log('Step 1: Setting up demo enterprise...')
  let enterprise = await prisma.enterprise.findFirst({
    where: { name: 'Demo E-Commerce Store' }
  })

  if (!enterprise) {
    enterprise = await prisma.enterprise.create({
      data: {
        name: 'Demo E-Commerce Store',
        tier: 'PRO'
      }
    })
    console.log(`✅ Created demo enterprise: ${enterprise.id}\n`)
  } else {
    console.log(`✅ Using existing enterprise: ${enterprise.id}\n`)
  }

  // Step 2: Create transaction receipt (payment)
  console.log('Step 2: Creating transaction receipt (payment)...')
  const transactionReceipt = await createReceiptWithGraph({
    enterpriseId: enterprise.id,
    type: 'transaction',
    data: {
      orderId: 'ORDER-2024-001',
      amount: 50000, // $500.00
      currency: 'USD',
      customerEmail: 'customer@example.com',
      paymentMethod: 'credit_card',
      timestamp: new Date().toISOString()
    }
  })
  console.log(`✅ Transaction receipt created: ${transactionReceipt.id}`)
  console.log(`   Graph depth: ${transactionReceipt.graphDepth}\n`)

  // Step 3: Create content receipt (delivery photo evidence)
  console.log('Step 3: Creating content receipt (delivery photo)...')
  const contentReceipt = await createReceiptWithGraph({
    enterpriseId: enterprise.id,
    type: 'content',
    data: {
      contentType: 'image/jpeg',
      contentHash: 'sha256:abc123def456...',
      description: 'Package delivered to front door',
      metadata: {
        captureTime: new Date().toISOString(),
        location: '123 Main St, Anytown, USA',
        deviceType: 'delivery_scanner'
      }
    },
    parentReceipts: [
      {
        receiptId: transactionReceipt.id,
        relationType: 'EVIDENCES',
        description: 'Photo evidences successful delivery for transaction',
        metadata: {
          evidenceType: 'delivery_confirmation',
          quality: 'high_resolution'
        }
      }
    ]
  })
  console.log(`✅ Content receipt created: ${contentReceipt.id}`)
  console.log(`   Graph depth: ${contentReceipt.graphDepth}`)
  console.log(`   Relationship: EVIDENCES transaction\n`)

  // Step 4: Create operations receipt (delivery confirmation)
  console.log('Step 4: Creating operations receipt (confirmation)...')
  const opsReceipt = await createReceiptWithGraph({
    enterpriseId: enterprise.id,
    type: 'ops',
    data: {
      operationType: 'delivery_confirmation',
      deliveryPerson: 'John Delivery',
      signature: 'customer_signature_hash',
      timestamp: new Date().toISOString()
    },
    parentReceipts: [
      {
        receiptId: contentReceipt.id,
        relationType: 'FULFILLS',
        description: 'Confirmation fulfills delivery requirement',
        metadata: {
          confirmationType: 'signature_obtained'
        }
      }
    ]
  })
  console.log(`✅ Operations receipt created: ${opsReceipt.id}`)
  console.log(`   Graph depth: ${opsReceipt.graphDepth}`)
  console.log(`   Relationship: FULFILLS content evidence\n`)

  // Step 5: Get complete graph from transaction
  console.log('Step 5: Traversing complete receipt graph...')
  const graph = await getReceiptGraph(
    transactionReceipt.id,
    enterprise.tier,
    'descendants'
  )
  console.log(`✅ Graph traversal complete`)
  console.log(`   Total nodes: ${graph.nodes.length}`)
  console.log(`   Total edges: ${graph.edges.length}`)
  console.log(`   Total depth: ${graph.totalDepth}`)
  console.log(`   Depth limit reached: ${graph.depthLimitReached}\n`)

  console.log('📊 Graph structure:')
  for (const node of graph.nodes) {
    const indent = '  '.repeat(node.depth)
    console.log(`${indent}├─ [${node.receipt.type}] ${node.receipt.id} (depth: ${node.depth})`)
  }
  console.log('')

  // Step 6: Find path from transaction to operations
  console.log('Step 6: Finding path from transaction to operations...')
  const paths = await findPathsBetweenReceipts(
    transactionReceipt.id,
    opsReceipt.id
  )
  console.log(`✅ Found ${paths.length} path(s)`)

  if (paths.length > 0) {
    const firstPath = paths[0]
    console.log(`   Path length: ${firstPath.path.length} receipts`)
    console.log(`   Path: ${firstPath.path.join(' → ')}`)
    console.log('\n   Relationships:')
    for (const rel of firstPath.relationships) {
      console.log(`   - ${rel.parentReceiptId} [${rel.relationType}] ${rel.childReceiptId}`)
      if (rel.description) {
        console.log(`     "${rel.description}"`)
      }
    }
  }
  console.log('')

  // Step 7: Get graph analytics
  console.log('Step 7: Getting graph analytics...')
  const analytics = await getGraphAnalytics(enterprise.id)
  console.log('✅ Analytics retrieved:')
  console.log(`   Total receipts: ${analytics.totalReceipts}`)
  console.log(`   Total relationships: ${analytics.totalRelationships}`)
  console.log(`   Max depth: ${analytics.maxDepth}`)
  console.log(`   Orphaned receipts: ${analytics.orphanedReceipts.count}`)

  console.log('\n   Receipts by type:')
  for (const type of analytics.receiptsByType) {
    console.log(`   - ${type.type}: ${type.count}`)
  }

  console.log('\n   Relationships by type:')
  for (const type of analytics.relationshipsByType) {
    console.log(`   - ${type.type}: ${type.count}`)
  }
  console.log('')

  // Step 8: Demonstrate dispute scenario
  console.log('Step 8: Simulating chargeback dispute...')
  console.log('📧 Customer files chargeback: "Never received product"')
  console.log('🔍 Merchant queries receipt graph...')
  console.log('')
  console.log('Evidence chain:')
  console.log(`1. ✅ Payment receipt: ${transactionReceipt.id}`)
  console.log(`2. ✅ Delivery photo: ${contentReceipt.id}`)
  console.log(`3. ✅ Delivery confirmation: ${opsReceipt.id}`)
  console.log('')
  console.log('🎉 Chargeback reversed! Complete cryptographic proof of delivery.')
  console.log('')

  console.log('✨ Demo complete!')
  console.log('')
  console.log('📚 What this demonstrates:')
  console.log('  - Creating receipts with parent relationships')
  console.log('  - Building evidence chains across product types')
  console.log('  - Traversing the receipt graph')
  console.log('  - Finding paths between receipts')
  console.log('  - Graph analytics and insights')
  console.log('  - Real-world dispute protection use case')
  console.log('')
  console.log('🚀 Next steps:')
  console.log('  - Test via API: POST /api/v1/receipts/graph')
  console.log('  - Build dashboard visualization')
  console.log('  - Add batch operations (Week 2)')
  console.log('  - Deploy to production')
  console.log('')
}

main()
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
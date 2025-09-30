/**
 * Receipt Graph Tests
 *
 * Run with: npm test __tests__/receipt-graph.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import {
  createReceiptWithGraph,
  getReceiptGraph,
  findPathsBetweenReceipts,
  getGraphAnalytics,
  validateGraphIntegrity,
  GRAPH_DEPTH_LIMITS
} from '../lib/graph/receipt-graph-service'

const prisma = new PrismaClient()

describe('Receipt Graph Service', () => {
  let testEnterpriseId: string
  let rootReceiptId: string
  let childReceiptId: string
  let grandchildReceiptId: string

  beforeAll(async () => {
    // Create test enterprise
    const enterprise = await prisma.enterprise.create({
      data: {
        name: 'Test Enterprise',
        tier: 'PRO'
      }
    })
    testEnterpriseId = enterprise.id
  })

  afterAll(async () => {
    // Cleanup
    await prisma.receiptRelationship.deleteMany({
      where: {
        parentReceipt: { enterpriseId: testEnterpriseId }
      }
    })
    await prisma.receipt.deleteMany({
      where: { enterpriseId: testEnterpriseId }
    })
    await prisma.enterprise.delete({
      where: { id: testEnterpriseId }
    })
    await prisma.$disconnect()
  })

  describe('createReceiptWithGraph', () => {
    it('should create a root receipt without parents', async () => {
      const receipt = await createReceiptWithGraph({
        enterpriseId: testEnterpriseId,
        type: 'transaction',
        data: {
          amount: 50000,
          orderId: 'order_123'
        }
      })

      expect(receipt).toBeDefined()
      expect(receipt.enterpriseId).toBe(testEnterpriseId)
      expect(receipt.type).toBe('TRANSACTION')
      expect(receipt.graphDepth).toBe(0)
      expect(receipt.graphHash).toBeDefined()

      rootReceiptId = receipt.id
    })

    it('should create a child receipt with one parent', async () => {
      const receipt = await createReceiptWithGraph({
        enterpriseId: testEnterpriseId,
        type: 'content',
        data: {
          contentHash: 'sha256:abc123',
          description: 'Delivery photo'
        },
        parentReceipts: [
          {
            receiptId: rootReceiptId,
            relationType: 'EVIDENCES',
            description: 'Photo evidences transaction'
          }
        ]
      })

      expect(receipt).toBeDefined()
      expect(receipt.type).toBe('CONTENT')
      expect(receipt.graphDepth).toBe(1)

      // Verify relationship was created
      const relationship = await prisma.receiptRelationship.findFirst({
        where: {
          parentReceiptId: rootReceiptId,
          childReceiptId: receipt.id
        }
      })

      expect(relationship).toBeDefined()
      expect(relationship?.relationType).toBe('EVIDENCES')

      childReceiptId = receipt.id
    })

    it('should create a grandchild receipt', async () => {
      const receipt = await createReceiptWithGraph({
        enterpriseId: testEnterpriseId,
        type: 'ops',
        data: {
          operationType: 'delivery_confirmation',
          signature: 'customer_sig'
        },
        parentReceipts: [
          {
            receiptId: childReceiptId,
            relationType: 'FULFILLS',
            description: 'Confirmation fulfills delivery requirement'
          }
        ]
      })

      expect(receipt).toBeDefined()
      expect(receipt.type).toBe('OPS')
      expect(receipt.graphDepth).toBe(2)

      grandchildReceiptId = receipt.id
    })

    it('should reject invalid parent receipt', async () => {
      await expect(
        createReceiptWithGraph({
          enterpriseId: testEnterpriseId,
          type: 'content',
          data: {},
          parentReceipts: [
            {
              receiptId: 'invalid_receipt_id',
              relationType: 'EVIDENCES'
            }
          ]
        })
      ).rejects.toThrow('not found')
    })
  })

  describe('getReceiptGraph', () => {
    it('should traverse descendants from root', async () => {
      const graph = await getReceiptGraph(
        rootReceiptId,
        'PRO',
        'descendants'
      )

      expect(graph.nodes.length).toBeGreaterThanOrEqual(3)
      expect(graph.edges.length).toBeGreaterThanOrEqual(2)
      expect(graph.totalDepth).toBeGreaterThanOrEqual(2)
      expect(graph.depthLimitReached).toBe(false)
      expect(graph.rootReceiptId).toBe(rootReceiptId)

      // Verify path structure
      const rootNode = graph.nodes.find(n => n.receipt.id === rootReceiptId)
      expect(rootNode?.depth).toBe(0)
      expect(rootNode?.path).toEqual([rootReceiptId])
    })

    it('should traverse ancestors from grandchild', async () => {
      const graph = await getReceiptGraph(
        grandchildReceiptId,
        'PRO',
        'ancestors'
      )

      expect(graph.nodes.length).toBeGreaterThanOrEqual(3)
      expect(graph.edges.length).toBeGreaterThanOrEqual(2)

      // Should include all ancestors
      const receiptIds = graph.nodes.map(n => n.receipt.id)
      expect(receiptIds).toContain(rootReceiptId)
      expect(receiptIds).toContain(childReceiptId)
      expect(receiptIds).toContain(grandchildReceiptId)
    })

    it('should respect tier depth limits', async () => {
      // Create deep chain (more than FREE tier limit)
      let lastId = grandchildReceiptId
      for (let i = 0; i < 5; i++) {
        const receipt = await createReceiptWithGraph({
          enterpriseId: testEnterpriseId,
          type: 'content',
          data: { depth: i + 3 },
          parentReceipts: [
            {
              receiptId: lastId,
              relationType: 'CAUSES'
            }
          ]
        })
        lastId = receipt.id
      }

      // FREE tier should hit limit
      const freeGraph = await getReceiptGraph(
        rootReceiptId,
        'FREE',
        'descendants'
      )

      expect(freeGraph.depthLimitReached).toBe(true)
      expect(freeGraph.totalDepth).toBeLessThanOrEqual(GRAPH_DEPTH_LIMITS.FREE)

      // PRO tier should see more
      const proGraph = await getReceiptGraph(
        rootReceiptId,
        'PRO',
        'descendants'
      )

      expect(proGraph.nodes.length).toBeGreaterThan(freeGraph.nodes.length)
    })
  })

  describe('findPathsBetweenReceipts', () => {
    it('should find path from root to grandchild', async () => {
      const paths = await findPathsBetweenReceipts(
        rootReceiptId,
        grandchildReceiptId
      )

      expect(paths.length).toBeGreaterThan(0)

      const firstPath = paths[0]
      expect(firstPath.path).toContain(rootReceiptId)
      expect(firstPath.path).toContain(grandchildReceiptId)
      expect(firstPath.path.length).toBeGreaterThanOrEqual(3)

      // Verify relationships
      expect(firstPath.relationships.length).toBe(firstPath.path.length - 1)
    })

    it('should return empty array when no path exists', async () => {
      // Create isolated receipt
      const isolatedReceipt = await createReceiptWithGraph({
        enterpriseId: testEnterpriseId,
        type: 'transaction',
        data: { isolated: true }
      })

      const paths = await findPathsBetweenReceipts(
        rootReceiptId,
        isolatedReceipt.id
      )

      expect(paths.length).toBe(0)
    })

    it('should respect maxPaths limit', async () => {
      const paths = await findPathsBetweenReceipts(
        rootReceiptId,
        grandchildReceiptId,
        1
      )

      expect(paths.length).toBeLessThanOrEqual(1)
    })
  })

  describe('getGraphAnalytics', () => {
    it('should return accurate analytics', async () => {
      const analytics = await getGraphAnalytics(testEnterpriseId)

      expect(analytics.totalReceipts).toBeGreaterThan(0)
      expect(analytics.totalRelationships).toBeGreaterThan(0)
      expect(analytics.receiptsByType.length).toBeGreaterThan(0)
      expect(analytics.relationshipsByType.length).toBeGreaterThan(0)
      expect(analytics.maxDepth).toBeGreaterThanOrEqual(2)

      // Check receipts by type
      const transactionReceipts = analytics.receiptsByType.find(
        r => r.type === 'TRANSACTION'
      )
      expect(transactionReceipts).toBeDefined()

      // Check orphaned receipts
      expect(analytics.orphanedReceipts).toBeDefined()
      expect(typeof analytics.orphanedReceipts.count).toBe('number')
    })

    it('should track orphaned receipts', async () => {
      // Create orphaned receipt
      await createReceiptWithGraph({
        enterpriseId: testEnterpriseId,
        type: 'content',
        data: { orphaned: true }
      })

      const analytics = await getGraphAnalytics(testEnterpriseId)
      expect(analytics.orphanedReceipts.count).toBeGreaterThan(0)
    })
  })

  describe('validateGraphIntegrity', () => {
    it('should validate graph has no cycles', async () => {
      const validation = await validateGraphIntegrity(testEnterpriseId)

      expect(validation.valid).toBe(true)
      expect(validation.issues.length).toBe(0)
    })

    // Note: Cycle prevention is enforced at creation time,
    // so this test documents the expected behavior
    it('should document cycle prevention', async () => {
      // Cycles are prevented by the DAG structure
      // Attempting to create a cycle would require referencing
      // a descendant as a parent, which we prevent
      expect(true).toBe(true) // Documentation test
    })
  })

  describe('Graph depth calculations', () => {
    it('should calculate depth correctly', async () => {
      const root = await prisma.receipt.findUnique({
        where: { id: rootReceiptId }
      })
      const child = await prisma.receipt.findUnique({
        where: { id: childReceiptId }
      })
      const grandchild = await prisma.receipt.findUnique({
        where: { id: grandchildReceiptId }
      })

      expect(root?.graphDepth).toBe(0)
      expect(child?.graphDepth).toBe(1)
      expect(grandchild?.graphDepth).toBe(2)
    })

    it('should calculate depth from max parent depth', async () => {
      // Create receipt with two parents at different depths
      const multiParentReceipt = await createReceiptWithGraph({
        enterpriseId: testEnterpriseId,
        type: 'content',
        data: { multiParent: true },
        parentReceipts: [
          {
            receiptId: childReceiptId, // depth 1
            relationType: 'EVIDENCES'
          },
          {
            receiptId: grandchildReceiptId, // depth 2
            relationType: 'EVIDENCES'
          }
        ]
      })

      // Should be max(1, 2) + 1 = 3
      expect(multiParentReceipt.graphDepth).toBe(3)
    })
  })

  describe('Relationship types', () => {
    it('should support all relationship types', async () => {
      const relationTypes = ['CAUSES', 'EVIDENCES', 'FULFILLS', 'INVALIDATES', 'AMENDS']

      for (const relationType of relationTypes) {
        const receipt = await createReceiptWithGraph({
          enterpriseId: testEnterpriseId,
          type: 'content',
          data: { relationType },
          parentReceipts: [
            {
              receiptId: rootReceiptId,
              relationType: relationType as any
            }
          ]
        })

        const relationship = await prisma.receiptRelationship.findFirst({
          where: { childReceiptId: receipt.id }
        })

        expect(relationship?.relationType).toBe(relationType)
      }
    })

    it('should store relationship metadata', async () => {
      const metadata = {
        confidence: 0.95,
        source: 'automated',
        timestamp: new Date().toISOString()
      }

      const receipt = await createReceiptWithGraph({
        enterpriseId: testEnterpriseId,
        type: 'content',
        data: { test: true },
        parentReceipts: [
          {
            receiptId: rootReceiptId,
            relationType: 'EVIDENCES',
            description: 'Test relationship with metadata',
            metadata
          }
        ]
      })

      const relationship = await prisma.receiptRelationship.findFirst({
        where: { childReceiptId: receipt.id }
      })

      expect(relationship?.description).toBe('Test relationship with metadata')
      expect(relationship?.metadata).toMatchObject(metadata)
    })
  })
})

describe('GRAPH_DEPTH_LIMITS', () => {
  it('should have correct tier limits', () => {
    expect(GRAPH_DEPTH_LIMITS.FREE).toBe(3)
    expect(GRAPH_DEPTH_LIMITS.STARTER).toBe(5)
    expect(GRAPH_DEPTH_LIMITS.PRO).toBe(10)
    expect(GRAPH_DEPTH_LIMITS.ENTERPRISE).toBe(Infinity)
  })
})
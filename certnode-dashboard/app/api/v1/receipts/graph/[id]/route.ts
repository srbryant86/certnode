import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { getReceiptGraph, GRAPH_DEPTH_LIMITS } from '@/lib/graph/receipt-graph-service'
import { createSuccessResponse, createErrorResponse, QualityProfiles } from '@/lib/api-response-helpers'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

/**
 * GET /api/v1/receipts/graph/{id}
 * Get the receipt graph starting from a specific receipt
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = crypto.randomUUID()

  try {
    // Authenticate
    const authResult = await authenticateApiKey(request)
    if (!authResult.success) {
      return NextResponse.json(
        createErrorResponse(
          authResult.error,
          'AUTHENTICATION_FAILED',
          QualityProfiles.enterprise
        ),
        { status: 401 }
      )
    }

    const receiptId = params.id
    const { searchParams } = new URL(request.url)
    const direction = (searchParams.get('direction') || 'both') as 'ancestors' | 'descendants' | 'both'

    // Validate direction
    if (!['ancestors', 'descendants', 'both'].includes(direction)) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid direction. Must be ancestors, descendants, or both',
          'INVALID_DIRECTION',
          QualityProfiles.enterprise
        ),
        { status: 400 }
      )
    }

    // Verify receipt exists and belongs to enterprise
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: receiptId,
        enterpriseId: authResult.enterpriseId!
      }
    })

    if (!receipt) {
      return NextResponse.json(
        createErrorResponse(
          'Receipt not found or access denied',
          'RECEIPT_NOT_FOUND',
          QualityProfiles.enterprise
        ),
        { status: 404 }
      )
    }

    // Get enterprise tier for depth limits
    const enterprise = await prisma.enterprise.findUnique({
      where: { id: authResult.enterpriseId! },
      select: { tier: true }
    })

    if (!enterprise) {
      return NextResponse.json(
        createErrorResponse(
          'Enterprise not found',
          'ENTERPRISE_NOT_FOUND',
          QualityProfiles.enterprise
        ),
        { status: 404 }
      )
    }

    // Get the graph
    const graph = await getReceiptGraph(
      receiptId,
      enterprise.tier,
      direction
    )

    const responseData = {
      receipt: {
        id: receipt.id,
        type: receipt.type,
        graphDepth: receipt.graphDepth
      },
      graph: {
        nodes: graph.nodes.map(node => ({
          id: node.receipt.id,
          type: node.receipt.type,
          depth: node.depth,
          graphDepth: node.receipt.graphDepth,
          createdAt: node.receipt.createdAt,
          path: node.path
        })),
        edges: graph.edges,
        totalNodes: graph.nodes.length,
        totalEdges: graph.edges.length,
        totalDepth: graph.totalDepth,
        depthLimitReached: graph.depthLimitReached
      },
      limits: {
        tier: enterprise.tier,
        maxDepth: GRAPH_DEPTH_LIMITS[enterprise.tier],
        depthLimitReached: graph.depthLimitReached
      }
    }

    if (graph.depthLimitReached) {
      responseData.message = `Graph depth limit reached for ${enterprise.tier} tier. Upgrade for deeper traversal.`
    }

    return NextResponse.json(
      createSuccessResponse(responseData, {
        platform: 'Receipt Graph Infrastructure',
        feature: 'Graph traversal',
        validation: `Tier-based depth limits (${enterprise.tier})`
      })
    )
  } catch (error) {
    console.error('Receipt graph traversal error:', error)
    return NextResponse.json(
      createErrorResponse(
        'Failed to traverse receipt graph',
        'GRAPH_TRAVERSAL_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    )
  }
}
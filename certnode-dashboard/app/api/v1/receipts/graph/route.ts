import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { createReceiptWithGraph } from '@/lib/graph/receipt-graph-service'
import { createSuccessResponse, createErrorResponse, QualityProfiles } from '@/lib/api-response-helpers'
import { RelationType } from '@prisma/client'
import crypto from 'crypto'

/**
 * POST /api/v1/receipts/graph
 * Create a receipt with optional parent relationships
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { type, data, parentReceipts } = body

    // Validate required fields
    if (!type || !data) {
      return NextResponse.json(
        createErrorResponse(
          'Missing required fields: type, data',
          'MISSING_REQUIRED_FIELDS',
          QualityProfiles.enterprise
        ),
        { status: 400 }
      )
    }

    // Validate type
    if (!['transaction', 'content', 'ops'].includes(type)) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid receipt type. Must be transaction, content, or ops',
          'INVALID_RECEIPT_TYPE',
          QualityProfiles.enterprise
        ),
        { status: 400 }
      )
    }

    // Validate parent receipts if provided
    if (parentReceipts) {
      if (!Array.isArray(parentReceipts)) {
        return NextResponse.json(
          createErrorResponse(
            'parentReceipts must be an array',
            'INVALID_PARENT_RECEIPTS',
            QualityProfiles.enterprise
          ),
          { status: 400 }
        )
      }

      for (const parent of parentReceipts) {
        if (!parent.receiptId || !parent.relationType) {
          return NextResponse.json(
            createErrorResponse(
              'Each parent receipt must have receiptId and relationType',
              'INVALID_PARENT_RECEIPT',
              QualityProfiles.enterprise
            ),
            { status: 400 }
          )
        }

        const validRelationTypes = ['CAUSES', 'EVIDENCES', 'FULFILLS', 'INVALIDATES', 'AMENDS']
        if (!validRelationTypes.includes(parent.relationType)) {
          return NextResponse.json(
            createErrorResponse(
              `Invalid relationType. Must be one of: ${validRelationTypes.join(', ')}`,
              'INVALID_RELATION_TYPE',
              QualityProfiles.enterprise
            ),
            { status: 400 }
          )
        }
      }
    }

    // Create receipt with graph
    const receipt = await createReceiptWithGraph({
      enterpriseId: authResult.enterpriseId!,
      type,
      data,
      parentReceipts: parentReceipts?.map((p: any) => ({
        receiptId: p.receiptId,
        relationType: p.relationType as RelationType,
        description: p.description,
        metadata: p.metadata
      })),
      createdBy: authResult.user?.id
    })

    const responseData = {
      receipt: {
        id: receipt.id,
        type: receipt.type,
        enterpriseId: receipt.enterpriseId,
        graphDepth: receipt.graphDepth,
        graphHash: receipt.graphHash,
        createdAt: receipt.createdAt,
        parentCount: parentReceipts?.length || 0
      },
      graph: {
        depth: receipt.graphDepth,
        hasParents: (parentReceipts?.length || 0) > 0
      }
    }

    return NextResponse.json(
      createSuccessResponse(responseData, {
        platform: 'Receipt Graph Infrastructure',
        feature: 'Graph-connected receipts',
        validation: 'Cryptographic integrity with relationships'
      }),
      { status: 201 }
    )
  } catch (error) {
    console.error('Receipt graph creation error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          createErrorResponse(
            error.message,
            'PARENT_RECEIPT_NOT_FOUND',
            QualityProfiles.enterprise
          ),
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      createErrorResponse(
        'Receipt graph creation failed',
        'GRAPH_CREATION_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/receipts/graph
 * Get information about receipt graph capabilities
 */
export async function GET(request: NextRequest) {
  try {
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

    const info = {
      service: 'Receipt Graph',
      version: '1.0.0',
      capabilities: [
        'Create receipts with parent relationships',
        'Traverse receipt graphs',
        'Find paths between receipts',
        'Graph analytics and insights',
        'Tier-based depth limits'
      ],
      relationTypes: [
        'CAUSES - Parent event caused this receipt',
        'EVIDENCES - This receipt provides evidence for parent',
        'FULFILLS - This receipt fulfills parent requirement',
        'INVALIDATES - This receipt invalidates parent',
        'AMENDS - This receipt amends parent'
      ],
      tierLimits: {
        FREE: '3 levels deep',
        STARTER: '5 levels deep',
        PRO: '10 levels deep',
        ENTERPRISE: 'Unlimited depth'
      },
      endpoints: {
        create: 'POST /api/v1/receipts/graph',
        traverse: 'GET /api/v1/receipts/graph/{id}',
        findPath: 'GET /api/v1/receipts/graph/path',
        analytics: 'GET /api/v1/receipts/graph/analytics'
      }
    }

    return NextResponse.json(
      createSuccessResponse(info, {
        platform: 'Receipt Graph Infrastructure',
        feature: 'Graph capabilities',
        documentation: 'Full graph API documentation'
      })
    )
  } catch (error) {
    console.error('Receipt graph info error:', error)
    return NextResponse.json(
      createErrorResponse(
        'Failed to get receipt graph information',
        'GRAPH_INFO_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { findPathsBetweenReceipts } from '@/lib/graph/receipt-graph-service'
import { createSuccessResponse, createErrorResponse, QualityProfiles } from '@/lib/api-response-helpers'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

/**
 * GET /api/v1/receipts/graph/path?from={id}&to={id}
 * Find all paths between two receipts
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const fromReceiptId = searchParams.get('from')
    const toReceiptId = searchParams.get('to')
    const maxPaths = parseInt(searchParams.get('maxPaths') || '10')

    if (!fromReceiptId || !toReceiptId) {
      return NextResponse.json(
        createErrorResponse(
          'Missing required query parameters: from, to',
          'MISSING_QUERY_PARAMS',
          QualityProfiles.enterprise
        ),
        { status: 400 }
      )
    }

    if (fromReceiptId === toReceiptId) {
      return NextResponse.json(
        createErrorResponse(
          'from and to receipts must be different',
          'INVALID_QUERY_PARAMS',
          QualityProfiles.enterprise
        ),
        { status: 400 }
      )
    }

    // Verify both receipts exist and belong to enterprise
    const receipts = await prisma.receipt.findMany({
      where: {
        id: { in: [fromReceiptId, toReceiptId] },
        enterpriseId: authResult.enterpriseId!
      }
    })

    if (receipts.length !== 2) {
      return NextResponse.json(
        createErrorResponse(
          'One or both receipts not found or access denied',
          'RECEIPTS_NOT_FOUND',
          QualityProfiles.enterprise
        ),
        { status: 404 }
      )
    }

    // Find paths
    const paths = await findPathsBetweenReceipts(
      fromReceiptId,
      toReceiptId,
      maxPaths
    )

    const responseData = {
      from: {
        id: fromReceiptId,
        type: receipts.find(r => r.id === fromReceiptId)?.type
      },
      to: {
        id: toReceiptId,
        type: receipts.find(r => r.id === toReceiptId)?.type
      },
      paths: paths.map(p => ({
        receiptIds: p.path,
        steps: p.path.length - 1,
        relationships: p.relationships.map(r => ({
          from: r.parentReceiptId,
          to: r.childReceiptId,
          type: r.relationType,
          description: r.description
        }))
      })),
      totalPaths: paths.length,
      maxPathsReached: paths.length >= maxPaths
    }

    if (paths.length === 0) {
      responseData.message = 'No paths found between these receipts'
    } else if (paths.length >= maxPaths) {
      responseData.message = `Showing first ${maxPaths} paths. Increase maxPaths parameter to see more.`
    }

    return NextResponse.json(
      createSuccessResponse(responseData, {
        platform: 'Receipt Graph Infrastructure',
        feature: 'Path finding',
        validation: 'Graph connectivity analysis'
      })
    )
  } catch (error) {
    console.error('Receipt graph path finding error:', error)
    return NextResponse.json(
      createErrorResponse(
        'Failed to find paths between receipts',
        'PATH_FINDING_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    )
  }
}
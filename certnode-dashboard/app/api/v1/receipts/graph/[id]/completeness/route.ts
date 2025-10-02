/**
 * Graph Completeness Scoring API
 *
 * Returns a completeness score for a receipt's graph chain
 * Shows what's missing and provides upsell recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { createSuccessResponse, createErrorResponse, QualityProfiles } from '@/lib/api-response-helpers'
import { calculateGraphCompleteness } from '@/lib/graph/receipt-graph-service'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/v1/receipts/graph/{id}/completeness
 *
 * Calculate completeness score for a receipt's graph
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate
    const authResult = await authenticateApiKey(request)
    if (!authResult.success) {
      return NextResponse.json(
        createErrorResponse(
          'Authentication required',
          'AUTHENTICATION_FAILED',
          QualityProfiles.enterprise
        ),
        { status: 401 }
      )
    }

    const receiptId = params.id

    // Get enterprise tier
    const enterprise = await prisma.enterprise.findUnique({
      where: { id: authResult.enterpriseId! }
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

    // Calculate completeness
    const result = await calculateGraphCompleteness(
      receiptId,
      authResult.enterpriseId!,
      enterprise.tier
    )

    return NextResponse.json(
      createSuccessResponse(result, {
        platform: 'Receipt Graph Completeness',
        feature: 'Chain quality scoring',
        validation: `${result.completeness}% complete`
      }),
      { status: 200 }
    )

  } catch (error) {
    console.error('Graph completeness error:', error)

    if (error instanceof Error && error.message === 'Receipt not found') {
      return NextResponse.json(
        createErrorResponse(
          'Receipt not found',
          'RECEIPT_NOT_FOUND',
          QualityProfiles.enterprise
        ),
        { status: 404 }
      )
    }

    return NextResponse.json(
      createErrorResponse(
        'Failed to calculate completeness',
        'COMPLETENESS_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    )
  }
}

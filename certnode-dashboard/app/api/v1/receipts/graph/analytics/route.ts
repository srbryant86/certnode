import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { getGraphAnalytics, validateGraphIntegrity } from '@/lib/graph/receipt-graph-service'
import { createSuccessResponse, createErrorResponse, QualityProfiles } from '@/lib/api-response-helpers'
import crypto from 'crypto'

/**
 * GET /api/v1/receipts/graph/analytics
 * Get graph analytics for the authenticated enterprise
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
    const validateIntegrity = searchParams.get('validateIntegrity') === 'true'

    // Get analytics
    const analytics = await getGraphAnalytics(authResult.enterpriseId!)

    let integrity = undefined
    if (validateIntegrity) {
      integrity = await validateGraphIntegrity(authResult.enterpriseId!)
    }

    const responseData = {
      analytics: {
        totalReceipts: analytics.totalReceipts,
        totalRelationships: analytics.totalRelationships,
        receiptsByType: analytics.receiptsByType,
        relationshipsByType: analytics.relationshipsByType,
        maxDepth: analytics.maxDepth,
        orphanedReceipts: {
          count: analytics.orphanedReceipts.count,
          receipts: analytics.orphanedReceipts.receipts.slice(0, 10) // Limit to 10 for API response
        },
        graphMetrics: {
          avgRelationshipsPerReceipt: analytics.totalReceipts > 0
            ? (analytics.totalRelationships / analytics.totalReceipts).toFixed(2)
            : 0,
          graphConnectivity: analytics.totalReceipts > 0
            ? ((analytics.totalReceipts - analytics.orphanedReceipts.count) / analytics.totalReceipts * 100).toFixed(1) + '%'
            : '0%'
        }
      },
      integrity,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(
      createSuccessResponse(responseData, {
        platform: 'Receipt Graph Infrastructure',
        feature: 'Graph analytics',
        validation: 'Enterprise graph insights'
      })
    )
  } catch (error) {
    console.error('Receipt graph analytics error:', error)
    return NextResponse.json(
      createErrorResponse(
        'Failed to get receipt graph analytics',
        'GRAPH_ANALYTICS_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    )
  }
}
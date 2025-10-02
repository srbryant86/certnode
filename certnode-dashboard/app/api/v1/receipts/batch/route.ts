/**
 * Batch Operations API
 *
 * Process multiple receipt operations in a single API call.
 * Handles partial failures gracefully and returns detailed results for each operation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { createSuccessResponse, createErrorResponse, QualityProfiles } from '@/lib/api-response-helpers'
import { createReceiptWithGraph } from '@/lib/graph/receipt-graph-service'
import { RelationType } from '@prisma/client'
import crypto from 'crypto'

interface BatchReceiptInput {
  type: 'transaction' | 'content' | 'ops'
  data: any
  parentReceipts?: Array<{
    receiptId: string
    relationType: RelationType
    description?: string
    metadata?: Record<string, unknown>
  }>
}

interface BatchRequest {
  receipts: BatchReceiptInput[]
  options?: {
    stopOnError?: boolean  // Stop processing if one fails
    parallel?: boolean      // Process in parallel (default: true)
  }
}

interface BatchResult {
  index: number
  success: boolean
  receiptId?: string
  error?: {
    message: string
    code: string
  }
  data?: {
    id: string
    type: string
    graphDepth: number
    createdAt: string
  }
}

interface BatchResponse {
  success: boolean
  processed: number
  succeeded: number
  failed: number
  results: BatchResult[]
  processingTimeMs: number
  errors?: {
    summary: string
    details: Array<{ index: number; message: string }>
  }
}

/**
 * POST /api/v1/receipts/batch
 *
 * Create multiple receipts in a single request
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

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

    const body: BatchRequest = await request.json()
    const { receipts, options = {} } = body
    const { stopOnError = false, parallel = true } = options

    // Validate input
    if (!receipts || !Array.isArray(receipts)) {
      return NextResponse.json(
        createErrorResponse(
          'receipts array is required',
          'INVALID_INPUT',
          QualityProfiles.enterprise
        ),
        { status: 400 }
      )
    }

    if (receipts.length === 0) {
      return NextResponse.json(
        createErrorResponse(
          'receipts array must contain at least one receipt',
          'EMPTY_BATCH',
          QualityProfiles.enterprise
        ),
        { status: 400 }
      )
    }

    if (receipts.length > 1000) {
      return NextResponse.json(
        createErrorResponse(
          'Maximum 1,000 receipts per batch. For larger batches, split into multiple requests.',
          'BATCH_TOO_LARGE',
          QualityProfiles.enterprise
        ),
        { status: 400 }
      )
    }

    // Process receipts
    const results: BatchResult[] = []
    let succeeded = 0
    let failed = 0

    if (parallel) {
      // Process in parallel for better performance
      const promises = receipts.map(async (receipt, index) => {
        try {
          // Validate receipt type
          if (!['transaction', 'content', 'ops'].includes(receipt.type)) {
            return {
              index,
              success: false,
              error: {
                message: `Invalid receipt type: ${receipt.type}. Must be transaction, content, or ops`,
                code: 'INVALID_TYPE'
              }
            }
          }

          // Validate data
          if (!receipt.data) {
            return {
              index,
              success: false,
              error: {
                message: 'Receipt data is required',
                code: 'MISSING_DATA'
              }
            }
          }

          // Create receipt
          const created = await createReceiptWithGraph({
            enterpriseId: authResult.enterpriseId!,
            type: receipt.type,
            data: receipt.data,
            parentReceipts: receipt.parentReceipts?.map(p => ({
              receiptId: p.receiptId,
              relationType: p.relationType,
              description: p.description,
              metadata: p.metadata
            })),
            createdBy: authResult.user?.id
          })

          return {
            index,
            success: true,
            receiptId: created.id,
            data: {
              id: created.id,
              type: created.type,
              graphDepth: created.graphDepth,
              createdAt: created.createdAt.toISOString()
            }
          }
        } catch (error) {
          return {
            index,
            success: false,
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
              code: 'CREATION_FAILED'
            }
          }
        }
      })

      const batchResults = await Promise.all(promises)
      results.push(...batchResults)

      // Count successes and failures
      succeeded = batchResults.filter(r => r.success).length
      failed = batchResults.filter(r => !r.success).length

    } else {
      // Process sequentially
      for (let index = 0; index < receipts.length; index++) {
        const receipt = receipts[index]

        try {
          // Validate receipt type
          if (!['transaction', 'content', 'ops'].includes(receipt.type)) {
            results.push({
              index,
              success: false,
              error: {
                message: `Invalid receipt type: ${receipt.type}. Must be transaction, content, or ops`,
                code: 'INVALID_TYPE'
              }
            })
            failed++

            if (stopOnError) break
            continue
          }

          // Validate data
          if (!receipt.data) {
            results.push({
              index,
              success: false,
              error: {
                message: 'Receipt data is required',
                code: 'MISSING_DATA'
              }
            })
            failed++

            if (stopOnError) break
            continue
          }

          // Create receipt
          const created = await createReceiptWithGraph({
            enterpriseId: authResult.enterpriseId!,
            type: receipt.type,
            data: receipt.data,
            parentReceipts: receipt.parentReceipts?.map(p => ({
              receiptId: p.receiptId,
              relationType: p.relationType,
              description: p.description,
              metadata: p.metadata
            })),
            createdBy: authResult.user?.id
          })

          results.push({
            index,
            success: true,
            receiptId: created.id,
            data: {
              id: created.id,
              type: created.type,
              graphDepth: created.graphDepth,
              createdAt: created.createdAt.toISOString()
            }
          })
          succeeded++

        } catch (error) {
          results.push({
            index,
            success: false,
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
              code: 'CREATION_FAILED'
            }
          })
          failed++

          if (stopOnError) break
        }
      }
    }

    const processingTimeMs = Date.now() - startTime

    // Build response
    const response: BatchResponse = {
      success: failed === 0,
      processed: results.length,
      succeeded,
      failed,
      results,
      processingTimeMs
    }

    // Add error summary if there were failures
    if (failed > 0) {
      const errorDetails = results
        .filter(r => !r.success)
        .map(r => ({
          index: r.index,
          message: r.error?.message || 'Unknown error'
        }))

      response.errors = {
        summary: `${failed} of ${results.length} receipts failed`,
        details: errorDetails
      }
    }

    const statusCode = failed === 0 ? 201 : (succeeded === 0 ? 400 : 207) // 207 = Multi-Status

    return NextResponse.json(
      createSuccessResponse(response, {
        platform: 'Batch Operations',
        feature: 'Bulk receipt creation',
        validation: `${succeeded} succeeded, ${failed} failed`
      }),
      { status: statusCode }
    )

  } catch (error) {
    console.error('Batch operation error:', error)

    return NextResponse.json(
      createErrorResponse(
        'Batch operation failed',
        'BATCH_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/receipts/batch
 *
 * Get information about batch operations
 */
export async function GET(request: NextRequest) {
  try {
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

    const info = {
      service: 'Batch Operations',
      version: '1.0.0',
      description: 'Process multiple receipt operations in a single API call',
      limits: {
        maxBatchSize: 1000,
        recommendedBatchSize: 100,
        timeoutSeconds: 120
      },
      features: [
        'Parallel processing for better performance',
        'Partial failure handling (some succeed, some fail)',
        'Stop-on-error option for critical operations',
        'Support for all three receipt types',
        'Graph relationships (link receipts to parents)',
        'Detailed results for each receipt'
      ],
      useCases: [
        'Bulk import historical data',
        'Migrate from other systems',
        'Batch daily transactions',
        'Generate receipts from ETL pipelines'
      ],
      options: {
        stopOnError: 'Stop processing if one receipt fails (default: false)',
        parallel: 'Process receipts in parallel for speed (default: true)'
      },
      example: {
        request: {
          receipts: [
            { type: 'transaction', data: { amount: 100 } },
            { type: 'content', data: { hash: 'sha256:abc' } }
          ],
          options: { parallel: true }
        },
        response: {
          succeeded: 2,
          failed: 0,
          processingTimeMs: 847
        }
      }
    }

    return NextResponse.json(
      createSuccessResponse(info, {
        platform: 'Batch Operations',
        feature: 'API documentation',
        validation: 'Information endpoint'
      })
    )

  } catch (error) {
    console.error('Batch info error:', error)
    return NextResponse.json(
      createErrorResponse(
        'Failed to get batch operation information',
        'INFO_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    )
  }
}

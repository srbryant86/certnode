/**
 * Webhook Management API (Individual Webhook)
 *
 * Get, update, or delete a specific webhook.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { createSuccessResponse, createErrorResponse, QualityProfiles } from '@/lib/api-response-helpers'
import { WebhookEvent } from '@/lib/webhooks/webhook-service'
import { prisma } from '@/lib/prisma'

const VALID_EVENTS: WebhookEvent[] = [
  'receipt.created',
  'receipt.verified',
  'fraud.detected',
  'content.flagged',
  'compliance.alert',
  'graph.linked'
]

/**
 * GET /api/v1/webhooks/{id}
 *
 * Get webhook details including recent deliveries
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const webhook = await prisma.webhook.findFirst({
      where: {
        id: params.id,
        enterpriseId: authResult.enterpriseId!
      },
      include: {
        deliveries: {
          take: 10,
          orderBy: { deliveredAt: 'desc' }
        }
      }
    })

    if (!webhook) {
      return NextResponse.json(
        createErrorResponse(
          'Webhook not found',
          'WEBHOOK_NOT_FOUND',
          QualityProfiles.enterprise
        ),
        { status: 404 }
      )
    }

    return NextResponse.json(
      createSuccessResponse({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events as string[], // Cast from JSON
        enabled: webhook.enabled,
        description: webhook.description,
        createdAt: webhook.createdAt.toISOString(),
        updatedAt: webhook.updatedAt.toISOString(),
        recentDeliveries: webhook.deliveries.map(d => ({
          id: d.id,
          event: d.event,
          success: d.success,
          statusCode: d.statusCode,
          error: d.error,
          attemptNumber: d.attemptNumber,
          deliveredAt: d.deliveredAt.toISOString()
        }))
      }, {
        platform: 'Webhooks',
        feature: 'Webhook details',
        validation: 'Webhook found'
      })
    )

  } catch (error) {
    console.error('Webhook get error:', error)

    return NextResponse.json(
      createErrorResponse(
        'Failed to get webhook',
        'WEBHOOK_GET_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/v1/webhooks/{id}
 *
 * Update webhook configuration
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()
    const { url, events, enabled, description } = body

    // Validate events if provided
    if (events) {
      if (!Array.isArray(events) || events.length === 0) {
        return NextResponse.json(
          createErrorResponse(
            'events must be a non-empty array',
            'INVALID_EVENTS',
            QualityProfiles.enterprise
          ),
          { status: 400 }
        )
      }

      const invalidEvents = events.filter((e: string) => !VALID_EVENTS.includes(e as WebhookEvent))
      if (invalidEvents.length > 0) {
        return NextResponse.json(
          createErrorResponse(
            `Invalid events: ${invalidEvents.join(', ')}`,
            'INVALID_EVENTS',
            QualityProfiles.enterprise
          ),
          { status: 400 }
        )
      }
    }

    // Validate URL if provided
    if (url) {
      try {
        new URL(url)
      } catch {
        return NextResponse.json(
          createErrorResponse(
            'Invalid URL format',
            'INVALID_URL',
            QualityProfiles.enterprise
          ),
          { status: 400 }
        )
      }
    }

    // Update webhook
    const webhook = await prisma.webhook.updateMany({
      where: {
        id: params.id,
        enterpriseId: authResult.enterpriseId!
      },
      data: {
        ...(url && { url }),
        ...(events && { events: events as any }), // Cast to JSON
        ...(enabled !== undefined && { enabled }),
        ...(description !== undefined && { description })
      }
    })

    if (webhook.count === 0) {
      return NextResponse.json(
        createErrorResponse(
          'Webhook not found',
          'WEBHOOK_NOT_FOUND',
          QualityProfiles.enterprise
        ),
        { status: 404 }
      )
    }

    // Fetch updated webhook
    const updated = await prisma.webhook.findUnique({
      where: { id: params.id }
    })

    return NextResponse.json(
      createSuccessResponse({
        id: updated!.id,
        url: updated!.url,
        events: updated!.events as string[], // Cast from JSON
        enabled: updated!.enabled,
        description: updated!.description,
        updatedAt: updated!.updatedAt.toISOString()
      }, {
        platform: 'Webhooks',
        feature: 'Webhook update',
        validation: 'Webhook updated'
      })
    )

  } catch (error) {
    console.error('Webhook update error:', error)

    return NextResponse.json(
      createErrorResponse(
        'Failed to update webhook',
        'WEBHOOK_UPDATE_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/webhooks/{id}
 *
 * Delete a webhook
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const deleted = await prisma.webhook.deleteMany({
      where: {
        id: params.id,
        enterpriseId: authResult.enterpriseId!
      }
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        createErrorResponse(
          'Webhook not found',
          'WEBHOOK_NOT_FOUND',
          QualityProfiles.enterprise
        ),
        { status: 404 }
      )
    }

    return NextResponse.json(
      createSuccessResponse({
        deleted: true,
        id: params.id
      }, {
        platform: 'Webhooks',
        feature: 'Webhook deletion',
        validation: 'Webhook deleted'
      })
    )

  } catch (error) {
    console.error('Webhook delete error:', error)

    return NextResponse.json(
      createErrorResponse(
        'Failed to delete webhook',
        'WEBHOOK_DELETE_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    )
  }
}

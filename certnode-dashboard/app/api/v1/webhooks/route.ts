/**
 * Webhooks Management API
 *
 * Configure and manage webhook subscriptions for real-time event notifications.
 *
 * NOTE: Requires database migration - see prisma/migrations/TODO_ADD_WEBHOOK_MODELS.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { createSuccessResponse, createErrorResponse, QualityProfiles } from '@/lib/api-response-helpers'
import { testWebhook, WebhookEvent } from '@/lib/webhooks/webhook-service'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

interface CreateWebhookRequest {
  url: string
  events: WebhookEvent[]
  description?: string
}

const VALID_EVENTS: WebhookEvent[] = [
  'receipt.created',
  'receipt.verified',
  'fraud.detected',
  'content.flagged',
  'compliance.alert',
  'graph.linked'
]

/**
 * POST /api/v1/webhooks
 *
 * Create a new webhook subscription
 */
export async function POST(request: NextRequest) {
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

    const body: CreateWebhookRequest = await request.json()
    const { url, events, description } = body

    // Validate URL
    if (!url) {
      return NextResponse.json(
        createErrorResponse(
          'url is required',
          'MISSING_URL',
          QualityProfiles.enterprise
        ),
        { status: 400 }
      )
    }

    try {
      new URL(url) // Validate URL format
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

    // Validate events
    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        createErrorResponse(
          'events array is required and must contain at least one event',
          'MISSING_EVENTS',
          QualityProfiles.enterprise
        ),
        { status: 400 }
      )
    }

    const invalidEvents = events.filter(e => !VALID_EVENTS.includes(e))
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        createErrorResponse(
          `Invalid events: ${invalidEvents.join(', ')}. Valid events: ${VALID_EVENTS.join(', ')}`,
          'INVALID_EVENTS',
          QualityProfiles.enterprise
        ),
        { status: 400 }
      )
    }

    // Generate webhook secret
    const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`

    // Test webhook before saving
    const testResult = await testWebhook(url, secret)
    if (!testResult.success) {
      return NextResponse.json(
        createErrorResponse(
          `Webhook test failed: ${testResult.error || 'No response from URL'}. Please verify the URL is accessible and returns 200 OK.`,
          'WEBHOOK_TEST_FAILED',
          QualityProfiles.enterprise
        ),
        { status: 400 }
      )
    }

    // Create webhook
    const webhook = await prisma.webhook.create({
      data: {
        enterpriseId: authResult.enterpriseId!,
        url,
        secret,
        events: events as any, // Stored as JSON array
        description: description || null,
        enabled: true
      }
    })

    return NextResponse.json(
      createSuccessResponse({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events as string[], // Cast from JSON
        enabled: webhook.enabled,
        description: webhook.description,
        secret: webhook.secret, // Only returned on creation
        createdAt: webhook.createdAt.toISOString(),
        testResult: {
          success: true,
          statusCode: testResult.statusCode
        }
      }, {
        platform: 'Webhooks',
        feature: 'Real-time event notifications',
        validation: 'Webhook created and tested'
      }),
      { status: 201 }
    )

  } catch (error) {
    console.error('Webhook creation error:', error)

    // Handle Prisma errors (e.g., if models don't exist yet)
    if (error instanceof Error && error.message.includes('does not exist')) {
      return NextResponse.json(
        createErrorResponse(
          'Webhook database models not yet migrated. See prisma/migrations/TODO_ADD_WEBHOOK_MODELS.md',
          'MIGRATION_REQUIRED',
          QualityProfiles.enterprise
        ),
        { status: 501 } // Not Implemented
      )
    }

    return NextResponse.json(
      createErrorResponse(
        'Failed to create webhook',
        'WEBHOOK_CREATION_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/webhooks
 *
 * List all webhooks for the enterprise
 */
export async function GET(request: NextRequest) {
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

    const webhooks = await prisma.webhook.findMany({
      where: {
        enterpriseId: authResult.enterpriseId!
      },
      include: {
        _count: {
          select: {
            deliveries: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const response = webhooks.map(webhook => ({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events as string[], // Cast from JSON
      enabled: webhook.enabled,
      description: webhook.description,
      deliveryCount: webhook._count.deliveries,
      createdAt: webhook.createdAt.toISOString(),
      // Don't return secret in list view for security
    }))

    return NextResponse.json(
      createSuccessResponse({
        webhooks: response,
        total: webhooks.length
      }, {
        platform: 'Webhooks',
        feature: 'Webhook management',
        validation: `${webhooks.length} webhooks configured`
      })
    )

  } catch (error) {
    console.error('Webhook list error:', error)

    if (error instanceof Error && error.message.includes('does not exist')) {
      return NextResponse.json(
        createErrorResponse(
          'Webhook database models not yet migrated. See prisma/migrations/TODO_ADD_WEBHOOK_MODELS.md',
          'MIGRATION_REQUIRED',
          QualityProfiles.enterprise
        ),
        { status: 501 }
      )
    }

    return NextResponse.json(
      createErrorResponse(
        'Failed to list webhooks',
        'WEBHOOK_LIST_ERROR',
        QualityProfiles.enterprise
      ),
      { status: 500 }
    )
  }
}

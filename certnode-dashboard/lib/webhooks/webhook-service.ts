/**
 * Webhook Service
 *
 * Handles webhook delivery with HMAC signatures, retry logic, and event routing.
 */

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export type WebhookEvent =
  | 'receipt.created'
  | 'receipt.verified'
  | 'fraud.detected'
  | 'content.flagged'
  | 'compliance.alert'
  | 'graph.linked'

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: Record<string, unknown>
  enterpriseId: string
}

export interface WebhookDeliveryResult {
  success: boolean
  statusCode?: number
  responseBody?: string
  error?: string
  attemptNumber: number
  deliveredAt: string
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = generateWebhookSignature(payload, secret)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

/**
 * Deliver webhook with retry logic
 */
export async function deliverWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string,
  maxRetries: number = 3
): Promise<WebhookDeliveryResult> {
  const payloadString = JSON.stringify(payload)
  const signature = generateWebhookSignature(payloadString, secret)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CertNode-Signature': `sha256=${signature}`,
          'X-CertNode-Event': payload.event,
          'X-CertNode-Delivery': crypto.randomUUID(),
          'User-Agent': 'CertNode-Webhooks/1.0'
        },
        body: payloadString,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      const responseBody = await response.text()

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status,
          responseBody: responseBody.substring(0, 1000), // Limit size
          attemptNumber: attempt,
          deliveredAt: new Date().toISOString()
        }
      }

      // Non-200 response, retry if not last attempt
      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000 // Exponential backoff: 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }

      return {
        success: false,
        statusCode: response.status,
        responseBody: responseBody.substring(0, 1000),
        error: `HTTP ${response.status}`,
        attemptNumber: attempt,
        deliveredAt: new Date().toISOString()
      }

    } catch (error) {
      // Network error, retry if not last attempt
      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        attemptNumber: attempt,
        deliveredAt: new Date().toISOString()
      }
    }
  }

  // Should never reach here, but TypeScript wants a return
  return {
    success: false,
    error: 'Max retries exceeded',
    attemptNumber: maxRetries,
    deliveredAt: new Date().toISOString()
  }
}

/**
 * Fire webhook for an event
 * Looks up all webhooks subscribed to this event and delivers them
 */
export async function fireWebhook(
  enterpriseId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  // Get all webhooks for this enterprise subscribed to this event
  const webhooks = await prisma.webhook.findMany({
    where: {
      enterpriseId,
      enabled: true,
      events: {
        has: event
      }
    }
  })

  if (webhooks.length === 0) {
    return // No webhooks configured
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
    enterpriseId
  }

  // Deliver webhooks in parallel
  const deliveries = webhooks.map(async webhook => {
    const result = await deliverWebhook(webhook.url, payload, webhook.secret)

    // Log delivery attempt
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event,
        payload,
        success: result.success,
        statusCode: result.statusCode,
        responseBody: result.responseBody,
        error: result.error,
        attemptNumber: result.attemptNumber,
        deliveredAt: new Date(result.deliveredAt)
      }
    })

    // Disable webhook if it keeps failing
    if (!result.success) {
      // Get recent deliveries
      const recentFailures = await prisma.webhookDelivery.count({
        where: {
          webhookId: webhook.id,
          success: false,
          deliveredAt: {
            gte: new Date(Date.now() - 3600000) // Last hour
          }
        }
      })

      // Disable after 10 consecutive failures
      if (recentFailures >= 10) {
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: { enabled: false }
        })
      }
    }
  })

  await Promise.all(deliveries)
}

/**
 * Test webhook by sending a ping event
 */
export async function testWebhook(
  url: string,
  secret: string
): Promise<WebhookDeliveryResult> {
  const payload: WebhookPayload = {
    event: 'receipt.created',
    timestamp: new Date().toISOString(),
    data: {
      test: true,
      message: 'This is a test webhook from CertNode'
    },
    enterpriseId: 'test'
  }

  return deliverWebhook(url, payload, secret, 1) // Single attempt for tests
}

import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

import { authenticateApiKey } from '@/lib/api-auth'
import { createErrorResponse, createSuccessResponse, QualityProfiles } from '@/lib/api-response-helpers'
import { processIntegrationInstructions } from '@/lib/integrations/orchestrator'
import { registerIntegrationEvent } from '@/lib/integrations/ledger'
import { mapShopifyEvent } from '@/lib/integrations/providers/shopify'

function verifyShopifySignature(rawBody: string, secret: string, providedSignature: string | null): boolean {
  if (!providedSignature) {
    return false
  }

  const computed = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64')

  const providedBuffer = Buffer.from(providedSignature, 'base64')
  const computedBuffer = Buffer.from(computed, 'base64')

  if (providedBuffer.length !== computedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(providedBuffer, computedBuffer)
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const apiKey = request.headers.get('x-api-key')
  const providedSignature = request.headers.get('x-shopify-hmac-sha256')

  if (!apiKey) {
    return NextResponse.json(
      createErrorResponse('Missing API key header', 'AUTHENTICATION_FAILED', QualityProfiles.enterprise),
      { status: 401 },
    )
  }

  if (!verifyShopifySignature(rawBody, apiKey, providedSignature)) {
    return NextResponse.json(
      createErrorResponse('Invalid Shopify signature', 'SIGNATURE_INVALID', QualityProfiles.enterprise),
      { status: 401 },
    )
  }

  let payload: Record<string, unknown>
  try {
    const parsed = rawBody.length > 0 ? JSON.parse(rawBody) : {}
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json(
        createErrorResponse('Shopify payload must be a JSON object', 'INVALID_PAYLOAD', QualityProfiles.enterprise),
        { status: 400 },
      )
    }
    payload = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json(
      createErrorResponse('Invalid JSON payload', 'INVALID_PAYLOAD', QualityProfiles.enterprise),
      { status: 400 },
    )
  }

  const authResult = await authenticateApiKey(request)
  if (!authResult.success || !authResult.enterpriseId) {
    return NextResponse.json(
      createErrorResponse('API key authentication failed', 'AUTHENTICATION_FAILED', QualityProfiles.enterprise),
      { status: 401 },
    )
  }

  const topic = request.headers.get('x-shopify-topic') ?? 'unknown'
  const shopDomain = request.headers.get('x-shopify-shop-domain') ?? 'unknown'

  const normalized = mapShopifyEvent(topic, payload)
  const eventExternalId = normalized.externalId

  try {
    const registration = await registerIntegrationEvent({
      enterpriseId: authResult.enterpriseId,
      provider: 'shopify',
      providerEvent: topic,
      externalId: eventExternalId,
      payload,
    })

    if (registration.deduped) {
      const receiptRefs = Array.isArray(registration.entry.receiptRefs)
        ? (registration.entry.receiptRefs as unknown[]).map(value => String(value))
        : []

      return NextResponse.json(
        createSuccessResponse(
          {
            provider: 'shopify',
            providerEvent: topic,
            shopDomain,
            receiptIds: receiptRefs,
            deduplicated: true,
          },
          QualityProfiles.enterprise,
        ),
      )
    }

    const result = await processIntegrationInstructions({
      enterpriseId: authResult.enterpriseId,
      provider: 'shopify',
      providerEvent: topic,
      ledgerId: registration.entry.id,
      instructions: normalized.instructions,
    })

    return NextResponse.json(
      createSuccessResponse(
        {
          provider: 'shopify',
          providerEvent: topic,
          shopDomain,
          receiptIds: result.receiptIds,
          deduplicated: false,
        },
        QualityProfiles.enterprise,
      ),
      { status: 202 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Shopify integration processing failed'
    return NextResponse.json(
      createErrorResponse(message, 'INTEGRATION_ERROR', QualityProfiles.enterprise),
      { status: 500 },
    )
  }
}

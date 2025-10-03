import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

import { authenticateApiKey } from '@/lib/api-auth'
import { createErrorResponse, createSuccessResponse, QualityProfiles } from '@/lib/api-response-helpers'
import { processIntegrationInstructions } from '@/lib/integrations/orchestrator'
import { registerIntegrationEvent } from '@/lib/integrations/ledger'
import { mapStripeEvent } from '@/lib/integrations/providers/stripe'

type StripeEventPayload = {
  id?: string
  type?: string
  data?: {
    object?: Record<string, unknown>
    previous_attributes?: Record<string, unknown>
  }
}

function verifyStripeSignature(rawBody: string, secret: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) {
    return false
  }

  const elements = signatureHeader.split(',')
  let timestamp: string | undefined
  let signature: string | undefined

  for (const element of elements) {
    const [key, value] = element.split('=')
    if (key === 't') {
      timestamp = value
    } else if (key === 'v1') {
      signature = value
    }
  }

  if (!timestamp || !signature) {
    return false
  }

  const signedPayload = `${timestamp}.${rawBody}`
  const expected = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex')

  try {
    const expectedBuffer = Buffer.from(expected, 'hex')
    const signatureBuffer = Buffer.from(signature, 'hex')
    if (expectedBuffer.length !== signatureBuffer.length) {
      return false
    }
    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const apiKey = request.headers.get('x-api-key')
  const signature = request.headers.get('stripe-signature')

  if (!apiKey) {
    return NextResponse.json(
      createErrorResponse('Missing API key header', 'AUTHENTICATION_FAILED', QualityProfiles.enterprise),
      { status: 401 },
    )
  }

  if (!verifyStripeSignature(rawBody, apiKey, signature)) {
    return NextResponse.json(
      createErrorResponse('Invalid Stripe signature', 'SIGNATURE_INVALID', QualityProfiles.enterprise),
      { status: 401 },
    )
  }

  let payload: StripeEventPayload
  try {
    payload = rawBody.length > 0 ? (JSON.parse(rawBody) as StripeEventPayload) : {}
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

  const normalized = mapStripeEvent(payload)

  try {
    const registration = await registerIntegrationEvent({
      enterpriseId: authResult.enterpriseId,
      provider: 'stripe',
      providerEvent: payload.type ?? 'unknown',
      externalId: normalized.externalId,
      payload,
    })

    if (registration.deduped) {
      const receiptRefs = Array.isArray(registration.entry.receiptRefs)
        ? (registration.entry.receiptRefs as unknown[]).map(value => String(value))
        : []

      return NextResponse.json(
        createSuccessResponse(
          {
            provider: 'stripe',
            providerEvent: payload.type ?? 'unknown',
            receiptIds: receiptRefs,
            deduplicated: true,
          },
          QualityProfiles.enterprise,
        ),
      )
    }

    const result = await processIntegrationInstructions({
      enterpriseId: authResult.enterpriseId,
      provider: 'stripe',
      providerEvent: payload.type ?? 'unknown',
      ledgerId: registration.entry.id,
      instructions: normalized.instructions,
    })

    return NextResponse.json(
      createSuccessResponse(
        {
          provider: 'stripe',
          providerEvent: payload.type ?? 'unknown',
          receiptIds: result.receiptIds,
          deduplicated: false,
        },
        QualityProfiles.enterprise,
      ),
      { status: 202 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe integration processing failed'
    return NextResponse.json(
      createErrorResponse(message, 'INTEGRATION_ERROR', QualityProfiles.enterprise),
      { status: 500 },
    )
  }
}

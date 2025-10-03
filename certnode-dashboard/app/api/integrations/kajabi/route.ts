import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

import { authenticateApiKey } from '@/lib/api-auth'
import { createErrorResponse, createSuccessResponse, QualityProfiles } from '@/lib/api-response-helpers'
import { processIntegrationInstructions } from '@/lib/integrations/orchestrator'
import { registerIntegrationEvent } from '@/lib/integrations/ledger'
import { mapKajabiEvent } from '@/lib/integrations/providers/kajabi'

function verifyKajabiSignature(rawBody: string, secret: string, signature: string | null): boolean {
  if (!signature) {
    return false
  }

  const trimmedSignature = signature.trim()

  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(rawBody, 'utf8')
  const digestHex = hmac.digest('hex')

  if (trimmedSignature.toLowerCase() === digestHex.toLowerCase()) {
    return true
  }

  const digestBase64 = Buffer.from(digestHex, 'hex').toString('base64')
  return trimmedSignature === digestBase64
}

function ensureObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const apiKey = request.headers.get('x-api-key')
  const signature =
    request.headers.get('x-kajabi-signature') ??
    request.headers.get('x-kajabi-signature-256') ??
    request.headers.get('x-kajabi-hmac-sha256') ??
    null

  if (!apiKey) {
    return NextResponse.json(
      createErrorResponse('Missing API key header', 'AUTHENTICATION_FAILED', QualityProfiles.enterprise),
      { status: 401 },
    )
  }

  if (!verifyKajabiSignature(rawBody, apiKey, signature)) {
    return NextResponse.json(
      createErrorResponse('Invalid Kajabi signature', 'SIGNATURE_INVALID', QualityProfiles.enterprise),
      { status: 401 },
    )
  }

  let parsedBody: Record<string, unknown>
  try {
    const parsed = rawBody.length > 0 ? JSON.parse(rawBody) : {}
    parsedBody = ensureObject(parsed)
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

  const eventType = typeof parsedBody['type'] === 'string'
    ? (parsedBody['type'] as string)
    : typeof parsedBody['event'] === 'string'
      ? (parsedBody['event'] as string)
      : 'unknown'

  const dataPayload = ensureObject(parsedBody['data'])
  const normalized = mapKajabiEvent(eventType, Object.keys(dataPayload).length > 0 ? dataPayload : parsedBody)

  try {
    const registration = await registerIntegrationEvent({
      enterpriseId: authResult.enterpriseId,
      provider: 'kajabi',
      providerEvent: eventType,
      externalId: normalized.externalId,
      payload: parsedBody,
    })

    if (registration.deduped) {
      const receiptRefs = Array.isArray(registration.entry.receiptRefs)
        ? (registration.entry.receiptRefs as unknown[]).map(value => String(value))
        : []

      return NextResponse.json(
        createSuccessResponse(
          {
            provider: 'kajabi',
            providerEvent: eventType,
            receiptIds: receiptRefs,
            deduplicated: true,
          },
          QualityProfiles.enterprise,
        ),
      )
    }

    const result = await processIntegrationInstructions({
      enterpriseId: authResult.enterpriseId,
      provider: 'kajabi',
      providerEvent: eventType,
      ledgerId: registration.entry.id,
      instructions: normalized.instructions,
    })

    return NextResponse.json(
      createSuccessResponse(
        {
          provider: 'kajabi',
          providerEvent: eventType,
          receiptIds: result.receiptIds,
          deduplicated: false,
        },
        QualityProfiles.enterprise,
      ),
      { status: 202 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kajabi integration processing failed'
    return NextResponse.json(
      createErrorResponse(message, 'INTEGRATION_ERROR', QualityProfiles.enterprise),
      { status: 500 },
    )
  }
}

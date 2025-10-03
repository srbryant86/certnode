import crypto from 'crypto'
import { IntegrationEventStatus, type IntegrationEventLedger } from '@prisma/client'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

import type { IntegrationEventInput } from './types'

export interface LedgerRegistrationResult {
  entry: IntegrationEventLedger
  deduped: boolean
}

export async function registerIntegrationEvent(input: IntegrationEventInput): Promise<LedgerRegistrationResult> {
  const checksum = crypto
    .createHash('sha256')
    .update(JSON.stringify(input.payload ?? {}))
    .digest('hex')

  const existing = await prisma.integrationEventLedger.findUnique({
    where: {
      enterpriseId_provider_externalId_checksum: {
        enterpriseId: input.enterpriseId,
        provider: input.provider,
        externalId: input.externalId,
        checksum,
      },
    },
  })

  if (existing) {
    if (existing.status === IntegrationEventStatus.PROCESSED || existing.status === IntegrationEventStatus.REPLAYED) {
      return { entry: existing, deduped: true }
    }

    const updated = await prisma.integrationEventLedger.update({
      where: { id: existing.id },
      data: {
        status: IntegrationEventStatus.RECEIVED,
        error: null,
        payload: input.payload as Prisma.JsonValue,
        providerEvent: input.providerEvent,
        retries: existing.retries + 1,
      },
    })

    return { entry: updated, deduped: false }
  }

  const entry = await prisma.integrationEventLedger.create({
    data: {
      enterpriseId: input.enterpriseId,
      provider: input.provider,
      providerEvent: input.providerEvent,
      externalId: input.externalId,
      payload: input.payload as Prisma.JsonValue,
      checksum,
      status: IntegrationEventStatus.RECEIVED,
    },
  })

  return { entry, deduped: false }
}

export async function markIntegrationEventProcessed(eventId: string, receiptIds: string[]): Promise<void> {
  await prisma.integrationEventLedger.update({
    where: { id: eventId },
    data: {
      status: IntegrationEventStatus.PROCESSED,
      receiptRefs: receiptIds as unknown as Prisma.JsonArray,
      error: null,
    },
  })
}

export async function markIntegrationEventFailed(eventId: string, error: string): Promise<void> {
  await prisma.integrationEventLedger.update({
    where: { id: eventId },
    data: {
      status: IntegrationEventStatus.FAILED,
      error,
      retries: { increment: 1 },
    },
  })
}

export async function upsertIntegrationIndex(params: {
  enterpriseId: string
  provider: string
  externalId: string
  receiptId: string
  eventId: string
}): Promise<void> {
  await prisma.integrationEventIndex.upsert({
    where: {
      enterpriseId_provider_externalId: {
        enterpriseId: params.enterpriseId,
        provider: params.provider,
        externalId: params.externalId,
      },
    },
    create: {
      enterpriseId: params.enterpriseId,
      provider: params.provider,
      externalId: params.externalId,
      receiptId: params.receiptId,
      lastEventId: params.eventId,
    },
    update: {
      receiptId: params.receiptId,
      lastEventId: params.eventId,
      lastSeenAt: new Date(),
    },
  })
}

export async function lookupReceiptByExternalId(params: {
  enterpriseId: string
  provider: string
  externalId: string
}) {
  return prisma.integrationEventIndex.findUnique({
    where: {
      enterpriseId_provider_externalId: {
        enterpriseId: params.enterpriseId,
        provider: params.provider,
        externalId: params.externalId,
      },
    },
  })
}


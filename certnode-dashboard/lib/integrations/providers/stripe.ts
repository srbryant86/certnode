import crypto from 'crypto'
import { RelationType } from '@prisma/client'

import type { ReceiptInstruction } from '../types'

type StripeRecord = Record<string, unknown>

type StripeEvent = {
  id?: string
  type?: string
  data?: {
    object?: StripeRecord
    previous_attributes?: StripeRecord
  }
}

type StripeParseResult = {
  externalId: string
  instructions: ReceiptInstruction[]
}

function normalizeId(prefix: string, value: string | undefined): string {
  return `${prefix}:${value ?? crypto.randomUUID()}`
}

function toStringValue(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value)
  }
  return undefined
}

function toNumberValue(value: unknown, divisor = 1): number | undefined {
  if (typeof value === 'number') {
    return divisor !== 0 ? value / divisor : value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return divisor !== 0 ? parsed / divisor : parsed
    }
  }
  return undefined
}

function toBooleanValue(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }
  return undefined
}

function toRecord(value: unknown): StripeRecord | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as StripeRecord
  }
  return undefined
}

function definedKeys(...keys: Array<string | undefined>): string[] {
  return keys.filter((key): key is string => Boolean(key))
}

function buildRelations(keys: string[], relationType: RelationType): ReceiptInstruction['relations'] {
  if (keys.length === 0) {
    return undefined
  }
  return keys.map(key => ({
    externalId: key,
    relationType,
  }))
}

export function mapStripeEvent(event: StripeEvent): StripeParseResult {
  const instructions: ReceiptInstruction[] = []
  const eventId = toStringValue(event.id)
  const eventType = event.type ?? 'unknown'
  const normalizedType = eventType.toLowerCase()
  const stripeObject = toRecord(event.data?.object)

  if (!stripeObject) {
    return {
      externalId: normalizeId('stripe:event', eventId ?? normalizedType),
      instructions,
    }
  }

  switch (normalizedType) {
    case 'charge.succeeded': {
      const chargeId = toStringValue(stripeObject['id'])
      const customerId = toStringValue(stripeObject['customer'])
      const paymentIntentId = toStringValue(stripeObject['payment_intent'])
      const externalId = normalizeId('stripe:charge', chargeId)

      instructions.push({
        domain: 'transaction',
        externalId,
        indexKeys: definedKeys(
          chargeId ? `stripe:charge:${chargeId}` : undefined,
          customerId ? `stripe:customer:${customerId}` : undefined,
          paymentIntentId ? `stripe:payment_intent:${paymentIntentId}` : undefined,
        ),
        data: {
          chargeId,
          amount: toNumberValue(stripeObject['amount'], 100),
          currency: stripeObject['currency'],
          customerId,
          description: stripeObject['description'],
          paymentMethod: toStringValue(toRecord(stripeObject['payment_method_details'])?.['type']),
          status: stripeObject['status'],
          receiptUrl: stripeObject['receipt_url'],
          createdAt: stripeObject['created'] ? new Date(Number(stripeObject['created']) * 1000).toISOString() : undefined,
          raw: stripeObject,
        },
      })

      return {
        externalId: normalizeId('stripe:event', eventId ?? externalId),
        instructions,
      }
    }

    case 'charge.refunded': {
      const chargeId = toStringValue(stripeObject['id'])
      const refunds = Array.isArray(toRecord(stripeObject['refunds'])?.['data'])
        ? (toRecord(stripeObject['refunds'])?.['data'] as StripeRecord[])
        : []
      const primaryRefund = toRecord(refunds[0])
      const refundId = toStringValue(primaryRefund?.['id'])
      const externalId = normalizeId('stripe:refund', `${chargeId ?? 'charge'}:${refundId ?? eventId}`)

      instructions.push({
        domain: 'transaction',
        externalId,
        indexKeys: definedKeys(
          refundId ? `stripe:refund:${refundId}` : undefined,
          chargeId ? `stripe:charge:${chargeId}:refund` : undefined,
        ),
        relations: buildRelations(
          definedKeys(chargeId ? `stripe:charge:${chargeId}` : undefined),
          RelationType.AMENDS,
        ),
        data: {
          chargeId,
          refundId,
          amountRefunded: toNumberValue(stripeObject['amount_refunded'], 100),
          currency: stripeObject['currency'],
          reason: primaryRefund?.['reason'],
          status: primaryRefund?.['status'],
          raw: stripeObject,
        },
      })

      return {
        externalId: normalizeId('stripe:event', eventId ?? externalId),
        instructions,
      }
    }

    case 'charge.dispute.created':
    case 'charge.dispute.updated':
    case 'charge.dispute.closed': {
      const disputeId = toStringValue(stripeObject['id'])
      const chargeId = toStringValue(stripeObject['charge'])
      const status = stripeObject['status']
      const relationType = normalizedType.endsWith('created')
        ? RelationType.INVALIDATES
        : RelationType.AMENDS

      const externalId = normalizeId('stripe:dispute', disputeId ?? chargeId)

      instructions.push({
        domain: 'ops',
        externalId,
        indexKeys: definedKeys(
          disputeId ? `stripe:dispute:${disputeId}` : undefined,
          chargeId ? `stripe:charge:${chargeId}:dispute` : undefined,
        ),
        relations: buildRelations(
          definedKeys(chargeId ? `stripe:charge:${chargeId}` : undefined),
          relationType,
        ),
        data: {
          disputeId,
          chargeId,
          amount: toNumberValue(stripeObject['amount'], 100),
          currency: stripeObject['currency'],
          reason: stripeObject['reason'],
          status,
          raw: stripeObject,
        },
      })

      return {
        externalId: normalizeId('stripe:event', eventId ?? externalId),
        instructions,
      }
    }

    case 'payment_intent.succeeded': {
      const paymentIntentId = toStringValue(stripeObject['id'])
      const customerId = toStringValue(stripeObject['customer'])
      const chargeId = Array.isArray(stripeObject['charges'])
        ? undefined
        : toRecord(stripeObject['charges'])?.['data'] && Array.isArray((toRecord(stripeObject['charges'])?.['data']))
          ? toStringValue((toRecord(stripeObject['charges'])?.['data'] as StripeRecord[])[0]?.['id'])
          : undefined

      const externalId = normalizeId('stripe:payment_intent', paymentIntentId)

      instructions.push({
        domain: 'transaction',
        externalId,
        indexKeys: definedKeys(
          paymentIntentId ? `stripe:payment_intent:${paymentIntentId}` : undefined,
          customerId ? `stripe:customer:${customerId}` : undefined,
          chargeId ? `stripe:charge:${chargeId}` : undefined,
        ),
        data: {
          paymentIntentId,
          amount: toNumberValue(stripeObject['amount'], 100),
          currency: stripeObject['currency'],
          customerId,
          status: stripeObject['status'],
          raw: stripeObject,
        },
      })

      return {
        externalId: normalizeId('stripe:event', eventId ?? externalId),
        instructions,
      }
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscriptionId = toStringValue(stripeObject['id'])
      const customerId = toStringValue(stripeObject['customer'])
      const externalId = normalizeId('stripe:subscription', subscriptionId)
      const relationType = normalizedType.endsWith('created')
        ? RelationType.CAUSES
        : normalizedType.endsWith('deleted')
          ? RelationType.INVALIDATES
          : RelationType.AMENDS

      instructions.push({
        domain: normalizedType.endsWith('created') ? 'transaction' : 'ops',
        externalId,
        indexKeys: definedKeys(
          subscriptionId ? `stripe:subscription:${subscriptionId}` : undefined,
          customerId ? `stripe:customer:${customerId}` : undefined,
        ),
        relations: buildRelations(
          definedKeys(customerId ? `stripe:customer:${customerId}` : undefined),
          relationType,
        ),
        data: {
          subscriptionId,
          customerId,
          status: stripeObject['status'],
          cancelAtPeriodEnd: toBooleanValue(stripeObject['cancel_at_period_end']),
          raw: stripeObject,
        },
      })

      return {
        externalId: normalizeId('stripe:event', eventId ?? externalId),
        instructions,
      }
    }

    case 'invoice.payment_succeeded': {
      const invoiceId = toStringValue(stripeObject['id'])
      const subscriptionId = toStringValue(stripeObject['subscription'])
      const customerId = toStringValue(stripeObject['customer'])
      const externalId = normalizeId('stripe:invoice', invoiceId)

      instructions.push({
        domain: 'transaction',
        externalId,
        indexKeys: definedKeys(
          invoiceId ? `stripe:invoice:${invoiceId}` : undefined,
          subscriptionId ? `stripe:subscription:${subscriptionId}` : undefined,
          customerId ? `stripe:customer:${customerId}` : undefined,
        ),
        relations: buildRelations(
          definedKeys(subscriptionId ? `stripe:subscription:${subscriptionId}` : undefined),
          RelationType.FULFILLS,
        ),
        data: {
          invoiceId,
          subscriptionId,
          customerId,
          amountPaid: toNumberValue(stripeObject['amount_paid'], 100),
          currency: stripeObject['currency'],
          status: stripeObject['status'],
          invoicePdf: stripeObject['invoice_pdf'],
          raw: stripeObject,
        },
      })

      return {
        externalId: normalizeId('stripe:event', eventId ?? externalId),
        instructions,
      }
    }

    default:
      return {
        externalId: normalizeId('stripe:event', eventId ?? normalizedType),
        instructions,
      }
  }
}

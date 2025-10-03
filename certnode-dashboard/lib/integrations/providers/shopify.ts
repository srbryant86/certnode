import crypto from 'crypto'
import { RelationType } from '@prisma/client'

import type { ReceiptInstruction } from '../types'

type ShopifyRecord = Record<string, unknown>

type ShopifyEventParseResult = {
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

function asRecord(value: unknown): ShopifyRecord | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as ShopifyRecord
  }
  return undefined
}

function firstRecordFromArray(value: unknown): ShopifyRecord | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }
  for (const item of value) {
    const record = asRecord(item)
    if (record) {
      return record
    }
  }
  return undefined
}

export function mapShopifyEvent(topic: string, payload: ShopifyRecord): ShopifyEventParseResult {
  const instructions: ReceiptInstruction[] = []
  const normalizedTopic = topic.toLowerCase()

  const orderId = toStringValue(payload['order_id']) ?? toStringValue(payload['id'])
  const orderExternalId = orderId ? normalizeId('order', orderId) : normalizeId('order', undefined)

  const customerRecord = asRecord(payload['customer'])
  const customerSummary = customerRecord
    ? {
        id: toStringValue(customerRecord['id']),
        email: toStringValue(customerRecord['email']),
        name: [toStringValue(customerRecord['first_name']), toStringValue(customerRecord['last_name'])]
          .filter(Boolean)
          .join(' ')
          .trim(),
      }
    : undefined

  switch (normalizedTopic) {
    case 'orders/create': {
      instructions.push({
        domain: 'transaction',
        externalId: orderExternalId,
        data: {
          orderId,
          totalPrice: payload['total_price'],
          subtotalPrice: payload['subtotal_price'],
          currency: payload['currency'],
          financialStatus: payload['financial_status'],
          customer: customerSummary,
          raw: payload,
        },
      })
      return { externalId: orderExternalId, instructions }
    }

    case 'orders/fulfilled': {
      const fulfillmentRecord = firstRecordFromArray(payload['fulfillments'])
      const fulfillmentId = toStringValue(fulfillmentRecord?.['id']) ?? orderId
      const fulfillmentExternalId = normalizeId('fulfillment', fulfillmentId)

      instructions.push({
        domain: 'ops',
        externalId: fulfillmentExternalId,
        data: {
          orderId,
          fulfillmentId,
          trackingCompany: fulfillmentRecord?.['tracking_company'],
          trackingNumber: fulfillmentRecord?.['tracking_number'],
          trackingUrls: fulfillmentRecord?.['tracking_urls'],
          status: fulfillmentRecord?.['status'] ?? 'fulfilled',
          raw: fulfillmentRecord ?? payload,
        },
        relations: [
          {
            externalId: orderExternalId,
            relationType: RelationType.FULFILLS,
            description: 'Shopify fulfillment completed',
          },
        ],
      })
      return { externalId: fulfillmentExternalId, instructions }
    }

    case 'refunds/create': {
      const refundId = toStringValue(payload['id'])
      const refundExternalId = normalizeId('refund', refundId)

      instructions.push({
        domain: 'transaction',
        externalId: refundExternalId,
        data: {
          orderId,
          refundId,
          transactions: payload['transactions'],
          orderAdjustments: payload['order_adjustments'],
          raw: payload,
        },
        relations: [
          {
            externalId: orderExternalId,
            relationType: RelationType.AMENDS,
            description: 'Refund issued against order',
          },
        ],
      })
      return { externalId: refundExternalId, instructions }
    }

    case 'disputes/create': {
      const disputeId = toStringValue(payload['id'])
      const disputeExternalId = normalizeId('dispute', disputeId)

      instructions.push({
        domain: 'ops',
        externalId: disputeExternalId,
        data: {
          orderId,
          disputeId,
          reason: payload['reason'],
          status: payload['status'],
          evidenceDueDate: payload['evidence_due_by'],
          raw: payload,
        },
        relations: [
          {
            externalId: orderExternalId,
            relationType: RelationType.INVALIDATES,
            description: 'Dispute opened for order',
          },
        ],
      })
      return { externalId: disputeExternalId, instructions }
    }

    case 'orders/cancelled': {
      const cancelExternalId = normalizeId('order-cancelled', orderId)

      instructions.push({
        domain: 'ops',
        externalId: cancelExternalId,
        data: {
          orderId,
          cancelledAt: payload['cancelled_at'],
          cancelReason: payload['cancel_reason'],
          raw: payload,
        },
        relations: [
          {
            externalId: orderExternalId,
            relationType: RelationType.INVALIDATES,
            description: 'Order cancelled',
          },
        ],
      })
      return { externalId: cancelExternalId, instructions }
    }

    case 'checkouts/create': {
      const checkoutId = toStringValue(payload['id'])
      const checkoutExternalId = normalizeId('checkout', checkoutId)

      instructions.push({
        domain: 'ops',
        externalId: checkoutExternalId,
        data: {
          checkoutId,
          orderId,
          email: toStringValue(payload['email']),
          completedAt: payload['completed_at'],
          raw: payload,
        },
        relations: orderId
          ? [
              {
                externalId: orderExternalId,
                relationType: RelationType.EVIDENCES,
                description: 'Checkout created prior to order',
              },
            ]
          : undefined,
      })
      return { externalId: checkoutExternalId, instructions }
    }

    default:
      return {
        externalId: normalizeId('event', toStringValue(payload['id'])),
        instructions,
      }
  }
}

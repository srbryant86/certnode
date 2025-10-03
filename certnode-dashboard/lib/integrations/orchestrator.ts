import { createReceiptWithGraph } from '@/lib/graph/receipt-graph-service'

import {
  lookupReceiptByExternalId,
  markIntegrationEventFailed,
  markIntegrationEventProcessed,
  upsertIntegrationIndex,
} from './ledger'
import type { ReceiptInstruction, ReceiptRelationInstruction } from './types'

export interface ProcessIntegrationEventParams {
  enterpriseId: string
  provider: string
  providerEvent: string
  ledgerId: string
  instructions: ReceiptInstruction[]
}

export interface ProcessIntegrationEventResult {
  receiptIds: string[]
}

function buildParentEntry(
  relation: ReceiptRelationInstruction,
  parentId: string,
): {
  receiptId: string
  relation: ReceiptRelationInstruction
} {
  return { receiptId: parentId, relation }
}

export async function processIntegrationInstructions({
  enterpriseId,
  provider,
  providerEvent,
  ledgerId,
  instructions,
}: ProcessIntegrationEventParams): Promise<ProcessIntegrationEventResult> {
  if (instructions.length === 0) {
    await markIntegrationEventProcessed(ledgerId, [])
    return { receiptIds: [] }
  }

  const receiptIds: string[] = []

  try {
    for (const instruction of instructions) {
      const parentEntries: Array<{ receiptId: string; relation: ReceiptRelationInstruction }> = []

      if (instruction.relations?.length) {
        for (const relation of instruction.relations) {
          const parent = await lookupReceiptByExternalId({
            enterpriseId,
            provider,
            externalId: relation.externalId,
          })

          if (parent) {
            parentEntries.push(buildParentEntry(relation, parent.receiptId))
          }
        }
      }

      const receiptPayload = {
        provider,
        providerEvent,
        externalId: instruction.externalId,
        subtype: instruction.subtype,
        data: instruction.data,
      }

      const receipt = await createReceiptWithGraph({
        enterpriseId,
        type: instruction.domain,
        data: receiptPayload,
        parentReceipts:
          parentEntries.length > 0
            ? parentEntries.map(({ receiptId, relation }) => ({
                receiptId,
                relationType: relation.relationType,
                description: relation.description,
                metadata: relation.metadata,
              }))
            : undefined,
      })

      receiptIds.push(receipt.id)

      const indexKeys = new Set<string>()
      indexKeys.add(instruction.externalId)
      if (instruction.indexKeys) {
        for (const key of instruction.indexKeys) {
          if (key) {
            indexKeys.add(key)
          }
        }
      }

      for (const key of indexKeys) {
        await upsertIntegrationIndex({
          enterpriseId,
          provider,
          externalId: key,
          receiptId: receipt.id,
          eventId: ledgerId,
        })
      }
    }

    await markIntegrationEventProcessed(ledgerId, receiptIds)
    return { receiptIds }
  } catch (error) {
    await markIntegrationEventFailed(
      ledgerId,
      error instanceof Error ? error.message : 'Unknown integration failure',
    )
    throw error
  }
}

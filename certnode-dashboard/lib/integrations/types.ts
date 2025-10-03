import { RelationType } from '@prisma/client'

export type ReceiptDomain = 'transaction' | 'content' | 'ops'

export interface ReceiptRelationInstruction {
  externalId: string
  relationType: RelationType
  description?: string
  metadata?: Record<string, unknown>
}

export interface ReceiptInstruction {
  domain: ReceiptDomain
  externalId: string
  data: Record<string, unknown>
  subtype?: string
  relations?: ReceiptRelationInstruction[]
  indexKeys?: string[]
}

export interface IntegrationEventInput {
  enterpriseId: string
  provider: string
  providerEvent: string
  externalId: string
  payload: unknown
}

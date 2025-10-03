import crypto from 'crypto'
import { RelationType } from '@prisma/client'

import type { ReceiptInstruction } from '../types'

type KajabiRecord = Record<string, unknown>

type KajabiParseResult = {
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

function toNumberValue(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function toRecord(value: unknown): KajabiRecord | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as KajabiRecord
  }
  return undefined
}

function definedKeys(...keys: Array<string | undefined>): string[] {
  return keys.filter((key): key is string => Boolean(key))
}

export function mapKajabiEvent(eventType: string, payload: KajabiRecord): KajabiParseResult {
  const normalizedType = eventType.toLowerCase()
  const instructions: ReceiptInstruction[] = []

  const memberId = toStringValue(payload['member_id'] ?? toRecord(payload['member'])?.['id'])
  const offerId = toStringValue(payload['offer_id'])
  const courseId = toStringValue(payload['course_id'])
  const lessonId = toStringValue(payload['lesson_id'])
  const formId = toStringValue(payload['form_id'])
  const assessmentId = toStringValue(payload['assessment_id'])
  const orderId = toStringValue(payload['id'] ?? payload['order_id'])

  const memberKey = memberId ? `kajabi:member:${memberId}` : undefined
  const offerKey = offerId ? `kajabi:offer:${offerId}` : undefined
  const courseKey = courseId ? `kajabi:course:${courseId}` : undefined
  const orderKey = orderId ? `kajabi:order:${orderId}` : undefined

  switch (normalizedType) {
    case 'offer.purchased': {
      const externalId = normalizeId('kajabi:purchase', orderId ?? memberId ?? offerId)
      const amount = toNumberValue(payload['amount'])

      instructions.push({
        domain: 'transaction',
        externalId,
        indexKeys: definedKeys(orderKey, memberKey, offerKey),
        data: {
          orderId,
          offerId,
          offerName: payload['offer_name'],
          amount,
          currency: payload['currency'] ?? 'USD',
          customerEmail: payload['member_email'] ?? toRecord(payload['member'])?.['email'],
          customerName: payload['member_name'] ?? toRecord(payload['member'])?.['name'],
          paymentMethod: payload['payment_method'],
          purchasedAt: payload['created_at'],
          raw: payload,
        },
      })

      return {
        externalId,
        instructions,
      }
    }

    case 'member.logged_in': {
      const sessionId = toStringValue(payload['session_id']) ?? crypto.randomUUID()
      const externalId = normalizeId('kajabi:login', `${memberId ?? 'member'}:${sessionId}`)
      const relationKeys = definedKeys(orderKey, memberKey, offerKey)

      instructions.push({
        domain: 'ops',
        externalId,
        indexKeys: definedKeys(`kajabi:session:${sessionId}`),
        relations: relationKeys.length
          ? relationKeys.map(key => ({
              externalId: key,
              relationType: RelationType.EVIDENCES,
            }))
          : undefined,
        data: {
          memberId,
          sessionId,
          email: payload['member_email'],
          loginAt: payload['timestamp'],
          ip: payload['ip_address'],
          userAgent: payload['user_agent'],
          raw: payload,
        },
      })

      return {
        externalId,
        instructions,
      }
    }

    case 'course.completed': {
      const completionId = normalizeId('kajabi:course-completed', courseId ?? memberId)
      const relationKeys = definedKeys(memberKey, courseKey, orderKey)

      instructions.push({
        domain: 'content',
        externalId: completionId,
        indexKeys: definedKeys(courseKey, memberKey),
        relations: relationKeys.length
          ? relationKeys.map(key => ({
              externalId: key,
              relationType: RelationType.FULFILLS,
            }))
          : undefined,
        data: {
          memberId,
          courseId,
          courseName: payload['course_name'],
          completedAt: payload['completed_at'],
          totalLessons: toNumberValue(payload['total_lessons']),
          raw: payload,
        },
      })

      return {
        externalId: completionId,
        instructions,
      }
    }

    case 'course.progress': {
      const progressKey = normalizeId('kajabi:course-progress', `${courseId ?? 'course'}:${lessonId ?? crypto.randomUUID()}`)
      const relationKeys = definedKeys(memberKey, courseKey, orderKey)

      instructions.push({
        domain: 'content',
        externalId: progressKey,
        indexKeys: definedKeys(courseKey, lessonId ? `kajabi:lesson:${lessonId}` : undefined),
        relations: relationKeys.length
          ? relationKeys.map(key => ({
              externalId: key,
              relationType: RelationType.EVIDENCES,
            }))
          : undefined,
        data: {
          memberId,
          courseId,
          lessonId,
          lessonName: payload['lesson_name'],
          progressPercentage: toNumberValue(payload['progress_percentage']),
          completed: payload['completed'],
          watchTimeSeconds: toNumberValue(payload['watch_time_seconds']),
          recordedAt: payload['timestamp'],
          raw: payload,
        },
      })

      return {
        externalId: progressKey,
        instructions,
      }
    }

    case 'assessment.submitted': {
      const assessmentKey = normalizeId('kajabi:assessment', assessmentId ?? memberId)
      const relationKeys = definedKeys(memberKey, courseKey, orderKey)

      instructions.push({
        domain: 'content',
        externalId: assessmentKey,
        indexKeys: definedKeys(assessmentId ? `kajabi:assessment:${assessmentId}` : undefined, memberKey),
        relations: relationKeys.length
          ? relationKeys.map(key => ({
              externalId: key,
              relationType: RelationType.EVIDENCES,
            }))
          : undefined,
        data: {
          memberId,
          assessmentId,
          assessmentName: payload['assessment_name'],
          score: toNumberValue(payload['score']),
          passed: payload['passed'],
          submittedAt: payload['submitted_at'],
          raw: payload,
        },
      })

      return {
        externalId: assessmentKey,
        instructions,
      }
    }

    case 'form.submitted': {
      const formKey = normalizeId('kajabi:form', formId ?? memberId)
      const relationKeys = definedKeys(memberKey, orderKey)

      instructions.push({
        domain: 'ops',
        externalId: formKey,
        indexKeys: definedKeys(formId ? `kajabi:form:${formId}` : undefined, memberKey),
        relations: relationKeys.length
          ? relationKeys.map(key => ({
              externalId: key,
              relationType: RelationType.AMENDS,
            }))
          : undefined,
        data: {
          memberId,
          formId,
          formName: payload['form_name'],
          responses: payload['responses'],
          submittedAt: payload['submitted_at'],
          raw: payload,
        },
      })

      return {
        externalId: formKey,
        instructions,
      }
    }

    default: {
      const fallbackId = normalizeId('kajabi:event', eventType)
      return {
        externalId: fallbackId,
        instructions,
      }
    }
  }
}

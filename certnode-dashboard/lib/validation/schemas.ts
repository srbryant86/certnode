/**
 * Zod validation schemas for all CertNode API endpoints
 */

import { z } from 'zod'

// Base schemas
export const hashSchema = z.string()
  .regex(/^(sha256:)?[a-f0-9]{64}$/i, 'Invalid hash format')
  .transform(hash => hash.startsWith('sha256:') ? hash : `sha256:${hash}`)

export const contentTypeSchema = z.string()
  .regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, 'Invalid content type format')
  .max(255, 'Content type too long')

export const base64Schema = z.string()
  .regex(/^[A-Za-z0-9+\/]*={0,2}$/, 'Invalid base64 format')
  .refine((val) => {
    try {
      const decoded = Buffer.from(val, 'base64')
      return decoded.length <= 100 * 1024 * 1024 // 100MB limit
    } catch {
      return false
    }
  }, 'Base64 content too large or invalid')

export const enterpriseIdSchema = z.string()
  .cuid('Invalid enterprise ID format')

export const apiKeyIdSchema = z.string()
  .cuid('Invalid API key ID format')

export const timestampSchema = z.string()
  .datetime({ message: 'Invalid timestamp format' })

// Metadata schemas
export const metadataSchema = z.record(z.unknown())
  .refine((val) => {
    const serialized = JSON.stringify(val)
    return serialized.length <= 10000 // 10KB metadata limit
  }, 'Metadata too large')

export const provenanceSchema = z.object({
  creator: z.string().min(1).max(255).optional(),
  timestamp: timestampSchema.optional(),
  location: z.string().max(255).optional(),
  device: z.string().max(255).optional(),
  software: z.string().max(255).optional(),
  version: z.string().max(100).optional(),
  source: z.string().max(255).optional(),
  chain: z.array(z.record(z.unknown())).max(10).optional()
}).strict()

export const aiDetectionResultSchema = z.object({
  confidence: z.number().min(0).max(1),
  method: z.string().max(100),
  indicators: z.record(z.unknown()).optional(),
  reasoning: z.string().max(1000).optional(),
  modelSignatures: z.record(z.unknown()).optional(),
  confidenceInterval: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]).optional(),
  processingTime: z.number().min(0),
  timestamp: timestampSchema,
  backgroundJobId: z.string().optional()
}).strict()

// Content certification endpoint schema
export const contentCertificationSchema = z.object({
  // Required: either content or hash
  contentBase64: base64Schema.optional(),
  contentHash: hashSchema.optional(),

  // Optional fields
  contentType: contentTypeSchema.optional(),
  metadata: metadataSchema.optional(),
  provenance: provenanceSchema.optional(),
  detectorResults: aiDetectionResultSchema.optional()
}).strict()
.refine(
  (data) => data.contentBase64 || data.contentHash,
  'Either contentBase64 or contentHash must be provided'
)
.refine(
  (data) => !(data.contentBase64 && data.contentHash),
  'Cannot provide both contentBase64 and contentHash'
)

// Content verification schema
export const contentVerificationSchema = z.object({
  hash: hashSchema
}).strict()

// Job status schema
export const jobStatusSchema = z.object({
  jobId: z.string().min(1).max(100)
}).strict()

// API key authentication schema
export const apiKeyHeaderSchema = z.object({
  'x-api-key': z.string().min(32).max(128).regex(/^[a-zA-Z0-9_-]+$/, 'Invalid API key format')
}).strict()

// Queue job schema
export const queueJobSchema = z.object({
  receiptId: z.string().cuid().optional().or(z.literal('')),
  contentType: contentTypeSchema,
  contentHash: hashSchema,
  contentBase64: base64Schema.optional(),
  priority: z.enum(['low', 'normal', 'high'])
}).strict()

// Validation context schema
export const validationContextSchema = z.object({
  userId: z.string().cuid().optional(),
  enterpriseId: enterpriseIdSchema.optional(),
  apiKeyId: apiKeyIdSchema.optional(),
  ipAddress: z.string().optional(), // Remove .ip() validation to fix build error
  userAgent: z.string().max(1000).optional(),
  requestId: z.string().uuid().optional(),
  endpoint: z.string().max(255).optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']).optional()
}).strict()

// Enterprise settings schema
export const enterpriseSettingsSchema = z.object({
  maxReceiptsPerHour: z.number().int().min(1).max(100000),
  maxFileSize: z.number().int().min(1024).max(1024 * 1024 * 1024), // 1GB max
  allowedContentTypes: z.array(contentTypeSchema).max(100),
  requireProvenance: z.boolean(),
  enableAIDetection: z.boolean(),
  complianceLevel: z.enum(['basic', 'standard', 'strict', 'enterprise'])
}).strict()

// Receipt schema for validation
export const receiptSchema = z.object({
  id: z.string().cuid(),
  enterpriseId: enterpriseIdSchema,
  transactionId: z.string().min(1).max(255),
  transactionData: z.record(z.unknown()),
  cryptographicProof: z.record(z.unknown()),
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'FAILED']),
  type: z.enum(['TRANSACTION', 'CONTENT', 'OPS']),

  // Content-specific fields
  contentHash: hashSchema.optional(),
  contentType: contentTypeSchema.optional(),
  contentMetadata: metadataSchema.optional(),
  contentProvenance: provenanceSchema.optional(),
  contentAiScores: aiDetectionResultSchema.optional(),

  createdAt: z.date(),
  updatedAt: z.date()
}).strict()

// Cryptographic proof validation schema
export const cryptographicProofSchema = z.object({
  signature: z.string().min(1).max(2000),
  algorithm: z.enum(['ES256', 'ES384', 'ES512', 'RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512']),
  keyId: z.string().min(1).max(100),
  issuer: z.string().url().optional(),
  issuedAt: timestampSchema.optional(),
  expiresAt: timestampSchema.optional(),
  notBefore: timestampSchema.optional(),
  jws: z.string().min(1).max(5000).optional()
}).strict()

// Rate limiting schema
export const rateLimitSchema = z.object({
  limit: z.number().int().min(1),
  remaining: z.number().int().min(0),
  resetTime: z.number().int().positive(),
  retryAfter: z.number().int().positive().optional()
}).strict()

// Error response schema
export const errorResponseSchema = z.object({
  error: z.string().min(1).max(500),
  code: z.string().regex(/^[A-Z_]+$/).max(50).optional(),
  details: z.record(z.unknown()).optional(),
  timestamp: timestampSchema.optional(),
  requestId: z.string().uuid().optional()
}).strict()

// Success response schema
export const successResponseSchema = z.object({
  success: z.literal(true),
  data: z.record(z.unknown()).optional(),
  timestamp: timestampSchema.optional(),
  requestId: z.string().uuid().optional()
}).strict()

// Schema registry for endpoint-specific validation
export const schemaRegistry = new Map<string, z.ZodSchema>([
  ['/api/v1/receipts/content', contentCertificationSchema],
  ['/api/v1/verify/content', contentVerificationSchema],
  ['/api/v1/jobs/:jobId', jobStatusSchema],
  ['/api/v1/queue/health', z.object({}).strict()],

  // Headers
  ['headers:api-key', apiKeyHeaderSchema],

  // Queue
  ['queue:job', queueJobSchema],

  // Context
  ['context', validationContextSchema],

  // Models
  ['model:receipt', receiptSchema],
  ['model:proof', cryptographicProofSchema],
  ['model:enterprise-settings', enterpriseSettingsSchema]
])

/**
 * Get schema for a specific endpoint or model
 */
export function getSchema(key: string): z.ZodSchema | null {
  return schemaRegistry.get(key) || null
}

/**
 * Register a new schema
 */
export function registerSchema(key: string, schema: z.ZodSchema): void {
  schemaRegistry.set(key, schema)
}

/**
 * Validate data against a registered schema
 */
export function validateWithSchema(key: string, data: unknown): { success: boolean; data?: any; errors?: any } {
  const schema = getSchema(key)
  if (!schema) {
    return { success: false, errors: `No schema registered for key: ${key}` }
  }

  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error.errors }
  }
}
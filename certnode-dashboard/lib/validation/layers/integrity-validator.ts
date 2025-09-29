/**
 * Layer 5: Data Integrity Validation
 *
 * Validates data consistency, referential integrity, and state coherence
 */

import { ValidationResult, ValidationLayer, ValidationSeverity, ValidationContext } from '../validation-engine'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export interface IntegrityValidationConfig {
  checkReferentialIntegrity: boolean
  validateStateConsistency: boolean
  checkDataConsistency: boolean
  verifyConstraints: boolean
  enableChecksums: boolean
  maxCascadingDepth: number
}

export class IntegrityValidator {
  private config: IntegrityValidationConfig

  constructor(config: Partial<IntegrityValidationConfig> = {}) {
    this.config = {
      checkReferentialIntegrity: true,
      validateStateConsistency: true,
      checkDataConsistency: true,
      verifyConstraints: true,
      enableChecksums: true,
      maxCascadingDepth: 5,
      ...config
    }
  }

  async validate(data: any, context: ValidationContext): Promise<ValidationResult> {
    try {
      const validationId = crypto.randomUUID()
      const issues: string[] = []

      // Check referential integrity
      if (this.config.checkReferentialIntegrity) {
        const referentialCheck = await this.validateReferentialIntegrity(data, context)
        if (!referentialCheck.valid) {
          issues.push(...referentialCheck.issues)
        }
      }

      // Validate state consistency
      if (this.config.validateStateConsistency) {
        const stateCheck = await this.validateStateConsistency(data, context)
        if (!stateCheck.valid) {
          issues.push(...stateCheck.issues)
        }
      }

      // Check data consistency
      if (this.config.checkDataConsistency) {
        const consistencyCheck = await this.validateDataConsistency(data, context)
        if (!consistencyCheck.valid) {
          issues.push(...consistencyCheck.issues)
        }
      }

      // Verify business constraints
      if (this.config.verifyConstraints) {
        const constraintCheck = await this.validateConstraints(data, context)
        if (!constraintCheck.valid) {
          issues.push(...constraintCheck.issues)
        }
      }

      // Validate checksums
      if (this.config.enableChecksums) {
        const checksumCheck = await this.validateChecksums(data, context)
        if (!checksumCheck.valid) {
          issues.push(...checksumCheck.issues)
        }
      }

      if (issues.length > 0) {
        return {
          valid: false,
          layer: ValidationLayer.INTEGRITY,
          severity: this.determineSeverity(issues),
          code: 'INTEGRITY_VALIDATION_FAILED',
          message: 'Data integrity validation failed',
          details: { issues, validationId },
          timestamp: new Date().toISOString(),
          validationId
        }
      }

      return {
        valid: true,
        layer: ValidationLayer.INTEGRITY,
        severity: ValidationSeverity.LOW,
        code: 'INTEGRITY_VALIDATION_PASSED',
        message: 'Data integrity validation passed',
        details: { validationId },
        timestamp: new Date().toISOString(),
        validationId
      }

    } catch (error) {
      return {
        valid: false,
        layer: ValidationLayer.INTEGRITY,
        severity: ValidationSeverity.CRITICAL,
        code: 'INTEGRITY_VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Integrity validation error',
        timestamp: new Date().toISOString(),
        validationId: crypto.randomUUID()
      }
    }
  }

  private async validateReferentialIntegrity(data: any, context: ValidationContext): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // Check enterprise ID exists
      if (context.enterpriseId) {
        const enterprise = await prisma.enterprise.findUnique({
          where: { id: context.enterpriseId }
        })
        if (!enterprise) {
          issues.push(`Enterprise ID ${context.enterpriseId} does not exist`)
        }
      }

      // Check API key ID exists and belongs to enterprise
      if (context.apiKeyId && context.enterpriseId) {
        const apiKey = await prisma.apiKey.findUnique({
          where: { id: context.apiKeyId }
        })
        if (!apiKey) {
          issues.push(`API key ID ${context.apiKeyId} does not exist`)
        } else if (apiKey.enterpriseId !== context.enterpriseId) {
          issues.push(`API key does not belong to enterprise ${context.enterpriseId}`)
        }
      }

      // Check user ID exists and belongs to enterprise
      if (context.userId && context.enterpriseId) {
        const user = await prisma.user.findUnique({
          where: { id: context.userId }
        })
        if (!user) {
          issues.push(`User ID ${context.userId} does not exist`)
        } else if (user.enterpriseId !== context.enterpriseId) {
          issues.push(`User does not belong to enterprise ${context.enterpriseId}`)
        }
      }

      // Check receipt references if updating
      if (data.receiptId) {
        const receipt = await prisma.receipt.findUnique({
          where: { id: data.receiptId }
        })
        if (!receipt) {
          issues.push(`Receipt ID ${data.receiptId} does not exist`)
        } else if (context.enterpriseId && receipt.enterpriseId !== context.enterpriseId) {
          issues.push(`Receipt does not belong to enterprise ${context.enterpriseId}`)
        }
      }

      // Check for orphaned references
      const orphanCheck = await this.checkOrphanedReferences(data, context)
      if (!orphanCheck.valid) {
        issues.push(...orphanCheck.issues)
      }

      return { valid: issues.length === 0, issues }

    } catch (error) {
      issues.push(`Referential integrity check error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { valid: false, issues }
    }
  }

  private async validateStateConsistency(data: any, context: ValidationContext): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // Check for conflicting states
      if (data.verificationStatus && data.cryptographicProof) {
        if (data.verificationStatus === 'VERIFIED' && !data.cryptographicProof.signature) {
          issues.push('Receipt marked as verified but missing signature')
        }
        if (data.verificationStatus === 'FAILED' && data.cryptographicProof.signature) {
          issues.push('Receipt marked as failed but has valid signature')
        }
      }

      // Check content consistency
      if (data.contentHash && data.contentBase64) {
        const expectedHash = 'sha256:' + crypto.createHash('sha256')
          .update(Buffer.from(data.contentBase64, 'base64'))
          .digest('hex')

        if (data.contentHash !== expectedHash) {
          issues.push('Content hash does not match provided content')
        }
      }

      // Check timestamp consistency
      if (data.createdAt && data.updatedAt) {
        const created = new Date(data.createdAt)
        const updated = new Date(data.updatedAt)
        if (created > updated) {
          issues.push('Created timestamp is after updated timestamp')
        }
      }

      // Check AI detection consistency
      if (data.contentAiScores) {
        const aiScores = data.contentAiScores
        if (aiScores.confidence !== undefined) {
          if (aiScores.confidence < 0 || aiScores.confidence > 1) {
            issues.push('AI confidence score must be between 0 and 1')
          }
        }

        if (aiScores.confidenceInterval) {
          const [lower, upper] = aiScores.confidenceInterval
          if (lower > upper) {
            issues.push('AI confidence interval lower bound exceeds upper bound')
          }
          if (aiScores.confidence && (aiScores.confidence < lower || aiScores.confidence > upper)) {
            issues.push('AI confidence score outside confidence interval')
          }
        }
      }

      // Check provenance chain consistency
      if (data.contentProvenance && data.contentProvenance.chain) {
        const chainCheck = await this.validateProvenanceChain(data.contentProvenance.chain)
        if (!chainCheck.valid) {
          issues.push(...chainCheck.issues)
        }
      }

      return { valid: issues.length === 0, issues }

    } catch (error) {
      issues.push(`State consistency check error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { valid: false, issues }
    }
  }

  private async validateDataConsistency(data: any, context: ValidationContext): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // Check for duplicate data
      if (data.contentHash && context.enterpriseId) {
        const existing = await prisma.receipt.findFirst({
          where: {
            contentHash: data.contentHash,
            enterpriseId: context.enterpriseId,
            id: { not: data.id } // Exclude current record if updating
          }
        })

        if (existing) {
          // Allow duplicates but warn
          console.warn(`Duplicate content hash detected: ${data.contentHash}`)
        }
      }

      // Check data size consistency
      if (data.contentBase64) {
        const decodedSize = Buffer.from(data.contentBase64, 'base64').length
        if (data.contentMetadata?.sizeBytes && data.contentMetadata.sizeBytes !== decodedSize) {
          issues.push('Content size metadata does not match actual content size')
        }

        // Check reasonable size limits
        if (decodedSize > 100 * 1024 * 1024) { // 100MB
          issues.push('Content size exceeds maximum allowed limit')
        }
      }

      // Check metadata consistency
      if (data.contentType && data.contentMetadata) {
        const metadata = data.contentMetadata

        // Image metadata consistency
        if (data.contentType.startsWith('image/')) {
          if (metadata.width && metadata.height) {
            if (metadata.width <= 0 || metadata.height <= 0) {
              issues.push('Image dimensions must be positive')
            }
            if (metadata.width > 100000 || metadata.height > 100000) {
              issues.push('Image dimensions exceed reasonable limits')
            }
          }
        }

        // Text metadata consistency
        if (data.contentType.startsWith('text/')) {
          if (metadata.characterCount && metadata.characterCount < 0) {
            issues.push('Character count cannot be negative')
          }
        }
      }

      // Check transaction data consistency
      if (data.transactionData) {
        const transactionData = data.transactionData
        if (transactionData.contentHash && data.contentHash && transactionData.contentHash !== data.contentHash) {
          issues.push('Transaction data content hash does not match receipt content hash')
        }
      }

      return { valid: issues.length === 0, issues }

    } catch (error) {
      issues.push(`Data consistency check error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { valid: false, issues }
    }
  }

  private async validateConstraints(data: any, context: ValidationContext): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // Enterprise-specific constraints
      if (context.enterpriseId) {
        const enterprise = await prisma.enterprise.findUnique({
          where: { id: context.enterpriseId },
          select: { tier: true }
        })

        if (enterprise) {
          // Check tier-specific limits
          const tierLimits = this.getTierLimits(enterprise.tier)

          // Check file size limits
          if (data.contentBase64) {
            const fileSize = Buffer.from(data.contentBase64, 'base64').length
            if (fileSize > tierLimits.maxFileSize) {
              issues.push(`File size ${fileSize} exceeds tier limit ${tierLimits.maxFileSize}`)
            }
          }

          // Check hourly receipt limits
          const hourlyCount = await this.getHourlyReceiptCount(context.enterpriseId)
          if (hourlyCount >= tierLimits.maxReceiptsPerHour) {
            issues.push(`Hourly receipt limit ${tierLimits.maxReceiptsPerHour} exceeded`)
          }
        }
      }

      // Content type constraints
      if (data.contentType) {
        const allowedTypes = [
          'text/plain', 'text/html', 'text/csv', 'text/markdown',
          'application/json', 'application/pdf', 'application/xml',
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/webm', 'audio/mp3', 'audio/wav'
        ]

        if (!allowedTypes.includes(data.contentType)) {
          issues.push(`Content type ${data.contentType} not allowed`)
        }
      }

      // String length constraints
      if (data.contentProvenance?.creator && data.contentProvenance.creator.length > 255) {
        issues.push('Provenance creator name exceeds maximum length')
      }

      if (data.contentProvenance?.location && data.contentProvenance.location.length > 255) {
        issues.push('Provenance location exceeds maximum length')
      }

      // Temporal constraints
      const now = Date.now()
      if (data.contentProvenance?.timestamp) {
        const provenanceTime = new Date(data.contentProvenance.timestamp).getTime()
        if (provenanceTime > now + 60000) { // Allow 1 minute clock skew
          issues.push('Provenance timestamp cannot be in the future')
        }
        if (provenanceTime < now - 365 * 24 * 60 * 60 * 1000) { // 1 year ago
          issues.push('Provenance timestamp too far in the past')
        }
      }

      return { valid: issues.length === 0, issues }

    } catch (error) {
      issues.push(`Constraint validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { valid: false, issues }
    }
  }

  private async validateChecksums(data: any, context: ValidationContext): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // Calculate and verify checksums for critical data
      if (data.transactionData) {
        const expectedChecksum = this.calculateChecksum(data.transactionData)
        if (data.transactionDataChecksum && data.transactionDataChecksum !== expectedChecksum) {
          issues.push('Transaction data checksum mismatch')
        }
      }

      if (data.cryptographicProof) {
        const expectedChecksum = this.calculateChecksum(data.cryptographicProof)
        if (data.cryptographicProofChecksum && data.cryptographicProofChecksum !== expectedChecksum) {
          issues.push('Cryptographic proof checksum mismatch')
        }
      }

      // Verify content hash integrity
      if (data.contentHash) {
        const hashPattern = /^sha256:[a-f0-9]{64}$/i
        if (!hashPattern.test(data.contentHash)) {
          issues.push('Invalid content hash format')
        }
      }

      return { valid: issues.length === 0, issues }

    } catch (error) {
      issues.push(`Checksum validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { valid: false, issues }
    }
  }

  private async checkOrphanedReferences(data: any, context: ValidationContext): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    // Check for references to non-existent resources
    // This is a simplified implementation - real-world would be more comprehensive

    return { valid: issues.length === 0, issues }
  }

  private async validateProvenanceChain(chain: any[]): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    if (chain.length > 10) {
      issues.push('Provenance chain too long (maximum 10 entries)')
    }

    for (let i = 0; i < chain.length; i++) {
      const entry = chain[i]

      if (!entry.timestamp) {
        issues.push(`Provenance chain entry ${i} missing timestamp`)
      }

      if (i > 0) {
        const prevEntry = chain[i - 1]
        if (entry.timestamp && prevEntry.timestamp) {
          if (new Date(entry.timestamp) < new Date(prevEntry.timestamp)) {
            issues.push(`Provenance chain timestamps out of order at entry ${i}`)
          }
        }
      }
    }

    return { valid: issues.length === 0, issues }
  }

  private getTierLimits(tier: string) {
    const limits = {
      FREE: { maxFileSize: 1024 * 1024, maxReceiptsPerHour: 10 },      // 1MB, 10/hour
      STARTER: { maxFileSize: 10 * 1024 * 1024, maxReceiptsPerHour: 100 },  // 10MB, 100/hour
      PRO: { maxFileSize: 100 * 1024 * 1024, maxReceiptsPerHour: 1000 },    // 100MB, 1000/hour
      ENTERPRISE: { maxFileSize: 1024 * 1024 * 1024, maxReceiptsPerHour: 10000 } // 1GB, 10000/hour
    }

    return limits[tier as keyof typeof limits] || limits.FREE
  }

  private async getHourlyReceiptCount(enterpriseId: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const count = await prisma.receipt.count({
      where: {
        enterpriseId,
        createdAt: { gte: oneHourAgo }
      }
    })

    return count
  }

  private calculateChecksum(data: any): string {
    const serialized = JSON.stringify(data, Object.keys(data).sort())
    return crypto.createHash('sha256').update(serialized).digest('hex')
  }

  private determineSeverity(issues: string[]): ValidationSeverity {
    if (issues.some(issue =>
      issue.includes('mismatch') ||
      issue.includes('exceeds') ||
      issue.includes('does not exist')
    )) {
      return ValidationSeverity.CRITICAL
    }

    if (issues.some(issue =>
      issue.includes('limit') ||
      issue.includes('not allowed') ||
      issue.includes('missing')
    )) {
      return ValidationSeverity.HIGH
    }

    if (issues.some(issue =>
      issue.includes('format') ||
      issue.includes('consistency')
    )) {
      return ValidationSeverity.MEDIUM
    }

    return ValidationSeverity.LOW
  }
}

export const integrityValidator = new IntegrityValidator()
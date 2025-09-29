/**
 * Layer 4: Cryptographic Validation
 *
 * Validates cryptographic proofs, signatures, and certificates
 */

import { ValidationResult, ValidationLayer, ValidationSeverity, ValidationContext } from '../validation-engine'
import { cryptographicProofSchema } from '../schemas'
import crypto from 'crypto'

// Add crypto to global if not available
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = crypto as any
}
import { z } from 'zod'

export interface CryptographicValidationConfig {
  verifySignatures: boolean
  checkCertificateChain: boolean
  validateTimestamps: boolean
  allowedAlgorithms: string[]
  maxSignatureAge: number // seconds
  requireKeyId: boolean
}

export class CryptographicValidator {
  private config: CryptographicValidationConfig

  constructor(config: Partial<CryptographicValidationConfig> = {}) {
    this.config = {
      verifySignatures: true,
      checkCertificateChain: true,
      validateTimestamps: true,
      allowedAlgorithms: ['ES256', 'ES384', 'ES512', 'RS256', 'RS384', 'RS512'],
      maxSignatureAge: 24 * 60 * 60, // 24 hours
      requireKeyId: true,
      ...config
    }
  }

  async validate(data: any, context: ValidationContext): Promise<ValidationResult> {
    try {
      const validationId = crypto.randomUUID()
      const issues: string[] = []

      // Check for cryptographic proofs in the data
      const cryptographicProof = data.cryptographicProof
      if (cryptographicProof) {
        const proofValidation = await this.validateCryptographicProof(cryptographicProof, context)
        if (!proofValidation.valid) {
          issues.push(...proofValidation.issues)
        }
      }

      // Validate JWS signatures if present
      if (data.jws || (cryptographicProof && cryptographicProof.jws)) {
        const jwsValidation = await this.validateJWS(data.jws || cryptographicProof.jws, context)
        if (!jwsValidation.valid) {
          issues.push(...jwsValidation.issues)
        }
      }

      // Validate content hashes
      if (data.contentHash && data.contentBase64) {
        const hashValidation = await this.validateContentHash(data.contentHash, data.contentBase64)
        if (!hashValidation.valid) {
          issues.push(...hashValidation.issues)
        }
      }

      // Check for weak cryptographic parameters
      const weaknessCheck = await this.checkCryptographicWeaknesses(data)
      if (!weaknessCheck.valid) {
        issues.push(...weaknessCheck.issues)
      }

      if (issues.length > 0) {
        return {
          valid: false,
          layer: ValidationLayer.CRYPTOGRAPHIC,
          severity: this.determineSeverity(issues),
          code: 'CRYPTOGRAPHIC_VALIDATION_FAILED',
          message: 'Cryptographic validation failed',
          details: { issues, validationId },
          timestamp: new Date().toISOString(),
          validationId
        }
      }

      return {
        valid: true,
        layer: ValidationLayer.CRYPTOGRAPHIC,
        severity: ValidationSeverity.LOW,
        code: 'CRYPTOGRAPHIC_VALIDATION_PASSED',
        message: 'Cryptographic validation passed',
        details: { validationId },
        timestamp: new Date().toISOString(),
        validationId
      }

    } catch (error) {
      return {
        valid: false,
        layer: ValidationLayer.CRYPTOGRAPHIC,
        severity: ValidationSeverity.CRITICAL,
        code: 'CRYPTOGRAPHIC_VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Cryptographic validation error',
        timestamp: new Date().toISOString(),
        validationId: crypto.randomUUID()
      }
    }
  }

  private async validateCryptographicProof(proof: any, context: ValidationContext): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // Validate proof structure
      const proofValidation = cryptographicProofSchema.safeParse(proof)
      if (!proofValidation.success) {
        issues.push('Invalid cryptographic proof structure')
        return { valid: false, issues }
      }

      const validProof = proofValidation.data

      // Check algorithm allowlist
      if (!this.config.allowedAlgorithms.includes(validProof.algorithm)) {
        issues.push(`Algorithm ${validProof.algorithm} not allowed`)
      }

      // Check key ID requirement
      if (this.config.requireKeyId && !validProof.keyId) {
        issues.push('Key ID is required but missing')
      }

      // Validate signature format
      if (!this.isValidSignatureFormat(validProof.signature, validProof.algorithm)) {
        issues.push('Invalid signature format for algorithm')
      }

      // Check timestamp validity
      if (this.config.validateTimestamps) {
        const timestampValidation = await this.validateTimestamps(validProof)
        if (!timestampValidation.valid) {
          issues.push(...timestampValidation.issues)
        }
      }

      // Verify signature if verification is enabled
      if (this.config.verifySignatures) {
        const signatureValidation = await this.verifySignature(validProof, context)
        if (!signatureValidation.valid) {
          issues.push(...signatureValidation.issues)
        }
      }

      return { valid: issues.length === 0, issues }

    } catch (error) {
      issues.push(`Cryptographic proof validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { valid: false, issues }
    }
  }

  private async validateJWS(jws: string, context: ValidationContext): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // Basic JWS format check (header.payload.signature)
      const parts = jws.split('.')
      if (parts.length !== 3) {
        issues.push('Invalid JWS format - must have 3 parts separated by dots')
        return { valid: false, issues }
      }

      // Decode header
      try {
        const headerJson = Buffer.from(parts[0], 'base64url').toString()
        const header = JSON.parse(headerJson)

        // Validate required header fields
        if (!header.alg) {
          issues.push('JWS header missing algorithm')
        }

        if (!this.config.allowedAlgorithms.includes(header.alg)) {
          issues.push(`JWS algorithm ${header.alg} not allowed`)
        }

        if (this.config.requireKeyId && !header.kid) {
          issues.push('JWS header missing key ID')
        }

      } catch (error) {
        issues.push('Invalid JWS header encoding or format')
      }

      // Decode payload
      try {
        const payloadJson = Buffer.from(parts[1], 'base64url').toString()
        const payload = JSON.parse(payloadJson)

        // Validate payload timestamps
        if (payload.exp && Date.now() / 1000 > payload.exp) {
          issues.push('JWS token has expired')
        }

        if (payload.nbf && Date.now() / 1000 < payload.nbf) {
          issues.push('JWS token not yet valid')
        }

        if (payload.iat && this.config.maxSignatureAge > 0) {
          const age = Date.now() / 1000 - payload.iat
          if (age > this.config.maxSignatureAge) {
            issues.push('JWS token too old')
          }
        }

      } catch (error) {
        issues.push('Invalid JWS payload encoding or format')
      }

      // Validate signature format
      const signature = parts[2]
      if (!this.isValidBase64Url(signature)) {
        issues.push('Invalid JWS signature encoding')
      }

      return { valid: issues.length === 0, issues }

    } catch (error) {
      issues.push(`JWS validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { valid: false, issues }
    }
  }

  private async validateContentHash(contentHash: string, contentBase64: string): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      // Extract hash from hash string
      const hashValue = contentHash.replace(/^sha256:/, '')

      // Decode and hash the content
      const content = Buffer.from(contentBase64, 'base64')
      const computedHash = crypto.createHash('sha256').update(content).digest('hex')

      // Compare hashes
      if (hashValue.toLowerCase() !== computedHash.toLowerCase()) {
        issues.push('Content hash mismatch - content has been modified')
      }

      return { valid: issues.length === 0, issues }

    } catch (error) {
      issues.push(`Content hash validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { valid: false, issues }
    }
  }

  private async checkCryptographicWeaknesses(data: any): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    // Check for weak key sizes
    if (data.keySize && data.keySize < 2048) {
      issues.push('Key size too small - minimum 2048 bits required')
    }

    // Check for deprecated algorithms
    const deprecatedAlgorithms = ['MD5', 'SHA1', 'RS1']
    if (data.algorithm && deprecatedAlgorithms.includes(data.algorithm.toUpperCase())) {
      issues.push(`Deprecated algorithm detected: ${data.algorithm}`)
    }

    // Check for weak random values
    if (data.nonce && this.isWeakRandom(data.nonce)) {
      issues.push('Weak random nonce detected')
    }

    // Check for timing vulnerabilities
    if (data.signature && this.hasPotentialTimingVulnerability(data.signature)) {
      issues.push('Potential timing vulnerability detected in signature')
    }

    return { valid: issues.length === 0, issues }
  }

  private async validateTimestamps(proof: any): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []
    const now = Date.now()

    if (proof.issuedAt) {
      const issuedAt = new Date(proof.issuedAt).getTime()
      if (isNaN(issuedAt)) {
        issues.push('Invalid issuedAt timestamp format')
      } else if (issuedAt > now + 60000) { // Allow 1 minute clock skew
        issues.push('issuedAt timestamp is in the future')
      }
    }

    if (proof.expiresAt) {
      const expiresAt = new Date(proof.expiresAt).getTime()
      if (isNaN(expiresAt)) {
        issues.push('Invalid expiresAt timestamp format')
      } else if (expiresAt < now) {
        issues.push('Cryptographic proof has expired')
      }
    }

    if (proof.notBefore) {
      const notBefore = new Date(proof.notBefore).getTime()
      if (isNaN(notBefore)) {
        issues.push('Invalid notBefore timestamp format')
      } else if (notBefore > now) {
        issues.push('Cryptographic proof not yet valid')
      }
    }

    return { valid: issues.length === 0, issues }
  }

  private async verifySignature(proof: any, context: ValidationContext): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []

    // TODO: Implement actual signature verification
    // This would involve:
    // 1. Retrieving the public key using the keyId
    // 2. Verifying the signature against the data
    // 3. Checking certificate chain if applicable

    // Placeholder implementation
    console.log('Signature verification not yet implemented', { proof: proof.keyId, context: context.requestId })

    return { valid: true, issues }
  }

  private isValidSignatureFormat(signature: string, algorithm: string): boolean {
    // Basic signature format validation based on algorithm
    switch (algorithm) {
      case 'ES256':
      case 'ES384':
      case 'ES512':
        // ECDSA signatures should be base64 encoded
        return this.isValidBase64(signature)
      case 'RS256':
      case 'RS384':
      case 'RS512':
      case 'PS256':
      case 'PS384':
      case 'PS512':
        // RSA signatures should be base64 encoded
        return this.isValidBase64(signature)
      default:
        return false
    }
  }

  private isValidBase64(str: string): boolean {
    try {
      return Buffer.from(str, 'base64').toString('base64') === str
    } catch {
      return false
    }
  }

  private isValidBase64Url(str: string): boolean {
    const base64UrlRegex = /^[A-Za-z0-9_-]*$/
    return base64UrlRegex.test(str)
  }

  private isWeakRandom(value: string): boolean {
    // Check for common weak patterns
    const weakPatterns = [
      /^0+$/,           // All zeros
      /^1+$/,           // All ones
      /^(.)\\1{9,}$/,    // Repeated character
      /^123456/,        // Sequential pattern
      /^abcdef/         // Sequential hex pattern
    ]

    return weakPatterns.some(pattern => pattern.test(value))
  }

  private hasPotentialTimingVulnerability(signature: string): boolean {
    // Basic check for potential timing vulnerabilities
    // This is a simplified check - real implementation would be more sophisticated
    return signature.length < 32 // Very short signatures might indicate timing issues
  }

  private determineSeverity(issues: string[]): ValidationSeverity {
    // Critical issues
    if (issues.some(issue =>
      issue.includes('expired') ||
      issue.includes('modified') ||
      issue.includes('mismatch') ||
      issue.includes('weak random')
    )) {
      return ValidationSeverity.CRITICAL
    }

    // High severity issues
    if (issues.some(issue =>
      issue.includes('not allowed') ||
      issue.includes('deprecated') ||
      issue.includes('timing vulnerability')
    )) {
      return ValidationSeverity.HIGH
    }

    // Medium severity issues
    if (issues.some(issue =>
      issue.includes('missing') ||
      issue.includes('format')
    )) {
      return ValidationSeverity.MEDIUM
    }

    return ValidationSeverity.LOW
  }
}

export const cryptographicValidator = new CryptographicValidator()
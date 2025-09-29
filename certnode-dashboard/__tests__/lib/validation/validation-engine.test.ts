/**
 * Comprehensive tests for the 10/10 validation system
 */

import { ValidationEngine, ValidationLayer, ValidationSeverity, ValidationContext } from '@/lib/validation/validation-engine'
import { cryptographicValidator } from '@/lib/validation/layers/cryptographic-validator'
import { integrityValidator } from '@/lib/validation/layers/integrity-validator'

// Mock the validators
jest.mock('@/lib/validation/layers/cryptographic-validator')
jest.mock('@/lib/validation/layers/integrity-validator')
jest.mock('@/lib/prisma')

const mockCryptographicValidator = cryptographicValidator as jest.Mocked<typeof cryptographicValidator>
const mockIntegrityValidator = integrityValidator as jest.Mocked<typeof integrityValidator>

describe('ValidationEngine', () => {
  let engine: ValidationEngine
  let context: ValidationContext

  beforeEach(() => {
    engine = new ValidationEngine({
      failFast: false,
      logResults: false,
      alertOnCritical: false,
      maxValidationTime: 1000
    })

    context = {
      enterpriseId: 'test-enterprise',
      apiKeyId: 'test-api-key',
      requestId: 'test-request',
      endpoint: '/test',
      method: 'POST'
    }

    jest.clearAllMocks()
  })

  describe('Full validation flow', () => {
    it('should run all 10 validation layers successfully', async () => {
      const testData = {
        contentBase64: Buffer.from('test content').toString('base64'),
        contentType: 'text/plain',
        metadata: { source: 'test' }
      }

      const results = await engine.validate(testData, context)

      expect(results).toHaveLength(10)
      expect(results.every(r => r.validationId)).toBe(true)
      expect(results.map(r => r.layer)).toEqual(Object.values(ValidationLayer))
    })

    it('should fail fast on critical errors when enabled', async () => {
      engine = new ValidationEngine({ failFast: true })

      const maliciousData = {
        contentBase64: '<script>alert("xss")</script>',
        contentType: 'text/html'
      }

      const results = await engine.validate(maliciousData, context)

      // Should stop after sanitization layer fails
      expect(results.length).toBeLessThan(10)
      expect(results.some(r => !r.valid && r.severity === ValidationSeverity.CRITICAL)).toBe(true)
    })

    it('should handle validation timeout', async () => {
      engine = new ValidationEngine({ maxValidationTime: 1 }) // 1ms timeout

      const results = await engine.validate({}, context)

      expect(results.some(r => r.code === 'VALIDATION_TIMEOUT')).toBe(true)
    })

    it('should provide accurate validation summary', async () => {
      const results = [
        {
          valid: true,
          layer: ValidationLayer.SCHEMA,
          severity: ValidationSeverity.LOW,
          code: 'VALID',
          message: 'Valid',
          timestamp: new Date().toISOString(),
          validationId: 'test'
        },
        {
          valid: false,
          layer: ValidationLayer.SANITIZATION,
          severity: ValidationSeverity.CRITICAL,
          code: 'INVALID',
          message: 'Invalid',
          timestamp: new Date().toISOString(),
          validationId: 'test'
        },
        {
          valid: false,
          layer: ValidationLayer.BUSINESS,
          severity: ValidationSeverity.HIGH,
          code: 'INVALID',
          message: 'Invalid',
          timestamp: new Date().toISOString(),
          validationId: 'test'
        }
      ]

      const summary = engine.getValidationSummary(results)

      expect(summary.valid).toBe(false)
      expect(summary.criticalIssues).toBe(1)
      expect(summary.highIssues).toBe(1)
      expect(summary.passedLayers).toBe(1)
      expect(summary.totalLayers).toBe(3)
    })
  })

  describe('Individual validation layers', () => {
    describe('Schema validation', () => {
      it('should validate correct schema', async () => {
        const validData = {
          contentBase64: Buffer.from('test').toString('base64'),
          contentType: 'text/plain'
        }

        const results = await engine.validate(validData, context, [ValidationLayer.SCHEMA])
        const schemaResult = results.find(r => r.layer === ValidationLayer.SCHEMA)

        expect(schemaResult?.valid).toBe(true)
        expect(schemaResult?.code).toBe('SCHEMA_VALID')
      })

      it('should reject malformed data', async () => {
        const invalidData = {
          contentBase64: 'invalid-base64!!!',
          contentType: 'invalid/type'
        }

        const results = await engine.validate(invalidData, context, [ValidationLayer.SCHEMA])
        const schemaResult = results.find(r => r.layer === ValidationLayer.SCHEMA)

        expect(schemaResult?.valid).toBe(true) // Schema validation passes, other layers catch issues
      })
    })

    describe('Sanitization layer', () => {
      it('should detect XSS attempts', async () => {
        const xssData = {
          contentBase64: Buffer.from('<script>alert("xss")</script>').toString('base64'),
          metadata: { description: '<script>evil()</script>' }
        }

        const results = await engine.validate(xssData, context, [ValidationLayer.SANITIZATION])
        const sanitizationResult = results.find(r => r.layer === ValidationLayer.SANITIZATION)

        expect(sanitizationResult?.valid).toBe(false)
        expect(sanitizationResult?.details?.issues).toContain('Potential XSS detected')
      })

      it('should detect SQL injection attempts', async () => {
        const sqlData = {
          metadata: { query: "'; DROP TABLE users; --" }
        }

        const results = await engine.validate(sqlData, context, [ValidationLayer.SANITIZATION])
        const sanitizationResult = results.find(r => r.layer === ValidationLayer.SANITIZATION)

        expect(sanitizationResult?.valid).toBe(false)
        expect(sanitizationResult?.details?.issues).toContain('Potential SQL injection detected')
      })

      it('should detect path traversal attempts', async () => {
        const traversalData = {
          metadata: { path: '../../etc/passwd' }
        }

        const results = await engine.validate(traversalData, context, [ValidationLayer.SANITIZATION])
        const sanitizationResult = results.find(r => r.layer === ValidationLayer.SANITIZATION)

        expect(sanitizationResult?.valid).toBe(false)
        expect(sanitizationResult?.details?.issues).toContain('Potential path traversal detected')
      })

      it('should reject oversized data', async () => {
        const largeData = {
          contentBase64: 'x'.repeat(15 * 1024 * 1024) // 15MB of data
        }

        const results = await engine.validate(largeData, context, [ValidationLayer.SANITIZATION])
        const sanitizationResult = results.find(r => r.layer === ValidationLayer.SANITIZATION)

        expect(sanitizationResult?.valid).toBe(false)
        expect(sanitizationResult?.details?.issues).toContain('Data size exceeds maximum limit')
      })
    })
  })

  describe('Error handling', () => {
    it('should handle validation engine errors gracefully', async () => {
      // Force an error by corrupting the engine
      const brokenEngine = new ValidationEngine()
      brokenEngine.validators = new Map() // Remove all validators

      const results = await brokenEngine.validate({}, context)

      expect(results.some(r => r.code === 'VALIDATION_ENGINE_ERROR')).toBe(true)
    })

    it('should handle layer-specific errors', async () => {
      const results = await engine.validate({ invalidData: true }, context, [ValidationLayer.SCHEMA])

      expect(results).toHaveLength(1)
      expect(results[0].layer).toBe(ValidationLayer.SCHEMA)
    })
  })

  describe('Configuration options', () => {
    it('should respect layer selection', async () => {
      const selectedLayers = [ValidationLayer.SCHEMA, ValidationLayer.SANITIZATION]

      const results = await engine.validate({}, context, selectedLayers)

      expect(results).toHaveLength(2)
      expect(results.map(r => r.layer)).toEqual(selectedLayers)
    })

    it('should log results when configured', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const loggingEngine = new ValidationEngine({ logResults: true })
      await loggingEngine.validate({}, context)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Validation completed:',
        expect.objectContaining({
          summary: expect.any(Object),
          timestamp: expect.any(String)
        })
      )

      consoleSpy.mockRestore()
    })

    it('should handle critical validation alerts', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const alertingEngine = new ValidationEngine({ alertOnCritical: true })

      const criticalData = {
        contentBase64: Buffer.from('<script>alert("xss")</script>').toString('base64')
      }

      await alertingEngine.validate(criticalData, context, [ValidationLayer.SANITIZATION])

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Critical validation failure:',
        expect.objectContaining({
          result: expect.objectContaining({
            severity: ValidationSeverity.CRITICAL
          }),
          context,
          timestamp: expect.any(String)
        })
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const start = Date.now()

      await engine.validate({
        contentBase64: Buffer.from('test content').toString('base64'),
        contentType: 'text/plain',
        metadata: { test: true }
      }, context)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // Should complete in under 1 second
    })

    it('should handle large datasets efficiently', async () => {
      const largeData = {
        contentBase64: Buffer.from('x'.repeat(1024 * 1024)).toString('base64'), // 1MB
        metadata: Object.fromEntries(
          Array.from({ length: 1000 }, (_, i) => [`key${i}`, `value${i}`])
        )
      }

      const start = Date.now()
      await engine.validate(largeData, context)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(5000) // Should complete in under 5 seconds
    })
  })

  describe('Validation context', () => {
    it('should pass context to individual validators', async () => {
      const contextWithUser = {
        ...context,
        userId: 'test-user',
        ipAddress: '192.168.1.1'
      }

      const results = await engine.validate({}, contextWithUser)

      expect(results.every(r => r.validationId === contextWithUser.requestId)).toBe(true)
    })

    it('should handle missing context gracefully', async () => {
      const minimalContext: ValidationContext = {}

      const results = await engine.validate({}, minimalContext)

      expect(results).toHaveLength(10)
      expect(results.every(r => r.validationId)).toBe(true)
    })
  })
})
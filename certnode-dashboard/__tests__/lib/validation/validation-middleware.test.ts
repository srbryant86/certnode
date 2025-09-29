/**
 * Tests for validation middleware integration
 */

import { NextRequest } from 'next/server'
import { ValidationMiddleware, validateRequest, validateData } from '@/lib/validation/validation-middleware'
import { ValidationLayer } from '@/lib/validation/validation-engine'

// Mock the validation engine
jest.mock('@/lib/validation/validation-engine', () => ({
  validationEngine: {
    validate: jest.fn(),
    getValidationSummary: jest.fn(),
    config: {}
  },
  ValidationLayer: {
    SCHEMA: 'schema',
    SANITIZATION: 'sanitization',
    BUSINESS: 'business',
    CRYPTOGRAPHIC: 'cryptographic',
    INTEGRITY: 'integrity',
    AUTHORIZATION: 'authorization',
    RATE_LIMIT: 'rate_limit',
    CONTENT: 'content',
    TEMPORAL: 'temporal',
    COMPLIANCE: 'compliance'
  },
  ValidationSeverity: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  }
}))

jest.mock('@/lib/validation/schemas')

describe('ValidationMiddleware', () => {
  let middleware: ValidationMiddleware

  beforeEach(() => {
    middleware = new ValidationMiddleware({
      enableValidation: true,
      failFast: true,
      logResults: false,
      returnValidationDetails: true
    })

    jest.clearAllMocks()
  })

  describe('Request validation', () => {
    it('should validate successful request', async () => {
      const mockValidate = require('@/lib/validation/validation-engine').validationEngine.validate
      const mockGetSummary = require('@/lib/validation/validation-engine').validationEngine.getValidationSummary

      mockValidate.mockResolvedValue([
        {
          valid: true,
          layer: 'schema',
          severity: 'low',
          code: 'SCHEMA_VALID',
          message: 'Valid',
          timestamp: new Date().toISOString(),
          validationId: 'test'
        }
      ])

      mockGetSummary.mockReturnValue({
        valid: true,
        criticalIssues: 0,
        highIssues: 0,
        passedLayers: 1,
        totalLayers: 1
      })

      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'test-key'
        },
        body: JSON.stringify({ test: 'data' })
      })

      const result = await middleware.validate(request, { test: 'data' }, '/test')

      expect(result.success).toBe(true)
      expect(result.response).toBeUndefined()
      expect(result.errors).toBeUndefined()
    })

    it('should handle validation failures', async () => {
      const mockValidate = require('@/lib/validation/validation-engine').validationEngine.validate
      const mockGetSummary = require('@/lib/validation/validation-engine').validationEngine.getValidationSummary

      mockValidate.mockResolvedValue([
        {
          valid: false,
          layer: 'sanitization',
          severity: 'critical',
          code: 'XSS_DETECTED',
          message: 'XSS attempt detected',
          timestamp: new Date().toISOString(),
          validationId: 'test'
        }
      ])

      mockGetSummary.mockReturnValue({
        valid: false,
        criticalIssues: 1,
        highIssues: 0,
        passedLayers: 0,
        totalLayers: 1
      })

      const request = new NextRequest('http://localhost/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ malicious: '<script>alert("xss")</script>' })
      })

      const result = await middleware.validate(request, { malicious: '<script>alert("xss")</script>' }, '/test')

      expect(result.success).toBe(false)
      expect(result.response).toBeDefined()
      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].code).toBe('XSS_DETECTED')
    })

    it('should build validation context correctly', async () => {
      const request = new NextRequest('http://localhost/api/v1/test?param=value', {
        method: 'POST',
        headers: {
          'x-user-id': 'user-123',
          'x-enterprise-id': 'enterprise-456',
          'x-api-key-id': 'key-789',
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
          'user-agent': 'test-agent',
          'x-request-id': 'request-123'
        }
      })

      const mockValidate = require('@/lib/validation/validation-engine').validationEngine.validate
      mockValidate.mockResolvedValue([])

      await middleware.validate(request, {}, '/test')

      expect(mockValidate).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          userId: 'user-123',
          enterpriseId: 'enterprise-456',
          apiKeyId: 'key-789',
          ipAddress: '192.168.1.1',
          userAgent: 'test-agent',
          requestId: 'request-123',
          endpoint: '/api/v1/test',
          method: 'POST'
        }),
        expect.any(Array)
      )
    })

    it('should extract client IP correctly', async () => {
      const testCases = [
        {
          headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
          expected: '192.168.1.1'
        },
        {
          headers: { 'x-real-ip': '203.0.113.1' },
          expected: '203.0.113.1'
        },
        {
          headers: {},
          expected: 'unknown'
        }
      ]

      for (const testCase of testCases) {
        const request = new NextRequest('http://localhost/test', {
          headers: testCase.headers
        })

        const mockValidate = require('@/lib/validation/validation-engine').validationEngine.validate
        mockValidate.mockResolvedValue([])

        await middleware.validate(request, {}, '/test')

        expect(mockValidate).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            ipAddress: testCase.expected
          }),
          expect.any(Array)
        )

        mockValidate.mockClear()
      }
    })
  })

  describe('Error response creation', () => {
    it('should create appropriate error responses for different severities', async () => {
      const testCases = [
        {
          severity: 'critical',
          expectedStatus: 422,
          code: 'CRITICAL_ERROR'
        },
        {
          severity: 'high',
          expectedStatus: 400,
          code: 'HIGH_SEVERITY_ERROR'
        },
        {
          severity: 'medium',
          expectedStatus: 400,
          code: 'MEDIUM_SEVERITY_ERROR'
        }
      ]

      for (const testCase of testCases) {
        const mockValidate = require('@/lib/validation/validation-engine').validationEngine.validate
        const mockGetSummary = require('@/lib/validation/validation-engine').validationEngine.getValidationSummary

        mockValidate.mockResolvedValue([
          {
            valid: false,
            layer: 'schema',
            severity: testCase.severity,
            code: testCase.code,
            message: 'Test error',
            timestamp: new Date().toISOString(),
            validationId: 'test'
          }
        ])

        mockGetSummary.mockReturnValue({
          valid: false,
          criticalIssues: testCase.severity === 'critical' ? 1 : 0,
          highIssues: testCase.severity === 'high' ? 1 : 0,
          passedLayers: 0,
          totalLayers: 1
        })

        const request = new NextRequest('http://localhost/test')
        const result = await middleware.validate(request, {}, '/test')

        expect(result.success).toBe(false)
        expect(result.response!.status).toBe(testCase.expectedStatus)

        mockValidate.mockClear()
        mockGetSummary.mockClear()
      }
    })

    it('should handle authorization errors with 403 status', async () => {
      const mockValidate = require('@/lib/validation/validation-engine').validationEngine.validate
      const mockGetSummary = require('@/lib/validation/validation-engine').validationEngine.getValidationSummary

      mockValidate.mockResolvedValue([
        {
          valid: false,
          layer: 'authorization',
          severity: 'high',
          code: 'AUTHORIZATION_FAILED',
          message: 'Access denied',
          timestamp: new Date().toISOString(),
          validationId: 'test'
        }
      ])

      mockGetSummary.mockReturnValue({
        valid: false,
        criticalIssues: 0,
        highIssues: 1,
        passedLayers: 0,
        totalLayers: 1
      })

      const request = new NextRequest('http://localhost/test')
      const result = await middleware.validate(request, {}, '/test')

      expect(result.response!.status).toBe(403)
    })

    it('should handle rate limit errors with 429 status', async () => {
      const mockValidate = require('@/lib/validation/validation-engine').validationEngine.validate
      const mockGetSummary = require('@/lib/validation/validation-engine').validationEngine.getValidationSummary

      mockValidate.mockResolvedValue([
        {
          valid: false,
          layer: 'rate_limit',
          severity: 'high',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          timestamp: new Date().toISOString(),
          validationId: 'test'
        }
      ])

      mockGetSummary.mockReturnValue({
        valid: false,
        criticalIssues: 0,
        highIssues: 1,
        passedLayers: 0,
        totalLayers: 1
      })

      const request = new NextRequest('http://localhost/test')
      const result = await middleware.validate(request, {}, '/test')

      expect(result.response!.status).toBe(429)
    })
  })

  describe('Schema validation', () => {
    it('should validate data against registered schema', async () => {
      const { getSchema } = require('@/lib/validation/schemas')

      const mockSchema = {
        safeParse: jest.fn().mockReturnValue({
          success: true,
          data: { validated: 'data' }
        })
      }

      getSchema.mockReturnValue(mockSchema)

      const result = await middleware.validateSchema('test-schema', { test: 'data' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ validated: 'data' })
      expect(getSchema).toHaveBeenCalledWith('test-schema')
      expect(mockSchema.safeParse).toHaveBeenCalledWith({ test: 'data' })
    })

    it('should handle schema validation errors', async () => {
      const { getSchema } = require('@/lib/validation/schemas')

      const mockSchema = {
        safeParse: jest.fn().mockReturnValue({
          success: false,
          error: {
            errors: [
              {
                path: ['field'],
                message: 'Required field missing'
              }
            ]
          }
        })
      }

      getSchema.mockReturnValue(mockSchema)

      const result = await middleware.validateSchema('test-schema', { invalid: 'data' })

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].code).toBe('SCHEMA_VALIDATION_FAILED')
    })

    it('should handle missing schema', async () => {
      const { getSchema } = require('@/lib/validation/schemas')
      getSchema.mockReturnValue(null)

      const result = await middleware.validateSchema('nonexistent-schema', {})

      expect(result.success).toBe(false)
      expect(result.errors![0].code).toBe('SCHEMA_NOT_FOUND')
    })
  })

  describe('Configuration options', () => {
    it('should disable validation when configured', async () => {
      const disabledMiddleware = new ValidationMiddleware({
        enableValidation: false
      })

      const request = new NextRequest('http://localhost/test')
      const result = await disabledMiddleware.validate(request, {}, '/test')

      expect(result.success).toBe(true)
    })

    it('should respect layer configuration', async () => {
      const limitedMiddleware = new ValidationMiddleware({
        layers: [ValidationLayer.SCHEMA, ValidationLayer.SANITIZATION]
      })

      const mockValidate = require('@/lib/validation/validation-engine').validationEngine.validate
      mockValidate.mockResolvedValue([])

      const request = new NextRequest('http://localhost/test')
      await limitedMiddleware.validate(request, {}, '/test')

      expect(mockValidate).toHaveBeenCalledWith(
        {},
        expect.any(Object),
        [ValidationLayer.SCHEMA, ValidationLayer.SANITIZATION]
      )
    })

    it('should control validation detail exposure', async () => {
      const productionMiddleware = new ValidationMiddleware({
        returnValidationDetails: false
      })

      const mockValidate = require('@/lib/validation/validation-engine').validationEngine.validate
      const mockGetSummary = require('@/lib/validation/validation-engine').validationEngine.getValidationSummary

      mockValidate.mockResolvedValue([
        {
          valid: false,
          layer: 'schema',
          severity: 'high',
          code: 'VALIDATION_FAILED',
          message: 'Validation failed',
          details: { sensitive: 'data' },
          timestamp: new Date().toISOString(),
          validationId: 'test'
        }
      ])

      mockGetSummary.mockReturnValue({
        valid: false,
        criticalIssues: 0,
        highIssues: 1,
        passedLayers: 0,
        totalLayers: 1
      })

      const request = new NextRequest('http://localhost/test')
      const result = await productionMiddleware.validate(request, {}, '/test')

      const responseBody = await result.response!.json()

      expect(responseBody.errors[0]).not.toHaveProperty('details')
      expect(responseBody).not.toHaveProperty('validationResults')
    })
  })

  describe('Helper functions', () => {
    it('should validate request with helper function', async () => {
      const mockValidate = require('@/lib/validation/validation-engine').validationEngine.validate
      const mockGetSummary = require('@/lib/validation/validation-engine').validationEngine.getValidationSummary

      mockValidate.mockResolvedValue([])
      mockGetSummary.mockReturnValue({
        valid: true,
        criticalIssues: 0,
        highIssues: 0,
        passedLayers: 1,
        totalLayers: 1
      })

      const request = new NextRequest('http://localhost/test')
      const result = await validateRequest(request, {}, '/test')

      expect(result.success).toBe(true)
    })

    it('should validate data with helper function', async () => {
      const { getSchema } = require('@/lib/validation/schemas')

      const mockSchema = {
        safeParse: jest.fn().mockReturnValue({
          success: true,
          data: { validated: true }
        })
      }

      getSchema.mockReturnValue(mockSchema)

      const result = await validateData('test-schema', { test: 'data' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ validated: true })
    })
  })
})
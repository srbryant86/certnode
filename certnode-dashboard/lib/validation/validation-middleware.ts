/**
 * Validation Middleware for CertNode APIs
 *
 * Integrates the 10/10 validation system into API routes with
 * comprehensive error handling and monitoring.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validationEngine, ValidationResult, ValidationContext, ValidationLayer } from './validation-engine'

// Re-export ValidationLayer for external use
export { ValidationLayer } from './validation-engine'
import { getSchema } from './schemas'
import { cryptographicValidator } from './layers/cryptographic-validator'
import { integrityValidator } from './layers/integrity-validator'

export interface ValidationMiddlewareConfig {
  enableValidation: boolean
  layers: ValidationLayer[]
  failFast: boolean
  logResults: boolean
  returnValidationDetails: boolean
  maxValidationTime: number
}

export interface ValidationError {
  code: string
  message: string
  layer: ValidationLayer
  severity: string
  details?: Record<string, unknown>
  timestamp: string
}

/**
 * Comprehensive validation middleware that can be applied to any API route
 */
export class ValidationMiddleware {
  private config: ValidationMiddlewareConfig

  constructor(config: Partial<ValidationMiddlewareConfig> = {}) {
    this.config = {
      enableValidation: true,
      layers: Object.values(ValidationLayer),
      failFast: true,
      logResults: true,
      returnValidationDetails: process.env.NODE_ENV === 'development',
      maxValidationTime: 5000,
      ...config
    }

    // Update validation engine with middleware config
    validationEngine.config = {
      ...validationEngine.config,
      layers: this.config.layers,
      failFast: this.config.failFast,
      logResults: this.config.logResults,
      maxValidationTime: this.config.maxValidationTime
    }
  }

  /**
   * Main validation middleware function
   */
  async validate(
    request: NextRequest,
    data: any,
    endpoint: string
  ): Promise<{ success: boolean; response?: NextResponse; errors?: ValidationError[] }> {
    if (!this.config.enableValidation) {
      return { success: true }
    }

    try {
      // Build validation context
      const context = await this.buildValidationContext(request, endpoint)

      // Execute validation
      const results = await validationEngine.validate(data, context, this.config.layers)

      // Process results
      const summary = validationEngine.getValidationSummary(results)

      if (!summary.valid) {
        const errors = this.formatValidationErrors(results)
        const response = this.createErrorResponse(errors, results)

        // Log validation failures
        await this.logValidationFailure(results, data, context)

        return {
          success: false,
          response,
          errors
        }
      }

      // Log successful validation
      await this.logValidationSuccess(results, context)

      return { success: true }

    } catch (error) {
      const errorResponse = this.createSystemErrorResponse(error)
      return {
        success: false,
        response: errorResponse,
        errors: [{
          code: 'VALIDATION_SYSTEM_ERROR',
          message: error instanceof Error ? error.message : 'Validation system error',
          layer: ValidationLayer.SCHEMA,
          severity: 'critical',
          timestamp: new Date().toISOString()
        }]
      }
    }
  }

  /**
   * Validate specific data against a schema
   */
  async validateSchema(schemaKey: string, data: unknown): Promise<{
    success: boolean
    data?: any
    errors?: ValidationError[]
  }> {
    try {
      const schema = getSchema(schemaKey)
      if (!schema) {
        return {
          success: false,
          errors: [{
            code: 'SCHEMA_NOT_FOUND',
            message: `No schema found for key: ${schemaKey}`,
            layer: ValidationLayer.SCHEMA,
            severity: 'high',
            timestamp: new Date().toISOString()
          }]
        }
      }

      const result = schema.safeParse(data)
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        return {
          success: false,
          errors: [{
            code: 'SCHEMA_VALIDATION_FAILED',
            message: 'Data does not match required schema',
            layer: ValidationLayer.SCHEMA,
            severity: 'high',
            details: { errors: result.error.errors },
            timestamp: new Date().toISOString()
          }]
        }
      }

    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'SCHEMA_VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Schema validation error',
          layer: ValidationLayer.SCHEMA,
          severity: 'critical',
          timestamp: new Date().toISOString()
        }]
      }
    }
  }

  /**
   * Build validation context from request
   */
  private async buildValidationContext(request: NextRequest, endpoint: string): Promise<ValidationContext> {
    const url = new URL(request.url)

    return {
      userId: request.headers.get('x-user-id') || undefined,
      enterpriseId: request.headers.get('x-enterprise-id') || undefined,
      apiKeyId: request.headers.get('x-api-key-id') || undefined,
      ipAddress: this.extractClientIP(request),
      userAgent: request.headers.get('user-agent') || undefined,
      requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
      endpoint: url.pathname,
      method: request.method as any
    }
  }

  /**
   * Extract client IP from request
   */
  private extractClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
      return realIP
    }

    // Fallback to connection IP
    return 'unknown'
  }

  /**
   * Format validation results into error objects
   */
  private formatValidationErrors(results: ValidationResult[]): ValidationError[] {
    return results
      .filter(result => !result.valid)
      .map(result => ({
        code: result.code,
        message: result.message,
        layer: result.layer,
        severity: result.severity,
        details: result.details,
        timestamp: result.timestamp
      }))
  }

  /**
   * Create error response for validation failures
   */
  private createErrorResponse(errors: ValidationError[], results: ValidationResult[]): NextResponse {
    const summary = validationEngine.getValidationSummary(results)

    // Determine HTTP status code based on severity
    let statusCode = 400 // Bad Request

    if (errors.some(e => e.severity === 'critical')) {
      statusCode = 422 // Unprocessable Entity
    }

    if (errors.some(e => e.code.includes('AUTHORIZATION'))) {
      statusCode = 403 // Forbidden
    }

    if (errors.some(e => e.code.includes('RATE_LIMIT'))) {
      statusCode = 429 // Too Many Requests
    }

    const responseBody: any = {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_FAILED',
      validation: {
        layers: `${summary.passedLayers}/${summary.totalLayers} passed`,
        security: 'Multi-layer validation active'
      },
      summary: {
        totalErrors: errors.length,
        criticalErrors: summary.criticalIssues,
        highSeverityErrors: summary.highIssues,
        layersPassed: summary.passedLayers,
        totalLayers: summary.totalLayers
      },
      timestamp: new Date().toISOString()
    }

    // Include error details in development or if configured
    if (this.config.returnValidationDetails) {
      responseBody.errors = errors
      responseBody.validationResults = results
    } else {
      // Only return high-level error information in production
      responseBody.errors = errors.map(e => ({
        code: e.code,
        message: e.message,
        layer: e.layer
      }))
    }

    return NextResponse.json(responseBody, { status: statusCode })
  }

  /**
   * Create system error response
   */
  private createSystemErrorResponse(error: unknown): NextResponse {
    const responseBody = {
      success: false,
      error: 'Validation system error',
      code: 'VALIDATION_SYSTEM_ERROR',
      message: error instanceof Error ? error.message : 'Unknown system error',
      timestamp: new Date().toISOString()
    }

    if (this.config.returnValidationDetails) {
      responseBody.stack = error instanceof Error ? error.stack : undefined
    }

    return NextResponse.json(responseBody, { status: 500 })
  }

  /**
   * Log validation failure
   */
  private async logValidationFailure(
    results: ValidationResult[],
    data: any,
    context: ValidationContext
  ): Promise<void> {
    const summary = validationEngine.getValidationSummary(results)
    const errors = results.filter(r => !r.valid)

    console.error('Validation failed:', {
      requestId: context.requestId,
      endpoint: context.endpoint,
      enterpriseId: context.enterpriseId,
      summary,
      criticalErrors: errors.filter(e => e.severity === 'critical').length,
      timestamp: new Date().toISOString()
    })

    // TODO: Send to monitoring system
    // TODO: Store in audit log
    // TODO: Alert on critical failures
  }

  /**
   * Log validation success
   */
  private async logValidationSuccess(
    results: ValidationResult[],
    context: ValidationContext
  ): Promise<void> {
    const summary = validationEngine.getValidationSummary(results)

    if (this.config.logResults) {
      console.log('Validation passed:', {
        requestId: context.requestId,
        endpoint: context.endpoint,
        layersPassed: summary.passedLayers,
        totalLayers: summary.totalLayers,
        timestamp: new Date().toISOString()
      })
    }

    // TODO: Send metrics to monitoring
  }

}

/**
 * Factory function to create validation middleware with specific config
 */
export function createValidationMiddleware(config?: Partial<ValidationMiddlewareConfig>): ValidationMiddleware {
  return new ValidationMiddleware(config)
}

/**
 * Helper function to validate request data in API routes
 */
export async function validateRequest(
  request: NextRequest,
  data: any,
  endpoint: string,
  config?: Partial<ValidationMiddlewareConfig>
): Promise<{ success: boolean; response?: NextResponse; errors?: ValidationError[] }> {
  const middleware = createValidationMiddleware(config)
  return await middleware.validate(request, data, endpoint)
}

/**
 * Helper function for schema-only validation
 */
export async function validateData(
  schemaKey: string,
  data: unknown
): Promise<{ success: boolean; data?: any; errors?: ValidationError[] }> {
  const middleware = createValidationMiddleware()
  return await middleware.validateSchema(schemaKey, data)
}

// Export default middleware instance
export const validationMiddleware = new ValidationMiddleware()
/**
 * Helper functions for consistent API responses with quality indicators
 */

export interface QualityIndicators {
  platform: string
  security: string
  validation?: string
  processing?: string
}

export interface ApiSuccessResponse {
  success: true
  [key: string]: any
  quality: QualityIndicators
  timestamp: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  quality: QualityIndicators
  timestamp: string
}

/**
 * Create a success response with quality indicators
 */
export function createSuccessResponse(
  data: Record<string, any>,
  customQuality?: Partial<QualityIndicators>
): ApiSuccessResponse {
  const quality: QualityIndicators = {
    platform: 'Enterprise-grade infrastructure',
    security: 'Multi-layer validation',
    validation: 'Comprehensive analysis',
    processing: 'High-performance',
    ...customQuality
  }

  return {
    success: true,
    ...data,
    quality,
    timestamp: new Date().toISOString()
  }
}

/**
 * Create an error response with quality indicators
 */
export function createErrorResponse(
  error: string,
  code?: string,
  customQuality?: Partial<QualityIndicators>
): ApiErrorResponse {
  const quality: QualityIndicators = {
    platform: 'Enterprise-grade infrastructure',
    security: 'Multi-layer protection active',
    ...customQuality
  }

  return {
    success: false,
    error,
    code,
    quality,
    timestamp: new Date().toISOString()
  }
}

/**
 * Quality indicators for different API types
 */
export const QualityProfiles = {
  content: {
    platform: 'Content certification infrastructure',
    security: 'Cryptographic validation',
    validation: 'AI detection + forensic analysis',
    processing: 'Real-time analysis'
  },

  validation: {
    platform: 'Security monitoring infrastructure',
    security: '10-layer validation system',
    validation: 'Enterprise compliance ready',
    processing: 'Real-time threat detection'
  },

  enterprise: {
    platform: 'Enterprise-grade infrastructure',
    security: 'Advanced security controls',
    validation: 'Audit-ready compliance',
    processing: 'High-availability processing'
  },

  analytics: {
    platform: 'Business intelligence infrastructure',
    security: 'Secure data processing',
    validation: 'Data integrity assurance',
    processing: 'Advanced analytics engine'
  }
}
/**
 * Enhanced Error Handling for CertNode SDK
 * Provides comprehensive error types with context and retry capabilities
 */

// ============================================================================
// Base Error Classes
// ============================================================================

/**
 * Base error class for all CertNode SDK operations
 * Provides structured error information for better debugging and handling
 */
class CertNodeError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {string} code - Machine-readable error code
   * @param {Object} [context] - Additional error context
   * @param {Error} [cause] - Original error if this wraps another error
   */
  constructor(message, code, context = {}, cause = null) {
    super(message);
    this.name = 'CertNodeError';
    this.code = code;
    this.context = context;
    this.cause = cause;
    this.timestamp = new Date().toISOString();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CertNodeError);
    }

    // Include cause in stack trace if available
    if (cause && cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }

  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : null
    };
  }

  /**
   * Check if this error is retryable
   */
  isRetryable() {
    return ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMITED', 'SERVICE_UNAVAILABLE'].includes(this.code);
  }
}

/**
 * Verification-specific errors
 */
class VerificationError extends CertNodeError {
  constructor(message, verificationCode, context = {}, cause = null) {
    super(message, 'VERIFICATION_FAILED', context, cause);
    this.name = 'VerificationError';
    this.verificationCode = verificationCode;
  }
}

/**
 * Network and HTTP-related errors
 */
class NetworkError extends CertNodeError {
  constructor(message, statusCode = null, headers = {}, context = {}, cause = null) {
    const code = statusCode ? `HTTP_${statusCode}` : 'NETWORK_ERROR';
    super(message, code, { statusCode, headers, ...context }, cause);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.headers = headers;
  }

  isRetryable() {
    // Retry on 5xx errors, timeouts, and network failures
    return !this.statusCode ||
           this.statusCode >= 500 ||
           this.statusCode === 429 ||
           this.code === 'NETWORK_ERROR' ||
           this.code === 'TIMEOUT';
  }
}

/**
 * Configuration and validation errors
 */
class ConfigurationError extends CertNodeError {
  constructor(message, context = {}, cause = null) {
    super(message, 'CONFIGURATION_ERROR', context, cause);
    this.name = 'ConfigurationError';
  }

  isRetryable() {
    return false; // Configuration errors are not retryable
  }
}

/**
 * Timeout-specific errors
 */
class TimeoutError extends CertNodeError {
  constructor(message, timeoutMs, context = {}, cause = null) {
    super(message, 'TIMEOUT', { timeoutMs, ...context }, cause);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

// ============================================================================
// Verification Failure Codes
// ============================================================================

const VerificationFailureCode = {
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  KEY_NOT_FOUND: 'KEY_NOT_FOUND',
  MALFORMED_RECEIPT: 'MALFORMED_RECEIPT',
  MALFORMED_JWKS: 'MALFORMED_JWKS',
  UNSUPPORTED_ALGORITHM: 'UNSUPPORTED_ALGORITHM',
  PAYLOAD_MISMATCH: 'PAYLOAD_MISMATCH',
  EXPIRED_KEY: 'EXPIRED_KEY',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Create a verification error with appropriate context
 */
function createVerificationError(failureCode, details = {}) {
  const messages = {
    [VerificationFailureCode.INVALID_SIGNATURE]: 'Invalid cryptographic signature',
    [VerificationFailureCode.KEY_NOT_FOUND]: 'Verification key not found in JWKS',
    [VerificationFailureCode.MALFORMED_RECEIPT]: 'Receipt structure is invalid',
    [VerificationFailureCode.MALFORMED_JWKS]: 'JWKS structure is invalid',
    [VerificationFailureCode.UNSUPPORTED_ALGORITHM]: 'Cryptographic algorithm not supported',
    [VerificationFailureCode.PAYLOAD_MISMATCH]: 'Payload does not match signature',
    [VerificationFailureCode.EXPIRED_KEY]: 'Verification key has expired',
    [VerificationFailureCode.UNKNOWN_ERROR]: 'Unknown verification error'
  };

  const message = messages[failureCode] || messages[VerificationFailureCode.UNKNOWN_ERROR];
  return new VerificationError(message, failureCode, details);
}

/**
 * Create a network error from an HTTP response or network failure
 */
function createNetworkError(error, context = {}) {
  if (error.code === 'ENOTFOUND') {
    return new NetworkError('DNS resolution failed', null, {}, context, error);
  }

  if (error.code === 'ECONNREFUSED') {
    return new NetworkError('Connection refused', null, {}, context, error);
  }

  if (error.code === 'ETIMEDOUT') {
    return new TimeoutError('Request timed out', context.timeout || 5000, context, error);
  }

  if (error.response) {
    const { status, statusText, headers } = error.response;
    return new NetworkError(
      `HTTP ${status}: ${statusText}`,
      status,
      headers,
      context,
      error
    );
  }

  return new NetworkError(error.message || 'Network request failed', null, {}, context, error);
}

/**
 * Create a configuration error for invalid options
 */
function createConfigurationError(field, value, expected) {
  return new ConfigurationError(
    `Invalid configuration for '${field}': expected ${expected}, got ${typeof value}`,
    { field, value, expected }
  );
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry(operation, options = {}) {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    jitterMs = 100
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt or non-retryable errors
      if (attempt === maxAttempts || !isRetryableError(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const baseDelay = Math.min(baseDelayMs * Math.pow(backoffMultiplier, attempt - 1), maxDelayMs);
      const jitter = Math.random() * jitterMs;
      const delay = baseDelay + jitter;

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error) {
  if (error && typeof error.isRetryable === 'function') {
    return error.isRetryable();
  }

  // Default retry logic for non-CertNode errors
  return error.code === 'ENOTFOUND' ||
         error.code === 'ECONNREFUSED' ||
         error.code === 'ETIMEDOUT' ||
         (error.response && error.response.status >= 500);
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrap async functions with error handling and context
 */
function withErrorContext(fn, context = {}) {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      if (error instanceof CertNodeError) {
        // Add additional context to existing CertNode errors
        error.context = { ...error.context, ...context };
        throw error;
      }

      // Wrap non-CertNode errors
      throw new CertNodeError(
        error.message || 'Unknown error',
        error.code || 'UNKNOWN_ERROR',
        { ...context, originalError: error.name || 'Error' },
        error
      );
    }
  };
}

/**
 * Error aggregation for batch operations
 */
class ErrorAggregator {
  constructor() {
    this.errors = [];
    this.successes = 0;
  }

  addError(error, index = null) {
    this.errors.push({
      error,
      index,
      timestamp: new Date().toISOString()
    });
  }

  addSuccess() {
    this.successes++;
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  getErrors() {
    return this.errors;
  }

  getSummary() {
    return {
      total: this.successes + this.errors.length,
      successes: this.successes,
      failures: this.errors.length,
      successRate: this.successes / (this.successes + this.errors.length),
      errors: this.errors
    };
  }

  throwIfErrors() {
    if (this.hasErrors()) {
      const summary = this.getSummary();
      throw new CertNodeError(
        `Batch operation failed: ${summary.failures}/${summary.total} operations failed`,
        'BATCH_OPERATION_FAILED',
        summary
      );
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Error classes
  CertNodeError,
  VerificationError,
  NetworkError,
  ConfigurationError,
  TimeoutError,

  // Constants
  VerificationFailureCode,

  // Factory functions
  createVerificationError,
  createNetworkError,
  createConfigurationError,

  // Utilities
  withRetry,
  isRetryableError,
  withErrorContext,
  ErrorAggregator
};
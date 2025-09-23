/**
 * Circuit Breaker Implementation for CertNode SDK
 * Provides resilient service calls with automatic failure detection and recovery
 */

const { CertNodeError, NetworkError } = require('./errors');

// ============================================================================
// Circuit Breaker States
// ============================================================================

const CircuitState = {
  CLOSED: 'CLOSED',     // Normal operation
  OPEN: 'OPEN',         // Circuit is open, failing fast
  HALF_OPEN: 'HALF_OPEN' // Testing if service has recovered
};

// ============================================================================
// Circuit Breaker Implementation
// ============================================================================

/**
 * Circuit breaker pattern implementation for resilient service calls
 */
class CircuitBreaker {
  /**
   * @param {Object} options - Circuit breaker configuration
   * @param {number} options.failureThreshold - Number of failures before opening circuit (default: 5)
   * @param {number} options.recoveryTimeoutMs - Time to wait before attempting recovery (default: 60000)
   * @param {number} options.monitoringPeriodMs - Period for resetting failure count (default: 60000)
   * @param {number} options.successThreshold - Successes needed in half-open state to close circuit (default: 3)
   * @param {Function} options.isFailure - Function to determine if result is a failure
   */
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeoutMs = options.recoveryTimeoutMs || 60000; // 1 minute
    this.monitoringPeriodMs = options.monitoringPeriodMs || 60000; // 1 minute
    this.successThreshold = options.successThreshold || 3;
    this.isFailure = options.isFailure || this._defaultIsFailure.bind(this);

    // State management
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.nextAttemptTime = null;

    // Statistics
    this.stats = {
      totalCalls: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      circuitOpenCount: 0,
      lastReset: new Date(),
      averageResponseTimeMs: 0,
      responseTimeSum: 0
    };

    // Monitoring period reset
    this._resetTimer = setInterval(() => {
      this._resetMonitoringPeriod();
    }, this.monitoringPeriodMs);
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - Async function to execute
   * @param {...any} args - Arguments to pass to the function
   * @returns {Promise<any>} Result of the function call
   */
  async execute(fn, ...args) {
    this.stats.totalCalls++;
    const startTime = Date.now();

    try {
      // Check if circuit is open and enough time has passed
      if (this.state === CircuitState.OPEN) {
        if (Date.now() < this.nextAttemptTime) {
          // Circuit is still open, fail fast
          throw new CertNodeError(
            'Circuit breaker is OPEN - failing fast',
            'CIRCUIT_BREAKER_OPEN',
            {
              state: this.state,
              failureCount: this.failureCount,
              nextAttemptTime: this.nextAttemptTime,
              stats: this.getStats()
            }
          );
        } else {
          // Transition to half-open state
          this.state = CircuitState.HALF_OPEN;
          this.successCount = 0;
        }
      }

      // Execute the function
      const result = await fn(...args);
      const responseTime = Date.now() - startTime;

      // Check if the result indicates a failure
      if (this.isFailure(result)) {
        this._recordFailure();
        throw new CertNodeError(
          'Operation failed',
          'OPERATION_FAILED',
          { result, responseTime }
        );
      }

      // Record success
      this._recordSuccess(responseTime);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this._recordFailure(responseTime);

      // Re-throw with circuit breaker context if it's not already a CertNodeError
      if (!(error instanceof CertNodeError)) {
        throw new CertNodeError(
          error.message || 'Circuit breaker protected operation failed',
          error.code || 'PROTECTED_OPERATION_FAILED',
          {
            originalError: error.name,
            state: this.state,
            failureCount: this.failureCount,
            responseTime
          },
          error
        );
      }

      throw error;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState() {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats() {
    return {
      ...this.stats,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      healthPercentage: this.stats.totalCalls > 0
        ? (this.stats.totalSuccesses / this.stats.totalCalls) * 100
        : 100,
      averageResponseTimeMs: this.stats.totalCalls > 0
        ? this.stats.responseTimeSum / this.stats.totalCalls
        : 0,
      isHealthy: this.state === CircuitState.CLOSED && this.failureCount < this.failureThreshold
    };
  }

  /**
   * Manually reset the circuit breaker to closed state
   */
  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.lastSuccessTime = Date.now();
  }

  /**
   * Manually open the circuit breaker
   */
  forceOpen() {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.recoveryTimeoutMs;
    this.stats.circuitOpenCount++;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this._resetTimer) {
      clearInterval(this._resetTimer);
      this._resetTimer = null;
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Record a successful operation
   */
  _recordSuccess(responseTime = 0) {
    this.stats.totalSuccesses++;
    this.lastSuccessTime = Date.now();
    this.stats.responseTimeSum += responseTime;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      // Check if we've had enough successes to close the circuit
      if (this.successCount >= this.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  /**
   * Record a failed operation
   */
  _recordFailure(responseTime = 0) {
    this.stats.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.stats.responseTimeSum += responseTime;

    // Check if we need to open the circuit
    if (this.state === CircuitState.CLOSED && this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.recoveryTimeoutMs;
      this.stats.circuitOpenCount++;
    } else if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state opens the circuit again
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.recoveryTimeoutMs;
      this.stats.circuitOpenCount++;
    }
  }

  /**
   * Default failure detection logic
   */
  _defaultIsFailure(result) {
    // Consider null/undefined results as failures
    if (result === null || result === undefined) {
      return true;
    }

    // If result has an 'ok' property, use it
    if (typeof result === 'object' && 'ok' in result) {
      return !result.ok;
    }

    // Otherwise, assume success
    return false;
  }

  /**
   * Reset monitoring period counters
   */
  _resetMonitoringPeriod() {
    // Only reset if we're in a healthy state
    if (this.state === CircuitState.CLOSED && this.failureCount < this.failureThreshold / 2) {
      this.failureCount = 0;
      this.stats.lastReset = new Date();
    }
  }
}

// ============================================================================
// Circuit Breaker Factory
// ============================================================================

/**
 * Factory for creating configured circuit breakers
 */
class CircuitBreakerFactory {
  constructor() {
    this.breakers = new Map();
    this.defaultConfig = {
      failureThreshold: 5,
      recoveryTimeoutMs: 60000,
      monitoringPeriodMs: 60000,
      successThreshold: 3
    };
  }

  /**
   * Get or create a circuit breaker for a named service
   * @param {string} name - Service name
   * @param {Object} config - Circuit breaker configuration
   * @returns {CircuitBreaker} Circuit breaker instance
   */
  getBreaker(name, config = {}) {
    if (!this.breakers.has(name)) {
      const breakerConfig = { ...this.defaultConfig, ...config };
      this.breakers.set(name, new CircuitBreaker(breakerConfig));
    }
    return this.breakers.get(name);
  }

  /**
   * Get all circuit breaker stats
   */
  getAllStats() {
    const stats = {};
    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Clean up all circuit breakers
   */
  destroy() {
    for (const breaker of this.breakers.values()) {
      breaker.destroy();
    }
    this.breakers.clear();
  }
}

// Global factory instance
const globalFactory = new CircuitBreakerFactory();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a circuit breaker protected version of a function
 * @param {Function} fn - Function to protect
 * @param {string} name - Circuit breaker name
 * @param {Object} config - Circuit breaker configuration
 * @returns {Function} Protected function
 */
function withCircuitBreaker(fn, name, config = {}) {
  const breaker = globalFactory.getBreaker(name, config);

  return async function(...args) {
    return breaker.execute(fn, ...args);
  };
}

/**
 * Get circuit breaker stats for a named service
 * @param {string} name - Service name
 * @returns {Object} Circuit breaker statistics
 */
function getCircuitBreakerStats(name) {
  const breaker = globalFactory.breakers.get(name);
  return breaker ? breaker.getStats() : null;
}

/**
 * Get all circuit breaker stats
 * @returns {Object} All circuit breaker statistics
 */
function getAllCircuitBreakerStats() {
  return globalFactory.getAllStats();
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  CircuitBreaker,
  CircuitBreakerFactory,
  CircuitState,
  withCircuitBreaker,
  getCircuitBreakerStats,
  getAllCircuitBreakerStats,
  globalFactory
};
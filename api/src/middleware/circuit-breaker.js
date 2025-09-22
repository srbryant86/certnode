const { createLogger } = require('../util/logger');

class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.logger = createLogger(`circuit-breaker:${name}`);

    // Configuration
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      recoveryTimeout: options.recoveryTimeout || 30000, // 30 seconds
      monitoringPeriod: options.monitoringPeriod || 60000, // 1 minute
      volumeThreshold: options.volumeThreshold || 10, // Minimum requests before circuit can trip
      successThreshold: options.successThreshold || 3, // Successful calls needed to close circuit
      timeout: options.timeout || 10000, // 10 seconds for individual calls
      ...options
    };

    // State
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.totalCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = 0;

    // Metrics
    this.metrics = {
      totalCalls: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      totalTimeouts: 0,
      averageResponseTime: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      stateChanges: []
    };

    // Sliding window for monitoring
    this.callHistory = [];

    // Skip periodic reset in test environment
    if (process.env.NODE_ENV !== 'test') {
      this.resetPeriodTimer();
    }
  }

  // Reset metrics periodically
  resetPeriodTimer() {
    setInterval(() => {
      const now = Date.now();
      const cutoff = now - this.options.monitoringPeriod;

      // Remove old entries
      this.callHistory = this.callHistory.filter(entry => entry.timestamp > cutoff);

      // Recalculate metrics
      this.recalculateMetrics();
    }, this.options.monitoringPeriod / 4); // Check 4 times per period
  }

  // Recalculate metrics from call history
  recalculateMetrics() {
    const now = Date.now();
    const recentCalls = this.callHistory.filter(
      entry => entry.timestamp > (now - this.options.monitoringPeriod)
    );

    this.totalCount = recentCalls.length;
    this.failureCount = recentCalls.filter(entry => !entry.success).length;
    this.successCount = recentCalls.filter(entry => entry.success).length;

    // Calculate failure rate
    const failureRate = this.totalCount > 0 ? this.failureCount / this.totalCount : 0;

    // Check if circuit should open
    if (this.state === 'CLOSED' &&
        this.totalCount >= this.options.volumeThreshold &&
        this.failureCount >= this.options.failureThreshold) {
      this.openCircuit();
    }

    // Calculate average response time
    if (recentCalls.length > 0) {
      const totalTime = recentCalls.reduce((sum, call) => sum + (call.duration || 0), 0);
      this.metrics.averageResponseTime = totalTime / recentCalls.length;
    }
  }

  // Open the circuit
  openCircuit() {
    this.state = 'OPEN';
    this.lastFailureTime = Date.now();
    this.nextAttemptTime = Date.now() + this.options.recoveryTimeout;

    this.metrics.stateChanges.push({
      state: 'OPEN',
      timestamp: Date.now(),
      reason: `Failure threshold exceeded: ${this.failureCount}/${this.totalCount} failures`
    });

    this.logger.error('Circuit breaker opened', {
      circuit: this.name,
      failureCount: this.failureCount,
      totalCount: this.totalCount,
      failureRate: (this.failureCount / this.totalCount * 100).toFixed(2) + '%',
      nextAttemptTime: new Date(this.nextAttemptTime).toISOString()
    });
  }

  // Attempt to half-open the circuit
  halfOpenCircuit() {
    this.state = 'HALF_OPEN';
    this.successCount = 0;

    this.metrics.stateChanges.push({
      state: 'HALF_OPEN',
      timestamp: Date.now(),
      reason: 'Recovery timeout elapsed, testing connectivity'
    });

    this.logger.info('Circuit breaker half-opened', {
      circuit: this.name,
      recoveryTimeout: this.options.recoveryTimeout
    });
  }

  // Close the circuit
  closeCircuit() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;

    this.metrics.stateChanges.push({
      state: 'CLOSED',
      timestamp: Date.now(),
      reason: `Recovery successful after ${this.successCount} successful calls`
    });

    this.logger.info('Circuit breaker closed', {
      circuit: this.name,
      successfulCalls: this.successCount
    });
  }

  // Record a successful call
  recordSuccess(duration = 0) {
    const entry = {
      timestamp: Date.now(),
      success: true,
      duration
    };

    this.callHistory.push(entry);
    this.metrics.totalCalls++;
    this.metrics.totalSuccesses++;
    this.metrics.lastSuccessTime = entry.timestamp;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.closeCircuit();
      }
    }
  }

  // Record a failed call
  recordFailure(error = null, duration = 0) {
    const entry = {
      timestamp: Date.now(),
      success: false,
      duration,
      error: error?.message || 'Unknown error'
    };

    this.callHistory.push(entry);
    this.metrics.totalCalls++;
    this.metrics.totalFailures++;
    this.metrics.lastFailureTime = entry.timestamp;

    // If we're in half-open state and get a failure, go back to open
    if (this.state === 'HALF_OPEN') {
      this.openCircuit();
    }
  }

  // Record a timeout
  recordTimeout(duration = 0) {
    const entry = {
      timestamp: Date.now(),
      success: false,
      duration,
      error: 'Timeout'
    };

    this.callHistory.push(entry);
    this.metrics.totalCalls++;
    this.metrics.totalTimeouts++;
    this.metrics.lastFailureTime = entry.timestamp;
  }

  // Check if circuit allows calls
  canExecute() {
    const now = Date.now();

    switch (this.state) {
      case 'CLOSED':
        return true;

      case 'OPEN':
        if (now >= this.nextAttemptTime) {
          this.halfOpenCircuit();
          return true;
        }
        return false;

      case 'HALF_OPEN':
        return true;

      default:
        return false;
    }
  }

  // Get circuit breaker status
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCount: this.totalCount,
      failureRate: this.totalCount > 0 ? (this.failureCount / this.totalCount * 100).toFixed(2) + '%' : '0%',
      nextAttemptTime: this.nextAttemptTime,
      metrics: {
        ...this.metrics,
        stateChanges: this.metrics.stateChanges.slice(-10) // Last 10 state changes
      },
      options: this.options
    };
  }

  // Execute a function with circuit breaker protection
  async execute(fn, ...args) {
    if (!this.canExecute()) {
      const error = new Error(`Circuit breaker is OPEN for ${this.name}`);
      error.code = 'CIRCUIT_BREAKER_OPEN';
      error.circuitBreaker = this.name;
      error.nextAttemptTime = this.nextAttemptTime;
      throw error;
    }

    const startTime = Date.now();
    let timeoutId;

    try {
      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Circuit breaker timeout: ${this.options.timeout}ms`));
        }, this.options.timeout);
      });

      // Execute the function with timeout
      const result = await Promise.race([
        fn(...args),
        timeoutPromise
      ]);

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      this.recordSuccess(duration);

      return result;

    } catch (error) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (error.message.includes('timeout')) {
        this.recordTimeout(duration);
      } else {
        this.recordFailure(error, duration);
      }

      this.logger.warn('Circuit breaker call failed', {
        circuit: this.name,
        error: error.message,
        duration,
        state: this.state
      });

      throw error;
    }
  }
}

class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
    this.logger = createLogger('circuit-breaker-manager');
  }

  // Create or get a circuit breaker
  getBreaker(name, options = {}) {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
      this.logger.info('Circuit breaker created', { name, options });
    }
    return this.breakers.get(name);
  }

  // Execute function with named circuit breaker
  async execute(breakerName, fn, options = {}, ...args) {
    const breaker = this.getBreaker(breakerName, options);
    return breaker.execute(fn, ...args);
  }

  // Get status of all circuit breakers
  getStatus() {
    const status = {};
    for (const [name, breaker] of this.breakers) {
      status[name] = breaker.getStatus();
    }
    return status;
  }

  // Get health check data
  getHealthData() {
    const health = {
      circuitBreakers: {},
      summary: {
        total: this.breakers.size,
        open: 0,
        halfOpen: 0,
        closed: 0
      }
    };

    for (const [name, breaker] of this.breakers) {
      const status = breaker.getStatus();
      health.circuitBreakers[name] = {
        state: status.state,
        failureRate: status.failureRate,
        lastFailure: status.metrics.lastFailureTime
      };

      health.summary[status.state.toLowerCase()]++;
    }

    return health;
  }
}

// Global instance
const manager = new CircuitBreakerManager();

module.exports = {
  CircuitBreaker,
  CircuitBreakerManager,
  manager
};
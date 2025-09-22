const { createLogger } = require('../util/logger');

class MonitoringMiddleware {
  constructor(options = {}) {
    this.logger = createLogger('monitoring');
    this.options = {
      trackPerformance: options.trackPerformance !== false,
      trackErrors: options.trackErrors !== false,
      trackRequests: options.trackRequests !== false,
      slowRequestThreshold: options.slowRequestThreshold || 5000, // 5 seconds
      ...options
    };

    // In-memory metrics storage (in production, use external metrics store)
    this.metrics = {
      requests: {
        total: 0,
        byStatus: {},
        byPath: {},
        byMethod: {},
        errors: 0,
        slowRequests: 0
      },
      performance: {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        responseTimes: []
      },
      errors: {
        total: 0,
        byType: {},
        byPath: {},
        recent: []
      },
      health: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        lastUpdated: Date.now()
      }
    };

    // Clean up old data periodically (skip in test environment)
    if (process.env.NODE_ENV !== 'test') {
      setInterval(() => this.cleanup(), 300000); // Every 5 minutes
    }
  }

  // Clean up old metrics data
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Keep only recent response times (last 1000 entries)
    if (this.metrics.performance.responseTimes.length > 1000) {
      this.metrics.performance.responseTimes = this.metrics.performance.responseTimes.slice(-1000);
    }

    // Keep only recent errors (last 100 entries)
    this.metrics.errors.recent = this.metrics.errors.recent
      .filter(error => (now - error.timestamp) < maxAge)
      .slice(-100);

    // Update health metrics
    this.updateHealthMetrics();
  }

  // Update health metrics
  updateHealthMetrics() {
    this.metrics.health = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      lastUpdated: Date.now()
    };
  }

  // Calculate performance percentiles
  calculatePercentiles() {
    const times = this.metrics.performance.responseTimes.slice().sort((a, b) => a - b);
    const count = times.length;

    if (count === 0) return;

    // Calculate average
    const sum = times.reduce((a, b) => a + b, 0);
    this.metrics.performance.averageResponseTime = Math.round(sum / count);

    // Calculate percentiles
    const p95Index = Math.floor(count * 0.95);
    const p99Index = Math.floor(count * 0.99);

    this.metrics.performance.p95ResponseTime = times[p95Index] || 0;
    this.metrics.performance.p99ResponseTime = times[p99Index] || 0;
  }

  // Track request metrics
  trackRequest(req, res, responseTime) {
    if (!this.options.trackRequests) return;

    const method = req.method || 'UNKNOWN';
    const path = this.normalizePath(req.url || '/');
    const status = res.statusCode || 0;
    const isError = status >= 400;

    // Update request metrics
    this.metrics.requests.total++;
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;
    this.metrics.requests.byPath[path] = (this.metrics.requests.byPath[path] || 0) + 1;
    this.metrics.requests.byStatus[status] = (this.metrics.requests.byStatus[status] || 0) + 1;

    if (isError) {
      this.metrics.requests.errors++;
    }

    // Track slow requests
    if (responseTime > this.options.slowRequestThreshold) {
      this.metrics.requests.slowRequests++;
      this.logger.warn('Slow request detected', {
        method,
        path,
        responseTime,
        status,
        request_id: req.id
      });
    }

    // Track performance
    if (this.options.trackPerformance) {
      this.metrics.performance.responseTimes.push(responseTime);
      this.calculatePercentiles();
    }
  }

  // Normalize path for metrics (remove IDs, etc.)
  normalizePath(path) {
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid')
      .replace(/\/\d+/g, '/:id')
      .replace(/\?.*$/, '') // Remove query params
      .slice(0, 100); // Limit length
  }

  // Track error
  trackError(error, req = null, context = {}) {
    if (!this.options.trackErrors) return;

    const errorType = error.name || error.constructor.name || 'UnknownError';
    const path = req ? this.normalizePath(req.url || '/') : 'unknown';

    this.metrics.errors.total++;
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
    this.metrics.errors.byPath[path] = (this.metrics.errors.byPath[path] || 0) + 1;

    // Store recent error details
    const errorRecord = {
      timestamp: Date.now(),
      type: errorType,
      message: error.message || 'Unknown error',
      path,
      stack: error.stack,
      context,
      request_id: req?.id
    };

    this.metrics.errors.recent.push(errorRecord);

    // Log error with context
    this.logger.error('Error tracked', {
      error: errorType,
      message: error.message,
      path,
      context,
      request_id: req?.id
    });
  }

  // Get current metrics
  getMetrics() {
    this.updateHealthMetrics();
    this.calculatePercentiles();

    return {
      timestamp: Date.now(),
      requests: { ...this.metrics.requests },
      performance: { ...this.metrics.performance },
      errors: {
        total: this.metrics.errors.total,
        byType: { ...this.metrics.errors.byType },
        byPath: { ...this.metrics.errors.byPath },
        recentCount: this.metrics.errors.recent.length
      },
      health: { ...this.metrics.health }
    };
  }

  // Get detailed error information
  getErrorDetails() {
    return {
      total: this.metrics.errors.total,
      byType: { ...this.metrics.errors.byType },
      byPath: { ...this.metrics.errors.byPath },
      recent: this.metrics.errors.recent.slice(-20) // Last 20 errors
    };
  }

  // Express middleware
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Track request start
      req.monitoring = {
        startTime,
        path: this.normalizePath(req.url || '/')
      };

      // Override res.end to capture response
      const originalEnd = res.end;
      res.end = (...args) => {
        const responseTime = Date.now() - startTime;
        this.trackRequest(req, res, responseTime);
        originalEnd.apply(res, args);
      };

      // Track errors via error handler
      const originalHandleError = res.handleError;
      if (originalHandleError) {
        res.handleError = (error) => {
          this.trackError(error, req, {
            responseTime: Date.now() - startTime,
            userAgent: req.headers['user-agent'],
            ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress
          });
          return originalHandleError.call(res, error);
        };
      }

      next();
    };
  }

  // Health check endpoint data
  getHealthData() {
    const metrics = this.getMetrics();
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Calculate recent error rate
    const recentErrors = this.metrics.errors.recent.filter(
      error => error.timestamp > oneMinuteAgo
    ).length;

    // Calculate status
    let status = 'healthy';
    if (recentErrors > 10 || metrics.performance.averageResponseTime > 10000) {
      status = 'unhealthy';
    } else if (recentErrors > 5 || metrics.performance.averageResponseTime > 5000) {
      status = 'warning';
    }

    return {
      status,
      metrics: {
        requests_per_minute: this.estimateRequestsPerMinute(),
        error_rate: metrics.requests.total > 0 ?
          (metrics.requests.errors / metrics.requests.total * 100).toFixed(2) + '%' : '0%',
        average_response_time: metrics.performance.averageResponseTime,
        recent_errors: recentErrors
      },
      details: {
        uptime_seconds: Math.floor(metrics.health.uptime),
        memory_usage_mb: Math.round(metrics.health.memory.heapUsed / 1024 / 1024),
        total_requests: metrics.requests.total,
        total_errors: metrics.errors.total
      }
    };
  }

  // Estimate requests per minute
  estimateRequestsPerMinute() {
    const uptimeMinutes = process.uptime() / 60;
    return uptimeMinutes > 0 ? Math.round(this.metrics.requests.total / uptimeMinutes) : 0;
  }
}

// Global monitoring instance
const monitoring = new MonitoringMiddleware();

// Global error tracking function
function trackError(error, req = null, context = {}) {
  monitoring.trackError(error, req, context);
}

module.exports = {
  MonitoringMiddleware,
  monitoring,
  trackError
};
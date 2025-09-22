const { createLogger } = require('../util/logger');

class TimeoutMiddleware {
  constructor(options = {}) {
    this.logger = createLogger('timeout');
    this.defaultTimeout = options.defaultTimeout || 30000; // 30 seconds
    this.endpointTimeouts = options.endpointTimeouts || {};
  }

  getTimeoutForPath(path, method = 'GET') {
    const key = `${method.toUpperCase()} ${path}`;
    return this.endpointTimeouts[key] ||
           this.endpointTimeouts[path] ||
           this.defaultTimeout;
  }

  middleware() {
    return (req, res, next) => {
      const timeout = this.getTimeoutForPath(req.url, req.method);
      let timeoutId;
      let isCompleted = false;

      // Set up timeout
      timeoutId = setTimeout(() => {
        if (!isCompleted && !res.headersSent) {
          isCompleted = true;

          this.logger.warn('Request timeout', {
            method: req.method,
            path: req.url,
            timeout_ms: timeout,
            request_id: req.id,
            user_agent: req.headers['user-agent']
          });

          // Send timeout response
          res.writeHead(408, {
            'Content-Type': 'application/json',
            'Connection': 'close'
          });

          res.end(JSON.stringify({
            error: 'request_timeout',
            message: `Request timed out after ${timeout}ms`,
            timeout_ms: timeout,
            timestamp: new Date().toISOString(),
            request_id: req.id
          }));

          // Destroy the request to free resources
          if (req.destroy && typeof req.destroy === 'function') {
            req.destroy();
          }
        }
      }, timeout);

      // Clean up timeout when request completes
      const cleanup = () => {
        if (!isCompleted) {
          isCompleted = true;
          clearTimeout(timeoutId);
        }
      };

      // Cleanup on various completion events
      res.on('finish', cleanup);
      res.on('close', cleanup);
      req.on('close', cleanup);
      req.on('aborted', cleanup);

      // Add timeout info to request
      req.timeout = timeout;
      req.timeoutId = timeoutId;

      next();
    };
  }

  // Static method for creating common timeout configurations
  static createConfig() {
    return {
      defaultTimeout: 30000,
      endpointTimeouts: {
        'POST /v1/sign': 45000,        // Sign operations might take longer
        'POST /api/v1/sign': 45000,
        'GET /health': 5000,           // Health checks should be fast
        'GET /healthz': 5000,
        'GET /api/health': 5000,
        'GET /api/healthz': 5000,
        'GET /metrics': 10000,         // Metrics collection
        'GET /api/metrics': 10000,
        'POST /stripe-webhook': 15000, // Stripe webhooks
        'POST /api/stripe/webhook': 15000,
        'GET /.well-known/jwks.json': 10000, // JWKS endpoint
        'GET /jwks': 10000,
        'GET /api/jwks': 10000,
        'GET /api/.well-known/jwks.json': 10000
      }
    };
  }
}

function createTimeoutMiddleware(options = {}) {
  const config = { ...TimeoutMiddleware.createConfig(), ...options };
  return new TimeoutMiddleware(config);
}

module.exports = {
  TimeoutMiddleware,
  createTimeoutMiddleware
};
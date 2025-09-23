/**
 * Prometheus Metrics Collection Middleware
 * Provides comprehensive application metrics for monitoring and observability
 */

const prometheus = require('prom-client');

// Create a Registry for custom metrics
const register = new prometheus.Registry();

// Add default metrics (CPU, Memory, Event Loop, etc.)
prometheus.collectDefaultMetrics({ register });

// Custom Business Metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const receiptSigningDuration = new prometheus.Histogram({
  name: 'receipt_signing_duration_seconds',
  help: 'Time taken to sign receipts',
  labelNames: ['key_algorithm'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]
});

const receiptSigningTotal = new prometheus.Counter({
  name: 'receipts_signed_total',
  help: 'Total number of receipts signed',
  labelNames: ['key_algorithm', 'success']
});

const jwksRequestTotal = new prometheus.Counter({
  name: 'jwks_requests_total',
  help: 'Total number of JWKS endpoint requests',
  labelNames: ['cache_hit']
});

const activeConnections = new prometheus.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const errorsByType = new prometheus.Counter({
  name: 'errors_total',
  help: 'Total errors by type',
  labelNames: ['error_type', 'route']
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(receiptSigningDuration);
register.registerMetric(receiptSigningTotal);
register.registerMetric(jwksRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(errorsByType);

// Middleware function for request metrics
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Track active connections
  activeConnections.inc();

  // Generate correlation ID for request tracking
  req.correlationId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Correlation-ID', req.correlationId);

  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route ? req.route.path : req.path;

    // Record HTTP metrics
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();

    // Track errors
    if (res.statusCode >= 400) {
      errorsByType
        .labels(getErrorType(res.statusCode), route)
        .inc();
    }

    // Decrease active connections
    activeConnections.dec();

    originalEnd.apply(this, args);
  };

  next();
};

// Helper function to categorize errors
function getErrorType(statusCode) {
  if (statusCode >= 400 && statusCode < 500) {
    return 'client_error';
  } else if (statusCode >= 500) {
    return 'server_error';
  }
  return 'unknown';
}

// Business metrics helpers
const recordReceiptSigning = (algorithm, success, duration) => {
  receiptSigningDuration
    .labels(algorithm)
    .observe(duration);

  receiptSigningTotal
    .labels(algorithm, success ? 'true' : 'false')
    .inc();
};

const recordJwksRequest = (cacheHit) => {
  jwksRequestTotal
    .labels(cacheHit ? 'true' : 'false')
    .inc();
};

// Expose metrics endpoint
const getMetrics = async () => {
  return register.metrics();
};

// Health check metrics
const healthMetrics = {
  uptime: process.uptime(),
  timestamp: Date.now(),
  memory: process.memoryUsage(),
  cpu: process.cpuUsage()
};

module.exports = {
  metricsMiddleware,
  recordReceiptSigning,
  recordJwksRequest,
  getMetrics,
  healthMetrics,
  register
};
/**
 * Enhanced Metrics and Health Check Endpoints
 * Provides Prometheus metrics and detailed health information
 * Maintains compatibility with existing API while adding advanced monitoring
 */

const { getPrometheusMetrics } = require('../plugins/metrics');
const { sendError } = require('../middleware/errorHandler');

// Try to load enhanced metrics, fallback to basic if not available
let enhancedMetrics;
try {
  enhancedMetrics = require('../middleware/metrics');
} catch (error) {
  enhancedMetrics = null;
}

// Enhanced logging if available
let logger;
try {
  const { createContextLogger } = require('../middleware/logging');
  logger = createContextLogger;
} catch (error) {
  logger = () => ({
    debug: () => {},
    info: () => {},
    error: () => {},
    warn: () => {}
  });
}

async function handle(req, res) {
  const contextLogger = logger(req.correlationId || 'metrics');

  if (req.method !== 'GET') {
    return sendError(res, req, 405, 'method_not_allowed', 'Only GET is allowed');
  }

  try {
    contextLogger.debug('Metrics endpoint accessed');

    // Use enhanced metrics if available, otherwise fallback to original
    let body;
    if (enhancedMetrics && enhancedMetrics.getMetrics) {
      body = await enhancedMetrics.getMetrics();
    } else {
      body = getPrometheusMetrics();
    }

    res.writeHead(200, {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Correlation-ID': req.correlationId || 'metrics'
    });
    res.end(body);

    contextLogger.info('Metrics served successfully', {
      responseSize: Buffer.byteLength(body, 'utf8'),
      enhanced: !!enhancedMetrics
    });
  } catch (error) {
    contextLogger.error('Failed to serve metrics', {
      error: error.message,
      stack: error.stack
    });

    sendError(res, req, 500, 'internal_error', 'Failed to generate metrics');
  }
}

module.exports = { handle };
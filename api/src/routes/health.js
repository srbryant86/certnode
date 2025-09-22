const { getCircuitState, getLastKmsError } = require('../aws/kms');
const { sendError } = require('../middleware/errorHandler');
const { createLogger } = require('../util/logger');
const { manager: circuitBreakerManager } = require('../middleware/circuit-breaker');
const { monitoring } = require('../middleware/monitoring');

async function checkDependencyHealth() {
  const dependencies = {};
  let overallHealthy = true;

  // Check KMS availability
  try {
    const circuit = (typeof getCircuitState === 'function') ? getCircuitState() : { state: 'closed' };
    const last_kms_error = (typeof getLastKmsError === 'function') ? getLastKmsError() : null;

    dependencies.kms = {
      status: circuit.state === 'open' ? 'unhealthy' : 'healthy',
      circuit_state: circuit.state,
      last_error: last_kms_error,
      mode: process.env.KMS_MODE || 'local'
    };

    if (circuit.state === 'open') overallHealthy = false;
  } catch (error) {
    dependencies.kms = {
      status: 'unhealthy',
      error: error.message,
      mode: process.env.KMS_MODE || 'local'
    };
    overallHealthy = false;
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  };

  dependencies.memory = {
    status: memUsageMB.heapUsed > 512 ? 'warning' : 'healthy',
    usage_mb: memUsageMB
  };

  // Check event loop lag (simple)
  const start = process.hrtime.bigint();
  await new Promise(resolve => setImmediate(resolve));
  const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms

  dependencies.event_loop = {
    status: lag > 100 ? 'warning' : 'healthy',
    lag_ms: Math.round(lag * 100) / 100
  };

  // Check circuit breakers
  const circuitBreakersHealth = circuitBreakerManager.getHealthData();
  dependencies.circuit_breakers = {
    status: circuitBreakersHealth.summary.open > 0 ? 'unhealthy' : 'healthy',
    summary: circuitBreakersHealth.summary,
    breakers: circuitBreakersHealth.circuitBreakers
  };

  if (circuitBreakersHealth.summary.open > 0) overallHealthy = false;

  // Check application monitoring health
  const monitoringHealth = monitoring.getHealthData();
  dependencies.monitoring = monitoringHealth;

  if (monitoringHealth.status === 'unhealthy') overallHealthy = false;

  return { dependencies, overallHealthy };
}

async function handle(req, res) {
  const logger = createLogger('health');

  if (req.method !== 'GET') return sendError(res, req, 405, 'method_not_allowed', 'Only GET is allowed');

  try {
    const uptime_s = Math.floor(process.uptime());
    const { dependencies, overallHealthy } = await checkDependencyHealth();

    // Determine overall status
    let status = 'ok';
    if (!overallHealthy) status = 'degraded';

    const body = {
      status,
      uptime_s,
      timestamp: new Date().toISOString(),
      dependencies,
      version: process.env.npm_package_version || 'unknown',
      node_version: process.version
    };

    const statusCode = status === 'ok' ? 200 : 503;

    logger.debug('Health check completed', {
      status,
      dependencies_count: Object.keys(dependencies).length,
      request_id: req.id
    });

    res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
  } catch (error) {
    logger.error('Health check failed', {
      error: error.message,
      stack: error.stack,
      request_id: req.id
    });

    res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({
      status: 'error',
      error: 'health_check_failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }));
  }
}

module.exports = { handle };

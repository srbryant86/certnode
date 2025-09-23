/**
 * Comprehensive Health Check and Monitoring Routes
 * Provides detailed health status, readiness, and liveness checks
 */

const express = require('express');
const router = express.Router();
const { createContextLogger, PerformanceTracker } = require('../middleware/logging');

// Health check dependencies
const healthChecks = {
  database: require('../utils/database-health'),
  redis: require('../utils/redis-health'),
  external: require('../utils/external-health'),
  system: require('../utils/system-health'),
  jwks: require('../utils/jwks-health')
};

/**
 * Basic health check endpoint
 * Returns 200 if service is up and running
 */
router.get('/health', async (req, res) => {
  const logger = req.logger || createContextLogger(req.correlationId);
  const tracker = logger.perf('health_check');

  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'certnode-api',
      version: process.env.npm_package_version || '2.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    tracker.checkpoint('basic_checks');

    // Basic system checks
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    healthStatus.system = {
      memory: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      nodeVersion: process.version,
      platform: process.platform
    };

    tracker.finish({ status: 'healthy' });

    logger.debug('Health check completed', {
      status: 'healthy',
      duration: tracker.totalTime
    });

    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed', {
      error: error.message,
      stack: error.stack
    });

    tracker.finish({ status: 'unhealthy', error: error.message });

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Detailed health check endpoint
 * Performs comprehensive checks including dependencies
 */
router.get('/health/detailed', async (req, res) => {
  const logger = req.logger || createContextLogger(req.correlationId);
  const tracker = logger.perf('detailed_health_check');

  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'certnode-api',
    version: process.env.npm_package_version || '2.0.0',
    checks: {}
  };

  let hasFailures = false;
  let hasCriticalFailures = false;

  try {
    // Database health check
    tracker.checkpoint('database_check_start');
    try {
      healthStatus.checks.database = await healthChecks.database.check();
      tracker.checkpoint('database_check_complete');
    } catch (error) {
      healthStatus.checks.database = {
        status: 'unhealthy',
        error: error.message,
        critical: true
      };
      hasFailures = true;
      hasCriticalFailures = true;
    }

    // Redis health check
    tracker.checkpoint('redis_check_start');
    try {
      healthStatus.checks.redis = await healthChecks.redis.check();
      tracker.checkpoint('redis_check_complete');
    } catch (error) {
      healthStatus.checks.redis = {
        status: 'unhealthy',
        error: error.message,
        critical: false
      };
      hasFailures = true;
    }

    // JWKS health check
    tracker.checkpoint('jwks_check_start');
    try {
      healthStatus.checks.jwks = await healthChecks.jwks.check();
      tracker.checkpoint('jwks_check_complete');
    } catch (error) {
      healthStatus.checks.jwks = {
        status: 'unhealthy',
        error: error.message,
        critical: true
      };
      hasFailures = true;
      hasCriticalFailures = true;
    }

    // External services health check
    tracker.checkpoint('external_check_start');
    try {
      healthStatus.checks.external = await healthChecks.external.check();
      tracker.checkpoint('external_check_complete');
    } catch (error) {
      healthStatus.checks.external = {
        status: 'degraded',
        error: error.message,
        critical: false
      };
      hasFailures = true;
    }

    // System health check
    tracker.checkpoint('system_check_start');
    try {
      healthStatus.checks.system = await healthChecks.system.check();
      tracker.checkpoint('system_check_complete');
    } catch (error) {
      healthStatus.checks.system = {
        status: 'unhealthy',
        error: error.message,
        critical: false
      };
      hasFailures = true;
    }

    // Determine overall status
    if (hasCriticalFailures) {
      healthStatus.status = 'unhealthy';
    } else if (hasFailures) {
      healthStatus.status = 'degraded';
    }

    const statusCode = healthStatus.status === 'unhealthy' ? 503 :
                      healthStatus.status === 'degraded' ? 200 : 200;

    tracker.finish({
      status: healthStatus.status,
      checks_performed: Object.keys(healthStatus.checks).length
    });

    logger.info('Detailed health check completed', {
      status: healthStatus.status,
      checks: Object.keys(healthStatus.checks),
      duration: tracker.totalTime
    });

    res.status(statusCode).json(healthStatus);

  } catch (error) {
    logger.error('Detailed health check failed', {
      error: error.message,
      stack: error.stack
    });

    tracker.finish({ status: 'error', error: error.message });

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
      details: error.message
    });
  }
});

/**
 * Readiness probe endpoint
 * Checks if the service is ready to accept traffic
 */
router.get('/health/ready', async (req, res) => {
  const logger = req.logger || createContextLogger(req.correlationId);
  const tracker = logger.perf('readiness_check');

  try {
    const readinessChecks = [];

    // Check critical dependencies for readiness
    tracker.checkpoint('database_readiness');
    readinessChecks.push(healthChecks.database.isReady());

    tracker.checkpoint('jwks_readiness');
    readinessChecks.push(healthChecks.jwks.isReady());

    const results = await Promise.allSettled(readinessChecks);
    const allReady = results.every(result => result.status === 'fulfilled' && result.value);

    tracker.finish({ ready: allReady });

    if (allReady) {
      logger.debug('Readiness check passed');
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      logger.warn('Readiness check failed', {
        results: results.map((r, i) => ({
          check: i,
          status: r.status,
          reason: r.reason?.message
        }))
      });

      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        details: 'One or more critical dependencies are not ready'
      });
    }
  } catch (error) {
    logger.error('Readiness check error', {
      error: error.message,
      stack: error.stack
    });

    tracker.finish({ ready: false, error: error.message });

    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Liveness probe endpoint
 * Checks if the service is alive and should be restarted if not
 */
router.get('/health/live', async (req, res) => {
  const logger = req.logger || createContextLogger(req.correlationId);
  const tracker = logger.perf('liveness_check');

  try {
    // Basic liveness checks
    const isAlive = await performLivenessChecks();

    tracker.finish({ alive: isAlive });

    if (isAlive) {
      logger.debug('Liveness check passed');
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } else {
      logger.error('Liveness check failed - service should be restarted');
      res.status(503).json({
        status: 'dead',
        timestamp: new Date().toISOString(),
        message: 'Service liveness check failed'
      });
    }
  } catch (error) {
    logger.error('Liveness check error', {
      error: error.message,
      stack: error.stack
    });

    tracker.finish({ alive: false, error: error.message });

    res.status(503).json({
      status: 'dead',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Startup probe endpoint
 * Checks if the service has started successfully
 */
router.get('/health/startup', async (req, res) => {
  const logger = req.logger || createContextLogger(req.correlationId);
  const tracker = logger.perf('startup_check');

  try {
    const startupStatus = await checkStartupComplete();

    tracker.finish({ started: startupStatus.complete });

    res.status(startupStatus.complete ? 200 : 503).json({
      status: startupStatus.complete ? 'started' : 'starting',
      timestamp: new Date().toISOString(),
      progress: startupStatus.progress,
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error('Startup check error', {
      error: error.message,
      stack: error.stack
    });

    tracker.finish({ started: false, error: error.message });

    res.status(503).json({
      status: 'startup_failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * Health metrics endpoint
 * Returns health-related metrics in Prometheus format
 */
router.get('/health/metrics', (req, res) => {
  const logger = req.logger || createContextLogger(req.correlationId);

  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    const metrics = [
      `# HELP certnode_uptime_seconds Total uptime of the service in seconds`,
      `# TYPE certnode_uptime_seconds gauge`,
      `certnode_uptime_seconds ${uptime}`,
      ``,
      `# HELP certnode_memory_usage_bytes Memory usage by type`,
      `# TYPE certnode_memory_usage_bytes gauge`,
      `certnode_memory_usage_bytes{type="rss"} ${memoryUsage.rss}`,
      `certnode_memory_usage_bytes{type="heap_used"} ${memoryUsage.heapUsed}`,
      `certnode_memory_usage_bytes{type="heap_total"} ${memoryUsage.heapTotal}`,
      `certnode_memory_usage_bytes{type="external"} ${memoryUsage.external}`,
      ``,
      `# HELP certnode_cpu_usage_microseconds CPU usage by type`,
      `# TYPE certnode_cpu_usage_microseconds gauge`,
      `certnode_cpu_usage_microseconds{type="user"} ${cpuUsage.user}`,
      `certnode_cpu_usage_microseconds{type="system"} ${cpuUsage.system}`,
      ``
    ].join('\n');

    logger.debug('Health metrics requested');

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(metrics);
  } catch (error) {
    logger.error('Health metrics error', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to generate health metrics',
      details: error.message
    });
  }
});

// Helper functions
async function performLivenessChecks() {
  // Check if the Node.js process is responding
  // Check if critical resources are available
  // Check for memory leaks or other critical issues

  const memoryUsage = process.memoryUsage();
  const heapUsedPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

  // Consider service dead if heap usage is over 95%
  if (heapUsedPercentage > 95) {
    throw new Error(`Critical memory usage: ${heapUsedPercentage.toFixed(2)}%`);
  }

  return true;
}

async function checkStartupComplete() {
  // Check if all initialization is complete
  const uptime = process.uptime();
  const minimumStartupTime = 5; // seconds

  if (uptime < minimumStartupTime) {
    return {
      complete: false,
      progress: `${Math.round((uptime / minimumStartupTime) * 100)}%`
    };
  }

  // Additional startup checks could be added here
  return {
    complete: true,
    progress: '100%'
  };
}

module.exports = router;
#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

// Health check configuration
const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  timeout: parseInt(process.env.HEALTHCHECK_TIMEOUT) || 5000,
  retries: parseInt(process.env.HEALTHCHECK_RETRIES) || 3,
  interval: parseInt(process.env.HEALTHCHECK_INTERVAL) || 1000,
  jwksPath: process.env.JWKS_PATH || './public/.well-known/jwks.json'
};

// Health check endpoints to test
const healthChecks = [
  {
    name: 'Main Health Check',
    path: '/health',
    critical: true
  },
  {
    name: 'Readiness Check',
    path: '/health/ready',
    critical: true
  },
  {
    name: 'Liveness Check',
    path: '/health/live',
    critical: true
  },
  {
    name: 'Metrics Endpoint',
    path: '/metrics',
    critical: false
  },
  {
    name: 'JWKS Endpoint',
    path: '/.well-known/jwks.json',
    critical: true
  }
];

// Perform HTTP health check
function performHealthCheck(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.host,
      port: config.port,
      path: endpoint.path,
      method: 'GET',
      timeout: config.timeout,
      headers: {
        'User-Agent': 'HealthCheck/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const result = {
          name: endpoint.name,
          path: endpoint.path,
          status: res.statusCode,
          critical: endpoint.critical,
          success: res.statusCode >= 200 && res.statusCode < 300,
          response_time: Date.now() - startTime,
          data: data.substring(0, 500) // Truncate response data
        };

        if (result.success) {
          resolve(result);
        } else {
          reject(new Error(`Health check failed: ${endpoint.name} returned status ${res.statusCode}`));
        }
      });
    });

    const startTime = Date.now();

    req.on('error', (error) => {
      reject(new Error(`Health check failed: ${endpoint.name} - ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Health check failed: ${endpoint.name} - timeout after ${config.timeout}ms`));
    });

    req.end();
  });
}

// Check if JWKS file exists and is valid
function checkJWKSFile() {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(config.jwksPath)) {
        reject(new Error('JWKS file does not exist'));
        return;
      }

      const stats = fs.statSync(config.jwksPath);
      if (stats.size === 0) {
        reject(new Error('JWKS file is empty'));
        return;
      }

      const content = fs.readFileSync(config.jwksPath, 'utf8');
      const jwks = JSON.parse(content);

      if (!jwks.keys || !Array.isArray(jwks.keys) || jwks.keys.length === 0) {
        reject(new Error('JWKS file does not contain valid keys'));
        return;
      }

      resolve({
        name: 'JWKS File Check',
        success: true,
        file_size: stats.size,
        keys_count: jwks.keys.length,
        last_modified: stats.mtime
      });
    } catch (error) {
      reject(new Error(`JWKS file check failed: ${error.message}`));
    }
  });
}

// Check system resources
function checkSystemResources() {
  return new Promise((resolve) => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    resolve({
      name: 'System Resources',
      success: true,
      memory: {
        rss: memoryUsage.rss,
        heap_used: memoryUsage.heapUsed,
        heap_total: memoryUsage.heapTotal,
        external: memoryUsage.external
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      uptime: process.uptime(),
      node_version: process.version
    });
  });
}

// Retry mechanism for health checks
async function performHealthCheckWithRetry(endpoint) {
  let lastError;

  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      return await performHealthCheck(endpoint);
    } catch (error) {
      lastError = error;

      if (attempt < config.retries) {
        console.log(`Health check attempt ${attempt} failed for ${endpoint.name}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, config.interval));
      }
    }
  }

  throw lastError;
}

// Main health check function
async function runHealthChecks() {
  const results = {
    timestamp: new Date().toISOString(),
    overall_status: 'healthy',
    checks: []
  };

  let hasFailures = false;
  let hasCriticalFailures = false;

  // Perform HTTP health checks
  for (const endpoint of healthChecks) {
    try {
      const result = await performHealthCheckWithRetry(endpoint);
      results.checks.push(result);
    } catch (error) {
      const failedResult = {
        name: endpoint.name,
        path: endpoint.path,
        critical: endpoint.critical,
        success: false,
        error: error.message
      };

      results.checks.push(failedResult);
      hasFailures = true;

      if (endpoint.critical) {
        hasCriticalFailures = true;
      }
    }
  }

  // Check JWKS file
  try {
    const jwksResult = await checkJWKSFile();
    results.checks.push(jwksResult);
  } catch (error) {
    results.checks.push({
      name: 'JWKS File Check',
      success: false,
      critical: true,
      error: error.message
    });
    hasFailures = true;
    hasCriticalFailures = true;
  }

  // Check system resources
  try {
    const systemResult = await checkSystemResources();
    results.checks.push(systemResult);
  } catch (error) {
    results.checks.push({
      name: 'System Resources',
      success: false,
      critical: false,
      error: error.message
    });
    hasFailures = true;
  }

  // Determine overall status
  if (hasCriticalFailures) {
    results.overall_status = 'unhealthy';
  } else if (hasFailures) {
    results.overall_status = 'degraded';
  }

  return results;
}

// CLI execution
if (require.main === module) {
  runHealthChecks()
    .then((results) => {
      // Output results
      if (process.env.HEALTHCHECK_OUTPUT === 'json') {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log(`Health Check Results - ${results.overall_status.toUpperCase()}`);
        console.log(`Timestamp: ${results.timestamp}`);
        console.log('');

        results.checks.forEach((check) => {
          const status = check.success ? '✓' : '✗';
          const critical = check.critical ? ' (CRITICAL)' : '';
          console.log(`${status} ${check.name}${critical}`);

          if (!check.success && check.error) {
            console.log(`  Error: ${check.error}`);
          }

          if (check.response_time) {
            console.log(`  Response Time: ${check.response_time}ms`);
          }
        });
      }

      // Exit with appropriate code
      if (results.overall_status === 'unhealthy') {
        process.exit(1);
      } else if (results.overall_status === 'degraded') {
        process.exit(2);
      } else {
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('Health check failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  runHealthChecks,
  performHealthCheck,
  checkJWKSFile,
  checkSystemResources
};
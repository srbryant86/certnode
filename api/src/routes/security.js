/**
 * Security Management and Audit Endpoints
 * Provides comprehensive security monitoring, audit, and management capabilities
 */

const { SecurityComplianceChecker, SecurityHardeningMiddleware } = require('../middleware/securityAudit');
const { SecurityConfig } = require('../config/security');
const { sendError } = require('../middleware/errorHandler');
const { createLogger } = require('../util/logger');

const logger = createLogger('security-routes');
const securityConfig = new SecurityConfig();
const complianceChecker = new SecurityComplianceChecker();

// Global security monitor instance
let securityMiddleware = null;
let securityMonitor = null;

// Initialize security monitoring
function initializeSecurityMonitoring() {
  if (!securityMiddleware) {
    securityMiddleware = new SecurityHardeningMiddleware({
      blockThreats: securityConfig.getThreatDetectionConfig().blockCritical,
      enableMonitoring: true,
      enableAdvancedDetection: true
    });
    securityMonitor = securityMiddleware.getMonitor();
  }
}

initializeSecurityMonitoring();

// ============================================================================
// Security Audit Endpoints
// ============================================================================

/**
 * Security audit endpoint - requires admin authentication
 */
async function handleSecurityAudit(req, res) {
  if (req.method !== 'GET') {
    return sendError(res, req, 405, 'method_not_allowed', 'Only GET is allowed');
  }

  try {
    logger.info('Security audit initiated', { requestId: req.id });

    // Run complete security audit
    const auditResults = await complianceChecker.runCompleteAudit();

    // Add configuration validation
    const configValidation = securityConfig.validate();
    auditResults.configValidation = configValidation;

    // Add security metrics
    if (securityMonitor) {
      auditResults.securityMetrics = securityMonitor.getSecurityMetrics();
    }

    // Calculate overall security score
    const overallScore = calculateSecurityScore(auditResults);
    auditResults.overallScore = overallScore;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(auditResults, null, 2));

    logger.info('Security audit completed', {
      requestId: req.id,
      score: overallScore.score,
      findings: auditResults.findings.length
    });

  } catch (error) {
    logger.error('Security audit failed', {
      error: error.message,
      stack: error.stack,
      requestId: req.id
    });

    sendError(res, req, 500, 'audit_failed', 'Security audit failed');
  }
}

/**
 * Security monitoring dashboard
 */
async function handleSecurityMonitoring(req, res) {
  if (req.method !== 'GET') {
    return sendError(res, req, 405, 'method_not_allowed', 'Only GET is allowed');
  }

  try {
    const monitoring = {
      timestamp: new Date().toISOString(),
      status: 'active',
      environment: process.env.NODE_ENV || 'development',

      // Security metrics
      metrics: securityMonitor ? securityMonitor.getSecurityMetrics() : null,

      // Configuration status
      configuration: {
        valid: securityConfig.validate().valid,
        environment: securityConfig.environment,
        httpsEnforced: securityConfig.getHTTPSConfig().enforced,
        rateLimitEnabled: securityConfig.getRateLimitConfig().enabled,
        threatDetectionEnabled: securityConfig.getThreatDetectionConfig().enabled
      },

      // System health
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(monitoring, null, 2));

  } catch (error) {
    logger.error('Security monitoring failed', {
      error: error.message,
      requestId: req.id
    });

    sendError(res, req, 500, 'monitoring_failed', 'Security monitoring failed');
  }
}

/**
 * Security configuration endpoint
 */
async function handleSecurityConfig(req, res) {
  if (req.method !== 'GET') {
    return sendError(res, req, 405, 'method_not_allowed', 'Only GET is allowed');
  }

  try {
    // Return sanitized configuration (no secrets)
    const sanitizedConfig = {
      environment: securityConfig.environment,
      rateLimit: securityConfig.getRateLimitConfig(),
      cors: {
        ...securityConfig.getCORSConfig(),
        // Hide sensitive origin information in non-dev environments
        origin: securityConfig.environment === 'development' ?
          securityConfig.getCORSConfig().origin : '[CONFIGURED]'
      },
      headers: securityConfig.getHeadersConfig(),
      validation: securityConfig.getValidationConfig(),
      threatDetection: {
        ...securityConfig.getThreatDetectionConfig(),
        // Don't expose detailed threat detection rules
        enabled: securityConfig.getThreatDetectionConfig().enabled
      },
      https: {
        enforced: securityConfig.getHTTPSConfig().enforced,
        hstsMaxAge: securityConfig.getHTTPSConfig().hsts.maxAge
      },
      compliance: securityConfig.getComplianceConfig()
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sanitizedConfig, null, 2));

  } catch (error) {
    logger.error('Security config retrieval failed', {
      error: error.message,
      requestId: req.id
    });

    sendError(res, req, 500, 'config_failed', 'Security configuration retrieval failed');
  }
}

/**
 * Security alerts endpoint
 */
async function handleSecurityAlerts(req, res) {
  if (req.method !== 'GET') {
    return sendError(res, req, 405, 'method_not_allowed', 'Only GET is allowed');
  }

  try {
    const alerts = {
      timestamp: new Date().toISOString(),
      alerts: securityMonitor ? securityMonitor.getSecurityMetrics().recentAlerts : [],
      summary: {
        total: securityMonitor ? securityMonitor.getSecurityMetrics().threatsDetected : 0,
        blocked: securityMonitor ? securityMonitor.getSecurityMetrics().requestsBlocked : 0,
        suspiciousIPs: securityMonitor ? securityMonitor.getSecurityMetrics().suspiciousIPCount : 0
      }
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(alerts, null, 2));

  } catch (error) {
    logger.error('Security alerts retrieval failed', {
      error: error.message,
      requestId: req.id
    });

    sendError(res, req, 500, 'alerts_failed', 'Security alerts retrieval failed');
  }
}

/**
 * Generate security deployment configuration
 */
async function handleSecurityDeploymentConfig(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, req, 405, 'method_not_allowed', 'Only POST is allowed');
  }

  try {
    const deploymentConfig = securityConfig.generateSecureDeploymentConfig();

    // Log security configuration generation
    logger.info('Security deployment configuration generated', {
      requestId: req.id,
      environment: 'production'
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Secure deployment configuration generated',
      config: deploymentConfig,
      instructions: [
        'Set these environment variables in your production environment',
        'Store ADMIN_TOKEN and JWT_SECRET securely',
        'Configure SSL certificates',
        'Set CORS_ORIGIN to your actual domain',
        'Review and adjust rate limiting based on your needs'
      ],
      timestamp: new Date().toISOString()
    }, null, 2));

  } catch (error) {
    logger.error('Security deployment config generation failed', {
      error: error.message,
      requestId: req.id
    });

    sendError(res, req, 500, 'deployment_config_failed', 'Deployment configuration generation failed');
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function calculateSecurityScore(auditResults) {
  let score = auditResults.score || 0;
  const maxScore = auditResults.maxScore || 100;

  // Adjust score based on configuration validation
  if (auditResults.configValidation && !auditResults.configValidation.valid) {
    score -= auditResults.configValidation.errors.length * 5;
  }

  // Adjust score based on security metrics
  if (auditResults.securityMetrics) {
    const metrics = auditResults.securityMetrics;

    // Penalize for high threat detection
    if (metrics.threatsDetected > 10) {
      score -= Math.min(metrics.threatsDetected, 20);
    }

    // Penalize for many suspicious IPs
    if (metrics.suspiciousIPCount > 5) {
      score -= Math.min(metrics.suspiciousIPCount, 15);
    }
  }

  // Calculate percentage
  const percentage = Math.max(0, Math.min(100, (score / maxScore) * 100));

  return {
    score,
    maxScore,
    percentage: Math.round(percentage * 100) / 100,
    grade: getSecurityGrade(percentage),
    recommendation: getSecurityRecommendation(percentage)
  };
}

function getSecurityGrade(percentage) {
  if (percentage >= 95) return 'A+';
  if (percentage >= 90) return 'A';
  if (percentage >= 85) return 'A-';
  if (percentage >= 80) return 'B+';
  if (percentage >= 75) return 'B';
  if (percentage >= 70) return 'B-';
  if (percentage >= 65) return 'C+';
  if (percentage >= 60) return 'C';
  if (percentage >= 55) return 'C-';
  if (percentage >= 50) return 'D';
  return 'F';
}

function getSecurityRecommendation(percentage) {
  if (percentage >= 90) {
    return 'Excellent security posture. Continue monitoring and maintain current practices.';
  } else if (percentage >= 80) {
    return 'Good security posture. Address remaining findings to achieve excellent security.';
  } else if (percentage >= 70) {
    return 'Adequate security posture. Implement additional security measures from recommendations.';
  } else if (percentage >= 60) {
    return 'Below average security posture. Immediate attention required to address critical issues.';
  } else {
    return 'Poor security posture. Urgent security improvements required before production deployment.';
  }
}

// ============================================================================
// Route Handler
// ============================================================================

async function handle(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Authenticate admin requests
    const adminToken = process.env.ADMIN_TOKEN || 'demo-admin-token-123';
    const authHeader = req.headers.authorization;

    if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
      return sendError(res, req, 401, 'unauthorized', 'Admin authentication required');
    }

    // Route to appropriate handler
    switch (pathname) {
      case '/api/security/audit':
        return await handleSecurityAudit(req, res);

      case '/api/security/monitoring':
        return await handleSecurityMonitoring(req, res);

      case '/api/security/config':
        return await handleSecurityConfig(req, res);

      case '/api/security/alerts':
        return await handleSecurityAlerts(req, res);

      case '/api/security/deployment-config':
        return await handleSecurityDeploymentConfig(req, res);

      default:
        return sendError(res, req, 404, 'not_found', 'Security endpoint not found');
    }

  } catch (error) {
    logger.error('Security route handler error', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      requestId: req.id
    });

    sendError(res, req, 500, 'internal_error', 'Internal security system error');
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  handle,
  securityMiddleware,
  initializeSecurityMonitoring
};
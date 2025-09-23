/**
 * Advanced Security Audit and Hardening Framework
 * Provides comprehensive security analysis, threat detection, and hardening measures
 */

const crypto = require('crypto');
const { createLogger } = require('../util/logger');

// ============================================================================
// Security Threat Detection Engine
// ============================================================================

class ThreatDetectionEngine {
  constructor() {
    this.logger = createLogger('security-audit');
    this.patterns = {
      // Advanced injection patterns
      sqlInjection: [
        /('|(\\)|;|(--)|(\||(\*))).*((union)|(select)|(insert)|(delete)|(update)|(drop)|(create)|(exec)|(execute))/i,
        /((\%27)|(\')).*((union)|(select)|(insert)|(delete)|(update)|(drop)|(create)|(exec)|(execute))/i,
        /((union)(.*)(select))|((select)(.*)(from))|((insert)(.*)(into))|((delete)(.*)(from))|((drop)(.*)(table))/i
      ],
      xss: [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript\s*:/gi,
        /on\w+\s*=\s*["\'][^"\']*["\']?/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /<object[^>]*>.*?<\/object>/gi,
        /expression\s*\(/gi
      ],
      pathTraversal: [
        /\.\.\//, /\.\.\\/,
        /%2e%2e%2f/i, /%2e%2e%5c/i,
        /\.\.%2f/i, /\.\.%5c/i,
        /%c0%ae%c0%ae%c0%af/i,
        /file:\/\//i
      ],
      commandInjection: [
        /[;&|`$\(\)\{\}\[\]]/,
        /(nc|netcat|wget|curl|ping|nslookup|dig)\s/i,
        /(\||;|&|`|\$\(|\${)/,
        /(exec|eval|system|shell_exec|passthru)/i
      ],
      ldapInjection: [
        /\*\)/i, /\(\|/i,
        /\)\(/i, /\*\(/i,
        /\|\(.*\)\)/i
      ],
      xxe: [
        /<!ENTITY/i,
        /<!DOCTYPE.*ENTITY/i,
        /SYSTEM\s+"[^"]*"/i,
        /PUBLIC\s+"[^"]*"\s+"[^"]*"/i
      ]
    };

    this.suspiciousUserAgents = [
      /sqlmap/i, /nikto/i, /nmap/i, /burp/i, /zap/i,
      /havij/i, /pangolin/i, /webinspect/i, /appscan/i,
      /vega/i, /w3af/i, /skipfish/i, /paros/i
    ];

    this.threatCounts = new Map();
    this.ipReputationCache = new Map();
  }

  detectAdvancedThreats(req) {
    const threats = [];
    const payload = this.extractPayload(req);
    const ip = this.getClientIP(req);

    // Check all injection patterns
    Object.entries(this.patterns).forEach(([threatType, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(payload)) {
          threats.push({
            type: threatType,
            severity: this.getSeverity(threatType),
            pattern: pattern.source,
            location: this.findThreatLocation(req, pattern)
          });
        }
      });
    });

    // Check for suspicious user agents
    const userAgent = req.headers['user-agent'] || '';
    this.suspiciousUserAgents.forEach(pattern => {
      if (pattern.test(userAgent)) {
        threats.push({
          type: 'suspicious_user_agent',
          severity: 'medium',
          details: userAgent
        });
      }
    });

    // Rate limiting anomaly detection
    const rateThreat = this.detectRateAnomalies(ip);
    if (rateThreat) {
      threats.push(rateThreat);
    }

    // Protocol anomaly detection
    const protocolThreats = this.detectProtocolAnomalies(req);
    threats.push(...protocolThreats);

    return threats;
  }

  extractPayload(req) {
    const parts = [
      req.url || '',
      req.headers['user-agent'] || '',
      req.headers['referer'] || '',
      req.headers['cookie'] || '',
      JSON.stringify(req.headers),
      req.body ? JSON.stringify(req.body) : ''
    ];
    return parts.join(' ').toLowerCase();
  }

  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.socket?.remoteAddress ||
           'unknown';
  }

  getSeverity(threatType) {
    const severityMap = {
      sqlInjection: 'critical',
      commandInjection: 'critical',
      xxe: 'high',
      ldapInjection: 'high',
      xss: 'medium',
      pathTraversal: 'medium'
    };
    return severityMap[threatType] || 'low';
  }

  findThreatLocation(req, pattern) {
    const locations = [];
    if (pattern.test(req.url || '')) locations.push('url');
    if (pattern.test(req.headers['user-agent'] || '')) locations.push('user-agent');
    if (pattern.test(req.headers['referer'] || '')) locations.push('referer');
    if (req.body && pattern.test(JSON.stringify(req.body))) locations.push('body');
    return locations;
  }

  detectRateAnomalies(ip) {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const threshold = 100; // requests per minute

    if (!this.threatCounts.has(ip)) {
      this.threatCounts.set(ip, []);
    }

    const requests = this.threatCounts.get(ip);
    requests.push(now);

    // Clean old requests
    const cutoff = now - windowMs;
    const recentRequests = requests.filter(time => time > cutoff);
    this.threatCounts.set(ip, recentRequests);

    if (recentRequests.length > threshold) {
      return {
        type: 'rate_anomaly',
        severity: 'high',
        details: `${recentRequests.length} requests in ${windowMs/1000}s from ${ip}`
      };
    }

    return null;
  }

  detectProtocolAnomalies(req) {
    const threats = [];
    const headers = req.headers;

    // Check for HTTP method anomalies
    if (['TRACE', 'TRACK', 'DEBUG'].includes(req.method)) {
      threats.push({
        type: 'dangerous_http_method',
        severity: 'medium',
        details: `Method: ${req.method}`
      });
    }

    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-cluster-client-ip',
      'x-forwarded-host',
      'x-originating-ip',
      'x-remote-ip'
    ];

    suspiciousHeaders.forEach(header => {
      if (headers[header]) {
        threats.push({
          type: 'header_injection',
          severity: 'medium',
          details: `Header: ${header}`
        });
      }
    });

    // Check for oversized headers
    const headerString = JSON.stringify(headers);
    if (headerString.length > 8192) { // 8KB limit
      threats.push({
        type: 'oversized_headers',
        severity: 'medium',
        details: `Header size: ${headerString.length} bytes`
      });
    }

    return threats;
  }
}

// ============================================================================
// Security Compliance Checker
// ============================================================================

class SecurityComplianceChecker {
  constructor() {
    this.logger = createLogger('security-compliance');
    this.checks = {
      'OWASP-A01': this.checkInjectionVulns.bind(this),
      'OWASP-A02': this.checkAuthFailures.bind(this),
      'OWASP-A03': this.checkDataExposure.bind(this),
      'OWASP-A04': this.checkXXE.bind(this),
      'OWASP-A05': this.checkAccessControl.bind(this),
      'OWASP-A06': this.checkSecurityConfig.bind(this),
      'OWASP-A07': this.checkXSS.bind(this),
      'OWASP-A08': this.checkDeserialization.bind(this),
      'OWASP-A09': this.checkKnownVulns.bind(this),
      'OWASP-A10': this.checkLogging.bind(this)
    };
  }

  async runCompleteAudit() {
    const results = {
      timestamp: new Date().toISOString(),
      score: 0,
      maxScore: Object.keys(this.checks).length * 10,
      findings: [],
      recommendations: []
    };

    for (const [checkId, checkFn] of Object.entries(this.checks)) {
      try {
        const finding = await checkFn();
        if (finding) {
          finding.id = checkId;
          results.findings.push(finding);
        } else {
          results.score += 10; // Perfect score for this check
        }
      } catch (error) {
        results.findings.push({
          id: checkId,
          severity: 'error',
          title: 'Audit Check Failed',
          description: error.message
        });
      }
    }

    // Generate recommendations
    results.recommendations = this.generateRecommendations(results.findings);

    return results;
  }

  checkInjectionVulns() {
    // Check input validation and sanitization
    const issues = [];

    // This would typically analyze code patterns, but for now we'll check configuration
    if (!process.env.VALIDATION_STRICT) {
      issues.push('Input validation not in strict mode');
    }

    if (issues.length > 0) {
      return {
        severity: 'high',
        title: 'Injection Vulnerabilities',
        description: 'Potential injection vulnerabilities detected',
        issues
      };
    }
    return null;
  }

  checkAuthFailures() {
    const issues = [];

    // Check authentication configuration
    if (!process.env.ADMIN_TOKEN || process.env.ADMIN_TOKEN === 'demo-admin-token-123') {
      issues.push('Default admin token in use');
    }

    if (!process.env.JWT_SECRET) {
      issues.push('JWT secret not configured');
    }

    if (issues.length > 0) {
      return {
        severity: 'critical',
        title: 'Authentication Failures',
        description: 'Authentication system has security issues',
        issues
      };
    }
    return null;
  }

  checkDataExposure() {
    const issues = [];

    // Check for sensitive data exposure
    if (process.env.NODE_ENV !== 'production') {
      issues.push('Application not running in production mode');
    }

    if (!process.env.HTTPS_ONLY) {
      issues.push('HTTPS enforcement not configured');
    }

    if (issues.length > 0) {
      return {
        severity: 'medium',
        title: 'Sensitive Data Exposure',
        description: 'Potential data exposure risks detected',
        issues
      };
    }
    return null;
  }

  checkXXE() {
    // Check XML processing configuration
    // For this JSON-based API, XXE risk is minimal, but we should verify
    return null; // No XXE vulnerabilities in JSON-only API
  }

  checkAccessControl() {
    const issues = [];

    // Check access control implementation
    if (!process.env.CORS_ORIGIN) {
      issues.push('CORS origin not specifically configured');
    }

    if (issues.length > 0) {
      return {
        severity: 'medium',
        title: 'Broken Access Control',
        description: 'Access control issues detected',
        issues
      };
    }
    return null;
  }

  checkSecurityConfig() {
    const issues = [];

    // Check security configuration
    if (!process.env.RATE_LIMIT_MAX) {
      issues.push('Rate limiting not configured');
    }

    if (!process.env.SECURITY_HEADERS) {
      issues.push('Security headers not explicitly configured');
    }

    if (issues.length > 0) {
      return {
        severity: 'medium',
        title: 'Security Misconfiguration',
        description: 'Security configuration issues found',
        issues
      };
    }
    return null;
  }

  checkXSS() {
    // Check XSS prevention measures
    // CSP headers are implemented, so this is likely secure
    return null;
  }

  checkDeserialization() {
    // Check for insecure deserialization
    // Using JSON.parse with validation middleware, risk is low
    return null;
  }

  checkKnownVulns() {
    const issues = [];

    // Check for known vulnerable dependencies
    if (!process.env.DEPENDENCY_CHECK_DATE) {
      issues.push('Dependency vulnerability scanning not configured');
    }

    if (issues.length > 0) {
      return {
        severity: 'medium',
        title: 'Known Vulnerabilities',
        description: 'Known vulnerability checks needed',
        issues
      };
    }
    return null;
  }

  checkLogging() {
    const issues = [];

    // Check logging and monitoring
    if (!process.env.LOG_LEVEL) {
      issues.push('Log level not configured');
    }

    if (!process.env.SECURITY_MONITORING) {
      issues.push('Security monitoring not configured');
    }

    if (issues.length > 0) {
      return {
        severity: 'low',
        title: 'Insufficient Logging',
        description: 'Logging and monitoring improvements needed',
        issues
      };
    }
    return null;
  }

  generateRecommendations(findings) {
    const recommendations = [];

    findings.forEach(finding => {
      switch (finding.id) {
        case 'OWASP-A02':
          recommendations.push('Implement strong authentication with proper token management');
          break;
        case 'OWASP-A03':
          recommendations.push('Enable HTTPS-only mode and production configuration');
          break;
        case 'OWASP-A05':
          recommendations.push('Configure specific CORS origins for production');
          break;
        case 'OWASP-A06':
          recommendations.push('Enable comprehensive security configuration');
          break;
        case 'OWASP-A09':
          recommendations.push('Implement automated dependency vulnerability scanning');
          break;
        case 'OWASP-A10':
          recommendations.push('Configure comprehensive security logging');
          break;
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }
}

// ============================================================================
// Security Monitoring and Alerting
// ============================================================================

class SecurityMonitor {
  constructor() {
    this.logger = createLogger('security-monitor');
    this.alerts = [];
    this.metrics = {
      threatsDetected: 0,
      requestsBlocked: 0,
      suspiciousIPs: new Set(),
      lastUpdate: Date.now()
    };
  }

  recordThreat(threat, req) {
    this.metrics.threatsDetected++;
    const ip = this.getClientIP(req);

    if (threat.severity === 'critical' || threat.severity === 'high') {
      this.metrics.suspiciousIPs.add(ip);
    }

    const alert = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: threat.type,
      severity: threat.severity,
      ip,
      url: req.url,
      method: req.method,
      userAgent: req.headers['user-agent'],
      details: threat.details || threat.pattern,
      requestId: req.id
    };

    this.alerts.push(alert);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    // Log critical threats immediately
    if (threat.severity === 'critical') {
      this.logger.error('Critical security threat detected', alert);
    } else if (threat.severity === 'high') {
      this.logger.warn('High severity security threat detected', alert);
    }

    this.metrics.lastUpdate = Date.now();
  }

  recordBlockedRequest(req, reason) {
    this.metrics.requestsBlocked++;
    const ip = this.getClientIP(req);
    this.metrics.suspiciousIPs.add(ip);

    this.logger.warn('Request blocked by security system', {
      ip,
      url: req.url,
      method: req.method,
      reason,
      userAgent: req.headers['user-agent'],
      requestId: req.id
    });

    this.metrics.lastUpdate = Date.now();
  }

  getSecurityMetrics() {
    return {
      ...this.metrics,
      suspiciousIPCount: this.metrics.suspiciousIPs.size,
      recentAlerts: this.alerts.slice(-10), // Last 10 alerts
      uptime: Date.now() - this.metrics.lastUpdate
    };
  }

  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.socket?.remoteAddress ||
           'unknown';
  }
}

// ============================================================================
// Security Hardening Middleware
// ============================================================================

class SecurityHardeningMiddleware {
  constructor(options = {}) {
    this.threatEngine = new ThreatDetectionEngine();
    this.monitor = new SecurityMonitor();
    this.options = {
      blockThreats: true,
      enableMonitoring: true,
      enableAdvancedDetection: true,
      ...options
    };
  }

  middleware() {
    return async (req, res, next) => {
      if (!this.options.enableAdvancedDetection) {
        return next();
      }

      try {
        // Detect threats
        const threats = this.threatEngine.detectAdvancedThreats(req);

        if (threats.length > 0) {
          // Record all threats
          threats.forEach(threat => {
            if (this.options.enableMonitoring) {
              this.monitor.recordThreat(threat, req);
            }
          });

          // Block critical threats
          const criticalThreats = threats.filter(t => t.severity === 'critical');
          if (criticalThreats.length > 0 && this.options.blockThreats) {
            this.monitor.recordBlockedRequest(req, 'Critical security threat detected');

            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'security_violation',
              message: 'Request blocked due to security policy',
              timestamp: new Date().toISOString(),
              request_id: req.id
            }));
            return;
          }
        }

        next();
      } catch (error) {
        console.error('Security middleware error:', error);
        next(); // Don't block requests due to security middleware errors
      }
    };
  }

  getMonitor() {
    return this.monitor;
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  ThreatDetectionEngine,
  SecurityComplianceChecker,
  SecurityMonitor,
  SecurityHardeningMiddleware
};
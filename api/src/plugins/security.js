const { createLogger } = require('../util/logger');

class SecurityMiddleware {
  constructor(options = {}) {
    this.logger = createLogger('security');
    this.options = {
      // HSTS configuration
      hsts: {
        maxAge: 63072000, // 2 years
        includeSubDomains: true,
        preload: true,
        ...options.hsts
      },
      // CSP configuration for different endpoint types
      csp: {
        api: "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
        web: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'",
        strict: "default-src 'none'",
        ...options.csp
      },
      // Feature policy controls
      permissions: {
        camera: false,
        microphone: false,
        geolocation: false,
        payment: false,
        usb: false,
        magnetometer: false,
        accelerometer: false,
        gyroscope: false,
        ...options.permissions
      },
      // Security header configuration
      headers: {
        xContentTypeOptions: true,
        xFrameOptions: 'SAMEORIGIN',
        referrerPolicy: 'strict-origin-when-cross-origin',
        xXssProtection: false, // Deprecated, browsers use CSP instead
        ...options.headers
      },
      ...options
    };
  }

  // Determine content type and apply appropriate CSP
  getCSPForRequest(req) {
    const url = String(req.url || '');
    const accept = String(req.headers.accept || '');
    const userAgent = String(req.headers['user-agent'] || '');

    // API endpoints get strict CSP
    if (/\/(api|v1)\//.test(url) || accept.includes('application/json')) {
      return this.options.csp.api;
    }

    // Health and metrics endpoints
    if (/\/(health|metrics|jwks)/.test(url)) {
      return this.options.csp.api;
    }

    // OpenAPI spec viewer needs relaxed CSP for inline styles and scripts
    if (url.includes('/openapi')) {
      return "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'";
    }

    // Static web content
    if (url.match(/\.(html|css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
      return this.options.csp.web;
    }

    // Default for web pages
    return this.options.csp.web;
  }

  // Generate Permissions-Policy header value
  getPermissionsPolicy() {
    const policies = [];
    Object.entries(this.options.permissions).forEach(([feature, allowed]) => {
      if (allowed === false) {
        policies.push(`${feature}=()`);
      } else if (allowed === true) {
        policies.push(`${feature}=*`);
      } else if (typeof allowed === 'string') {
        policies.push(`${feature}=(${allowed})`);
      } else if (Array.isArray(allowed)) {
        policies.push(`${feature}=(${allowed.join(' ')})`);
      }
    });
    return policies.join(', ');
  }

  // Check for security threats in request
  detectThreats(req) {
    const threats = [];
    const url = req.url || '';
    const userAgent = req.headers['user-agent'] || '';
    const referer = req.headers.referer || '';

    // Path traversal attempts
    if (url.includes('../') || url.includes('..\\') || url.includes('%2e%2e')) {
      threats.push('path_traversal');
    }

    // SQL injection patterns
    if (/['"]\s*(union|select|insert|update|delete|drop|exec|script)/i.test(url)) {
      threats.push('sql_injection');
    }

    // XSS patterns
    if (/<script|javascript:|onload=|onerror=/i.test(url)) {
      threats.push('xss');
    }

    // Suspicious user agents
    if (/bot|crawler|scanner|sqlmap|nikto|nmap/i.test(userAgent) &&
        !/googlebot|bingbot|slurp/i.test(userAgent)) {
      threats.push('suspicious_user_agent');
    }

    // Command injection patterns
    if (/[;&|`$(){}[\]]/g.test(url)) {
      threats.push('command_injection');
    }

    return threats;
  }

  // Apply security headers
  applyHeaders(req, res) {
    const isProd = process.env.NODE_ENV === 'production';
    const isHTTPS = req.headers['x-forwarded-proto'] === 'https' ||
                    req.headers['x-forwarded-ssl'] === 'on' ||
                    req.connection?.encrypted;

    // Core security headers
    if (this.options.headers.xContentTypeOptions) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    if (this.options.headers.xFrameOptions) {
      res.setHeader('X-Frame-Options', this.options.headers.xFrameOptions);
    }

    if (this.options.headers.referrerPolicy) {
      res.setHeader('Referrer-Policy', this.options.headers.referrerPolicy);
    }

    // XSS Protection (legacy, but some old browsers still use it)
    if (this.options.headers.xXssProtection) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // Content Security Policy
    const csp = this.getCSPForRequest(req);
    res.setHeader('Content-Security-Policy', csp);

    // Permissions Policy
    const permissionsPolicy = this.getPermissionsPolicy();
    if (permissionsPolicy) {
      res.setHeader('Permissions-Policy', permissionsPolicy);
    }

    // HSTS (only over HTTPS in production)
    if (isProd && isHTTPS && this.options.hsts) {
      let hstsValue = `max-age=${this.options.hsts.maxAge}`;
      if (this.options.hsts.includeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (this.options.hsts.preload) {
        hstsValue += '; preload';
      }
      res.setHeader('Strict-Transport-Security', hstsValue);
    }

    // Additional security headers
    res.setHeader('X-Powered-By', 'CertNode'); // Replace default Express header
    res.setHeader('Server', 'CertNode/1.0'); // Custom server header

    // Cross-Origin headers for API security
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    // Cache control for sensitive endpoints
    if (/\/(api|v1)\//.test(req.url)) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }

  // Main middleware function
  middleware() {
    return (req, res, next) => {
      // Detect security threats
      const threats = this.detectThreats(req);
      if (threats.length > 0) {
        this.logger.warn('Security threats detected', {
          ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
          url: req.url,
          method: req.method,
          threats,
          userAgent: req.headers['user-agent'],
          request_id: req.id
        });

        // Block obvious attacks
        if (threats.includes('sql_injection') ||
            threats.includes('command_injection') ||
            threats.includes('path_traversal')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'bad_request',
            message: 'Invalid request detected',
            timestamp: new Date().toISOString()
          }));
          return;
        }
      }

      // Apply security headers
      this.applyHeaders(req, res);

      next();
    };
  }
}

// Legacy function for backward compatibility
function securityHeaders(req, res) {
  const middleware = new SecurityMiddleware();
  middleware.applyHeaders(req, res);
}

function createSecurityMiddleware(options = {}) {
  return new SecurityMiddleware(options);
}

module.exports = {
  securityHeaders,
  SecurityMiddleware,
  createSecurityMiddleware
};

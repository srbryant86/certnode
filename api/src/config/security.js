/**
 * Comprehensive Security Configuration
 * Centralizes all security settings and provides environment-specific configurations
 */

const crypto = require('crypto');

// ============================================================================
// Security Configuration Factory
// ============================================================================

class SecurityConfig {
  constructor(environment = process.env.NODE_ENV || 'development') {
    this.environment = environment;
    this.config = this.buildConfiguration();
  }

  buildConfiguration() {
    const baseConfig = {
      // Environment settings
      environment: this.environment,
      debug: this.environment !== 'production',

      // Authentication and Authorization
      auth: {
        adminToken: process.env.ADMIN_TOKEN || this.generateSecureToken(),
        jwtSecret: process.env.JWT_SECRET || this.generateSecureToken(),
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000, // 1 hour
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 900000, // 15 minutes
        requireMFA: process.env.REQUIRE_MFA === 'true' || this.environment === 'production'
      },

      // Rate Limiting
      rateLimit: {
        enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minute
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        skipSuccessfulRequests: true,
        skipFailedRequests: false,
        standardHeaders: true,
        legacyHeaders: false
      },

      // Content Security Policy
      csp: {
        directives: {
          defaultSrc: ["'none'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"]
        },
        reportOnly: this.environment !== 'production',
        reportUri: process.env.CSP_REPORT_URI
      },

      // HTTPS and Transport Security
      https: {
        enforced: process.env.HTTPS_ONLY === 'true' || this.environment === 'production',
        hsts: {
          maxAge: 63072000, // 2 years
          includeSubDomains: true,
          preload: true
        },
        certificate: {
          cert: process.env.SSL_CERT,
          key: process.env.SSL_KEY,
          ca: process.env.SSL_CA
        }
      },

      // CORS Configuration
      cors: {
        origin: this.getCorsOrigins(),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'X-API-Key',
          'Accept',
          'Origin'
        ],
        credentials: true,
        maxAge: 86400, // 24 hours
        optionsSuccessStatus: 204
      },

      // Input Validation
      validation: {
        maxPayloadSize: process.env.MAX_PAYLOAD_SIZE || '10mb',
        maxFieldCount: parseInt(process.env.MAX_FIELD_COUNT) || 100,
        maxFieldSize: process.env.MAX_FIELD_SIZE || '1mb',
        strictMode: process.env.VALIDATION_STRICT === 'true' || this.environment === 'production',
        sanitizeInput: true,
        validateContentType: true
      },

      // Encryption and Hashing
      crypto: {
        algorithm: 'aes-256-gcm',
        keyDerivation: 'pbkdf2',
        iterations: 100000,
        keyLength: 32,
        ivLength: 16,
        tagLength: 16,
        saltLength: 32
      },

      // Security Headers
      headers: {
        xContentTypeOptions: 'nosniff',
        xFrameOptions: 'DENY',
        xXssProtection: false, // Use CSP instead
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: {
          camera: false,
          microphone: false,
          geolocation: false,
          payment: false,
          usb: false,
          notifications: false,
          speaker: false
        },
        crossOriginEmbedderPolicy: 'require-corp',
        crossOriginOpenerPolicy: 'same-origin',
        crossOriginResourcePolicy: 'cross-origin'
      },

      // Threat Detection
      threatDetection: {
        enabled: process.env.THREAT_DETECTION !== 'false',
        blockCritical: true,
        blockHigh: this.environment === 'production',
        monitorAll: true,
        alertThreshold: {
          critical: 1,
          high: 5,
          medium: 10
        }
      },

      // Logging and Monitoring
      logging: {
        level: process.env.LOG_LEVEL || (this.environment === 'production' ? 'info' : 'debug'),
        securityEvents: true,
        auditTrail: true,
        sensitiveDataRedaction: true,
        retention: {
          security: '1y',
          audit: '7y',
          general: '30d'
        }
      },

      // Backup and Recovery
      backup: {
        encryption: true,
        compression: true,
        retention: '90d',
        offsite: this.environment === 'production'
      },

      // Compliance
      compliance: {
        gdpr: process.env.GDPR_COMPLIANCE === 'true',
        ccpa: process.env.CCPA_COMPLIANCE === 'true',
        sox: process.env.SOX_COMPLIANCE === 'true',
        pci: process.env.PCI_COMPLIANCE === 'true',
        iso27001: process.env.ISO27001_COMPLIANCE === 'true'
      }
    };

    return this.applyEnvironmentOverrides(baseConfig);
  }

  generateSecureToken(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  getCorsOrigins() {
    const origins = process.env.CORS_ORIGIN;
    if (!origins) {
      return this.environment === 'production' ? false : ['http://localhost:3000', 'http://localhost:3001'];
    }

    if (origins === '*') {
      if (this.environment === 'production') {
        console.warn('WARNING: CORS wildcard (*) not recommended for production');
      }
      return origins;
    }

    return origins.split(',').map(origin => origin.trim());
  }

  applyEnvironmentOverrides(config) {
    switch (this.environment) {
      case 'production':
        return {
          ...config,
          debug: false,
          csp: {
            ...config.csp,
            reportOnly: false
          },
          threatDetection: {
            ...config.threatDetection,
            blockHigh: true
          },
          https: {
            ...config.https,
            enforced: true
          }
        };

      case 'staging':
        return {
          ...config,
          debug: true,
          threatDetection: {
            ...config.threatDetection,
            blockCritical: true,
            blockHigh: true
          }
        };

      case 'development':
        return {
          ...config,
          debug: true,
          https: {
            ...config.https,
            enforced: false
          },
          threatDetection: {
            ...config.threatDetection,
            blockCritical: false,
            blockHigh: false
          }
        };

      case 'test':
        return {
          ...config,
          debug: false,
          logging: {
            ...config.logging,
            level: 'error'
          },
          threatDetection: {
            ...config.threatDetection,
            enabled: false
          }
        };

      default:
        return config;
    }
  }

  // Get configuration for specific component
  getAuthConfig() {
    return this.config.auth;
  }

  getRateLimitConfig() {
    return this.config.rateLimit;
  }

  getCSPConfig() {
    return this.config.csp;
  }

  getHTTPSConfig() {
    return this.config.https;
  }

  getCORSConfig() {
    return this.config.cors;
  }

  getValidationConfig() {
    return this.config.validation;
  }

  getCryptoConfig() {
    return this.config.crypto;
  }

  getHeadersConfig() {
    return this.config.headers;
  }

  getThreatDetectionConfig() {
    return this.config.threatDetection;
  }

  getLoggingConfig() {
    return this.config.logging;
  }

  getComplianceConfig() {
    return this.config.compliance;
  }

  // Validate configuration
  validate() {
    const errors = [];

    // Check required environment variables for production
    if (this.environment === 'production') {
      const required = [
        'ADMIN_TOKEN',
        'JWT_SECRET',
        'CORS_ORIGIN',
        'SSL_CERT',
        'SSL_KEY'
      ];

      required.forEach(envVar => {
        if (!process.env[envVar]) {
          errors.push(`Missing required environment variable: ${envVar}`);
        }
      });

      // Check token strength
      if (process.env.ADMIN_TOKEN && process.env.ADMIN_TOKEN.length < 32) {
        errors.push('ADMIN_TOKEN should be at least 32 characters long');
      }

      if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        errors.push('JWT_SECRET should be at least 32 characters long');
      }
    }

    // Validate CORS configuration
    if (this.config.cors.origin === '*' && this.environment === 'production') {
      errors.push('CORS wildcard not allowed in production');
    }

    // Validate rate limiting
    if (this.config.rateLimit.maxRequests > 1000) {
      errors.push('Rate limit maxRequests seems too high (>1000)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Generate secure configuration for new deployment
  generateSecureDeploymentConfig() {
    return {
      ADMIN_TOKEN: this.generateSecureToken(64),
      JWT_SECRET: this.generateSecureToken(64),
      SESSION_SECRET: this.generateSecureToken(64),
      ENCRYPTION_KEY: this.generateSecureToken(32),
      NODE_ENV: 'production',
      HTTPS_ONLY: 'true',
      RATE_LIMIT_ENABLED: 'true',
      RATE_LIMIT_MAX: '100',
      VALIDATION_STRICT: 'true',
      THREAT_DETECTION: 'true',
      LOG_LEVEL: 'info',
      CORS_ORIGIN: 'https://yourdomain.com',
      CSP_REPORT_URI: '/security/csp-report'
    };
  }
}

// ============================================================================
// Security Utilities
// ============================================================================

class SecurityUtils {
  static generateCSRF() {
    return crypto.randomBytes(32).toString('hex');
  }

  static hashPassword(password, salt = null) {
    if (!salt) {
      salt = crypto.randomBytes(32).toString('hex');
    }
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return { hash, salt };
  }

  static verifyPassword(password, hash, salt) {
    const verify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verify, 'hex'));
  }

  static encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    cipher.setAAD(Buffer.from('CertNode', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  static decrypt(encryptedData, key) {
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAAD(Buffer.from('CertNode', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }

    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .trim();
  }

  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static generateSecureRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(crypto.randomInt(0, chars.length));
    }
    return result;
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  SecurityConfig,
  SecurityUtils
};
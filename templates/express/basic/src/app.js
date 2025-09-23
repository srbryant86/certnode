/**
 * CertNode Express.js Template
 * Production-ready Express.js application with CertNode receipt verification
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { verifyReceipt, JWKSManager } = require('@certnode/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// Security Middleware
// ============================================================================

// Basic security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'too_many_requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================================================
// General Middleware
// ============================================================================

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// CertNode Configuration
// ============================================================================

const jwksManager = new JWKSManager({
  ttlMs: parseInt(process.env.JWKS_CACHE_TTL) || 300000, // 5 minutes
});

const JWKS_URL = process.env.CERTNODE_JWKS_URL || 'https://api.certnode.io/.well-known/jwks.json';

// ============================================================================
// Middleware Functions
// ============================================================================

/**
 * CertNode Authentication Middleware
 * Verifies CertNode receipts from Authorization header or request body
 */
async function certNodeAuth(req, res, next) {
  try {
    let receipt;

    // Try to get receipt from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('CertNode ')) {
      const receiptData = authHeader.substring(9); // Remove 'CertNode ' prefix
      receipt = JSON.parse(Buffer.from(receiptData, 'base64').toString());
    }
    // Try to get receipt from request body
    else if (req.body && req.body.receipt) {
      receipt = req.body.receipt;
    }
    // Try to get receipt from query parameter
    else if (req.query.receipt) {
      receipt = JSON.parse(req.query.receipt);
    }

    if (!receipt) {
      return res.status(401).json({
        error: 'missing_receipt',
        message: 'CertNode receipt required for authentication'
      });
    }

    // Fetch JWKS and verify receipt
    const jwks = await jwksManager.fetchFromUrl(JWKS_URL);
    const result = await verifyReceipt({ receipt, jwks });

    if (!result.ok) {
      return res.status(401).json({
        error: 'invalid_receipt',
        message: `Receipt verification failed: ${result.reason}`,
        receiptId: receipt.receipt_id || receipt.kid
      });
    }

    // Add verified data to request
    req.certnode = {
      receipt,
      payload: receipt.payload,
      kid: receipt.kid,
      isValid: true
    };

    next();
  } catch (error) {
    console.error('CertNode authentication error:', error);
    res.status(500).json({
      error: 'verification_error',
      message: 'Internal error during receipt verification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Optional CertNode Authentication
 * Verifies receipts if present but doesn't require them
 */
async function optionalCertNodeAuth(req, res, next) {
  try {
    // Check if receipt is provided
    const hasReceipt = req.headers.authorization?.startsWith('CertNode ') ||
                      req.body?.receipt ||
                      req.query?.receipt;

    if (!hasReceipt) {
      req.certnode = { isValid: false };
      return next();
    }

    // Use the main auth middleware
    return certNodeAuth(req, res, next);
  } catch (error) {
    console.error('Optional CertNode auth error:', error);
    req.certnode = { isValid: false, error: error.message };
    next();
  }
}

// ============================================================================
// Routes
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Public endpoint (no authentication required)
app.get('/api/public', (req, res) => {
  res.json({
    message: 'This is a public endpoint',
    timestamp: new Date().toISOString()
  });
});

// Protected endpoint (CertNode authentication required)
app.post('/api/protected', certNodeAuth, (req, res) => {
  res.json({
    message: 'Successfully authenticated with CertNode!',
    verifiedPayload: req.certnode.payload,
    kid: req.certnode.kid,
    timestamp: new Date().toISOString()
  });
});

// Mixed endpoint (optional authentication)
app.get('/api/mixed', optionalCertNodeAuth, (req, res) => {
  if (req.certnode.isValid) {
    res.json({
      message: 'Authenticated user access',
      verifiedPayload: req.certnode.payload,
      kid: req.certnode.kid,
      authenticated: true
    });
  } else {
    res.json({
      message: 'Anonymous access',
      authenticated: false,
      note: 'Provide a CertNode receipt for additional features'
    });
  }
});

// Receipt verification endpoint
app.post('/api/verify', async (req, res) => {
  try {
    const { receipt, jwks: providedJwks } = req.body;

    if (!receipt) {
      return res.status(400).json({
        error: 'missing_receipt',
        message: 'Receipt is required for verification'
      });
    }

    // Use provided JWKS or fetch from configured URL
    const jwks = providedJwks || await jwksManager.fetchFromUrl(JWKS_URL);
    const result = await verifyReceipt({ receipt, jwks });

    res.json({
      valid: result.ok,
      reason: result.reason || null,
      receiptId: receipt.receipt_id || receipt.kid,
      algorithm: receipt.protected ?
        JSON.parse(Buffer.from(receipt.protected, 'base64').toString()).alg :
        null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Verification endpoint error:', error);
    res.status(500).json({
      error: 'verification_error',
      message: 'Failed to verify receipt',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Batch verification endpoint
app.post('/api/verify/batch', async (req, res) => {
  try {
    const { receipts, jwks: providedJwks } = req.body;

    if (!Array.isArray(receipts) || receipts.length === 0) {
      return res.status(400).json({
        error: 'invalid_receipts',
        message: 'Array of receipts is required'
      });
    }

    if (receipts.length > 100) {
      return res.status(400).json({
        error: 'too_many_receipts',
        message: 'Maximum 100 receipts allowed per batch'
      });
    }

    const jwks = providedJwks || await jwksManager.fetchFromUrl(JWKS_URL);

    const results = await Promise.all(
      receipts.map(async (receipt, index) => {
        try {
          const result = await verifyReceipt({ receipt, jwks });
          return {
            index,
            receiptId: receipt.receipt_id || receipt.kid,
            valid: result.ok,
            reason: result.reason || null
          };
        } catch (error) {
          return {
            index,
            receiptId: receipt.receipt_id || receipt.kid,
            valid: false,
            reason: error.message
          };
        }
      })
    );

    const summary = {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      validPercentage: Math.round((results.filter(r => r.valid).length / results.length) * 100)
    };

    res.json({
      summary,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Batch verification error:', error);
    res.status(500).json({
      error: 'batch_verification_error',
      message: 'Failed to verify receipts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// JWKS endpoint (proxy to CertNode JWKS)
app.get('/api/jwks', async (req, res) => {
  try {
    const jwks = await jwksManager.fetchFromUrl(JWKS_URL);
    res.json(jwks);
  } catch (error) {
    console.error('JWKS fetch error:', error);
    res.status(500).json({
      error: 'jwks_fetch_error',
      message: 'Failed to fetch JWKS'
    });
  }
});

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    error: 'internal_error',
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// Server Startup
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`🚀 CertNode Express server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 JWKS URL: ${JWKS_URL}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }

    console.log('Server closed successfully');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
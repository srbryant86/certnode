const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('redis');
const { verifyReceipt, JWKSManager } = require('@certnode/sdk');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 4000;

// Redis client
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.connect();

// JWKS Manager
const jwksManager = new JWKSManager({ ttlMs: 10 * 60 * 1000 }); // 10 minute cache

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many verification requests, please try again later'
});
app.use('/api/', limiter);

// Metrics tracking
let metrics = {
  totalVerifications: 0,
  successfulVerifications: 0,
  failedVerifications: 0,
  cacheHits: 0,
  cacheMisses: 0,
  averageResponseTime: 0
};

// Helper function to generate cache key
function getCacheKey(receipt, jwksUrl) {
  const receiptStr = JSON.stringify(receipt);
  const hash = crypto.createHash('sha256').update(receiptStr + jwksUrl).digest('hex');
  return `certnode:verification:${hash}`;
}

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'CertNode Verification Service',
    description: 'Microservice for receipt verification with caching',
    version: '1.0.0',
    endpoints: {
      'POST /api/verify': 'Verify a receipt',
      'POST /api/verify/batch': 'Verify multiple receipts',
      'GET /api/metrics': 'Service metrics',
      'GET /health': 'Health check'
    }
  });
});

app.get('/health', async (req, res) => {
  try {
    // Check Redis connection
    await redis.ping();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      redis: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/metrics', (req, res) => {
  res.json({
    ...metrics,
    cacheHitRate: metrics.totalVerifications > 0
      ? Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100)
      : 0,
    successRate: metrics.totalVerifications > 0
      ? Math.round((metrics.successfulVerifications / metrics.totalVerifications) * 100)
      : 0
  });
});

app.post('/api/verify', async (req, res) => {
  const startTime = Date.now();

  try {
    const { receipt, jwksUrl } = req.body;

    if (!receipt) {
      return res.status(400).json({ error: 'Receipt is required' });
    }

    if (!jwksUrl) {
      return res.status(400).json({ error: 'JWKS URL is required' });
    }

    // Check cache first
    const cacheKey = getCacheKey(receipt, jwksUrl);
    let cachedResult = null;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        cachedResult = JSON.parse(cached);
        metrics.cacheHits++;
      } else {
        metrics.cacheMisses++;
      }
    } catch (cacheError) {
      console.warn('Cache error:', cacheError);
      metrics.cacheMisses++;
    }

    if (cachedResult) {
      const responseTime = Date.now() - startTime;
      metrics.averageResponseTime = (metrics.averageResponseTime * metrics.totalVerifications + responseTime) / (metrics.totalVerifications + 1);
      metrics.totalVerifications++;

      return res.json({
        ...cachedResult,
        cached: true,
        responseTime
      });
    }

    // Fetch JWKS and verify
    const jwks = await jwksManager.fetchFromUrl(jwksUrl);
    const result = await verifyReceipt({ receipt, jwks });

    // Cache the result for 5 minutes
    const cacheData = {
      valid: result.ok,
      reason: result.reason,
      kid: receipt.kid,
      algorithm: receipt.protected ?
        JSON.parse(Buffer.from(receipt.protected, 'base64url').toString()).alg :
        null,
      timestamp: new Date().toISOString()
    };

    try {
      await redis.setEx(cacheKey, 300, JSON.stringify(cacheData)); // 5 minute TTL
    } catch (cacheError) {
      console.warn('Cache write error:', cacheError);
    }

    // Update metrics
    const responseTime = Date.now() - startTime;
    metrics.averageResponseTime = (metrics.averageResponseTime * metrics.totalVerifications + responseTime) / (metrics.totalVerifications + 1);
    metrics.totalVerifications++;

    if (result.ok) {
      metrics.successfulVerifications++;
    } else {
      metrics.failedVerifications++;
    }

    res.json({
      ...cacheData,
      cached: false,
      responseTime
    });

  } catch (error) {
    console.error('Verification error:', error);

    const responseTime = Date.now() - startTime;
    metrics.averageResponseTime = (metrics.averageResponseTime * metrics.totalVerifications + responseTime) / (metrics.totalVerifications + 1);
    metrics.totalVerifications++;
    metrics.failedVerifications++;

    res.status(500).json({
      error: 'Verification failed',
      details: error.message,
      responseTime
    });
  }
});

app.post('/api/verify/batch', async (req, res) => {
  const startTime = Date.now();

  try {
    const { receipts, jwksUrl } = req.body;

    if (!Array.isArray(receipts) || receipts.length === 0) {
      return res.status(400).json({ error: 'Receipts array is required' });
    }

    if (!jwksUrl) {
      return res.status(400).json({ error: 'JWKS URL is required' });
    }

    if (receipts.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 receipts per batch' });
    }

    // Fetch JWKS once for all receipts
    const jwks = await jwksManager.fetchFromUrl(jwksUrl);

    // Process receipts in parallel
    const results = await Promise.all(
      receipts.map(async (receipt, index) => {
        try {
          // Check cache
          const cacheKey = getCacheKey(receipt, jwksUrl);
          let cachedResult = null;

          try {
            const cached = await redis.get(cacheKey);
            if (cached) {
              cachedResult = JSON.parse(cached);
              metrics.cacheHits++;
            } else {
              metrics.cacheMisses++;
            }
          } catch (cacheError) {
            metrics.cacheMisses++;
          }

          if (cachedResult) {
            return {
              index,
              ...cachedResult,
              cached: true
            };
          }

          // Verify receipt
          const result = await verifyReceipt({ receipt, jwks });

          const verificationResult = {
            index,
            valid: result.ok,
            reason: result.reason,
            kid: receipt.kid,
            receiptId: receipt.receipt_id,
            cached: false
          };

          // Cache result
          try {
            await redis.setEx(cacheKey, 300, JSON.stringify(verificationResult));
          } catch (cacheError) {
            console.warn('Cache write error:', cacheError);
          }

          // Update metrics
          metrics.totalVerifications++;
          if (result.ok) {
            metrics.successfulVerifications++;
          } else {
            metrics.failedVerifications++;
          }

          return verificationResult;

        } catch (error) {
          metrics.totalVerifications++;
          metrics.failedVerifications++;

          return {
            index,
            valid: false,
            reason: error.message,
            cached: false
          };
        }
      })
    );

    const responseTime = Date.now() - startTime;
    const summary = {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      cached: results.filter(r => r.cached).length
    };

    res.json({
      summary,
      results,
      responseTime
    });

  } catch (error) {
    console.error('Batch verification error:', error);

    const responseTime = Date.now() - startTime;
    res.status(500).json({
      error: 'Batch verification failed',
      details: error.message,
      responseTime
    });
  }
});

// Clear cache endpoint (for testing)
app.delete('/api/cache', async (req, res) => {
  try {
    await redis.flushDb();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await redis.disconnect();
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 CertNode Verification Service running on http://localhost:${port}`);
  console.log(`📊 Metrics available at http://localhost:${port}/api/metrics`);
  console.log(`🔐 Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
});

module.exports = app;
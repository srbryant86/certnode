/**
 * Performance Optimization Middleware
 * Implements caching, compression, and response optimization strategies
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// In-Memory Caching Layer
// ============================================================================

class MemoryCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  generateKey(req) {
    const keyParts = [
      req.method,
      req.url,
      req.headers['accept-encoding'] || '',
      req.headers['accept'] || ''
    ];
    return crypto.createHash('md5').update(keyParts.join('|')).digest('hex');
  }

  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  set(key, data, ttl = this.defaultTTL) {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
      created: Date.now()
    });

    this.stats.sets++;
  }

  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
  }

  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: parseFloat((hitRate * 100).toFixed(2)),
      maxSize: this.maxSize
    };
  }
}

// Global cache instances
const responseCache = new MemoryCache({ maxSize: 500, defaultTTL: 300000 }); // 5 min
const staticCache = new MemoryCache({ maxSize: 1000, defaultTTL: 3600000 }); // 1 hour
const apiCache = new MemoryCache({ maxSize: 200, defaultTTL: 60000 }); // 1 min

// ============================================================================
// Response Compression
// ============================================================================

class CompressionHandler {
  constructor() {
    this.zlib = require('zlib');
    this.compressibleTypes = new Set([
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      'application/json',
      'application/xml',
      'text/xml',
      'text/plain',
      'image/svg+xml'
    ]);
  }

  shouldCompress(contentType, contentLength) {
    if (contentLength && contentLength < 1024) {
      return false; // Don't compress small responses
    }

    const type = contentType?.split(';')[0]?.toLowerCase();
    return this.compressibleTypes.has(type);
  }

  async compressResponse(content, encoding, contentType) {
    if (!this.shouldCompress(contentType, content.length)) {
      return { content, encoding: null };
    }

    try {
      if (encoding.includes('br') && this.zlib.brotliCompress) {
        // Brotli compression (best compression ratio)
        const compressed = this.zlib.brotliCompressSync(content, {
          params: {
            [this.zlib.constants.BROTLI_PARAM_MODE]: this.zlib.constants.BROTLI_MODE_TEXT,
            [this.zlib.constants.BROTLI_PARAM_QUALITY]: 6
          }
        });
        return { content: compressed, encoding: 'br' };
      } else if (encoding.includes('gzip')) {
        // Gzip compression
        const compressed = this.zlib.gzipSync(content, { level: 6 });
        return { content: compressed, encoding: 'gzip' };
      } else if (encoding.includes('deflate')) {
        // Deflate compression
        const compressed = this.zlib.deflateSync(content, { level: 6 });
        return { content: compressed, encoding: 'deflate' };
      }
    } catch (error) {
      // Compression failed, return original content
      console.warn('Compression failed:', error.message);
    }

    return { content, encoding: null };
  }
}

const compressionHandler = new CompressionHandler();

// ============================================================================
// HTTP/2 Server Push Hints
// ============================================================================

class PushHintsManager {
  constructor() {
    this.hints = new Map();
    this.setupCommonHints();
  }

  setupCommonHints() {
    // Define critical resources for server push
    this.hints.set('/', [
      { url: '/css/style.css', as: 'style' },
      { url: '/js/main.js', as: 'script' }
    ]);

    this.hints.set('/verify', [
      { url: '/css/style.css', as: 'style' },
      { url: '/js/verify.js', as: 'script' }
    ]);

    this.hints.set('/pricing', [
      { url: '/css/style.css', as: 'style' },
      { url: '/js/pricing.js', as: 'script' }
    ]);
  }

  getHints(pathname) {
    return this.hints.get(pathname) || [];
  }

  addPreloadHeaders(res, pathname) {
    if (res.headersSent || res.finished) {
      return;
    }

    const hints = this.getHints(pathname);
    if (hints.length > 0) {
      try {
        const linkHeader = hints
          .map(hint => `<${hint.url}>; rel=preload; as=${hint.as}`)
          .join(', ');
        res.setHeader('Link', linkHeader);
      } catch (error) {
        // Headers already sent, ignore
      }
    }
  }
}

const pushHints = new PushHintsManager();

// ============================================================================
// ETag Generation and Validation
// ============================================================================

class ETagManager {
  generateETag(content) {
    if (Buffer.isBuffer(content)) {
      return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
    }

    if (typeof content === 'string') {
      return `"${crypto.createHash('md5').update(content, 'utf8').digest('hex')}"`;
    }

    if (typeof content === 'object') {
      const str = JSON.stringify(content);
      return `"${crypto.createHash('md5').update(str, 'utf8').digest('hex')}"`;
    }

    return null;
  }

  isNotModified(req, etag) {
    const ifNoneMatch = req.headers['if-none-match'];
    return ifNoneMatch === etag;
  }

  setETagHeaders(res, content) {
    if (res.headersSent || res.finished) {
      return null;
    }

    const etag = this.generateETag(content);
    if (etag) {
      try {
        res.setHeader('ETag', etag);
        return etag;
      } catch (error) {
        // Headers already sent, return null
        return null;
      }
    }
    return null;
  }
}

const etagManager = new ETagManager();

// ============================================================================
// Performance Middleware Factory
// ============================================================================

function createPerformanceMiddleware(options = {}) {
  const {
    enableCache = true,
    enableCompression = true,
    enableETag = true,
    enablePushHints = true,
    cacheRoutes = ['/jwks', '/.well-known/jwks.json', '/health', '/metrics'],
    compressionThreshold = 1024
  } = options;

  return {
    // Cache middleware for specific routes
    cacheMiddleware: (req, res, next) => {
      if (!enableCache) return next();

      const shouldCache = cacheRoutes.some(route =>
        req.url === route || req.url.startsWith(route)
      );

      if (!shouldCache || req.method !== 'GET') {
        return next();
      }

      const cacheKey = responseCache.generateKey(req);
      const cached = responseCache.get(cacheKey);

      if (cached) {
        // Serve from cache
        res.writeHead(cached.statusCode, cached.headers);
        res.end(cached.body);
        return;
      }

      // Intercept response to cache it
      const originalWriteHead = res.writeHead;
      const originalEnd = res.end;
      let statusCode = 200;
      let headers = {};
      let body = Buffer.alloc(0);

      res.writeHead = function(code, hdrs) {
        statusCode = code;
        headers = { ...headers, ...hdrs };
        originalWriteHead.call(this, code, hdrs);
      };

      res.end = function(chunk) {
        if (chunk) {
          try {
            // Handle Promise properly - don't try to convert it to Buffer
            if (chunk && typeof chunk.then === 'function') {
              // This is a Promise, which shouldn't be passed to res.end
              console.warn('Warning: Promise passed to res.end, this should be awaited first');
              body = Buffer.from(''); // Empty buffer as fallback
            } else {
              body = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            }
          } catch (conversionError) {
            console.warn('Buffer conversion failed:', conversionError.message);
            body = Buffer.from(''); // Empty buffer as fallback
          }
        }

        // Cache successful responses
        if (statusCode >= 200 && statusCode < 300) {
          responseCache.set(cacheKey, {
            statusCode,
            headers,
            body
          });
        }

        originalEnd.call(this, chunk);
      };

      next();
    },

    // Compression middleware
    compressionMiddleware: (req, res, next) => {
      if (!enableCompression) return next();

      const acceptEncoding = req.headers['accept-encoding'] || '';

      if (!acceptEncoding) {
        return next();
      }

      // Store original end method, ensuring we don't double-wrap
      if (!res._originalEnd) {
        res._originalEnd = res.end;
      }
      const originalEnd = res._originalEnd;

      res.end = async function(chunk) {
        // Handle Promises properly - they should not reach res.end
        if (chunk && typeof chunk.then === 'function') {
          console.warn('Warning: Promise passed to compression middleware, this should be awaited first');
          return originalEnd.call(this, chunk);
        }

        // Multiple safety checks to prevent header conflicts
        if (res.headersSent || !chunk || chunk.length < compressionThreshold) {
          return originalEnd.call(this, chunk);
        }

        const contentType = res.getHeader('content-type') || '';

        try {
          const { content, encoding } = await compressionHandler.compressResponse(
            chunk,
            acceptEncoding,
            contentType
          );

          // Final safety check before setting headers
          if (encoding && !res.headersSent && !res.finished) {
            try {
              res.setHeader('Content-Encoding', encoding);
              res.setHeader('Content-Length', content.length);
              res.setHeader('Vary', 'Accept-Encoding');
              originalEnd.call(this, content);
            } catch (headerError) {
              // Headers already sent, fall back to uncompressed
              originalEnd.call(this, chunk);
            }
          } else {
            originalEnd.call(this, content || chunk);
          }
        } catch (error) {
          // Compression failed, return original content
          originalEnd.call(this, chunk);
        }
      };

      next();
    },

    // ETag middleware
    etagMiddleware: (req, res, next) => {
      if (!enableETag || req.method !== 'GET') {
        return next();
      }

      // Store original end method, ensuring we don't double-wrap
      if (!res._originalEnd) {
        res._originalEnd = res.end;
      }
      const originalEnd = res._originalEnd;

      res.end = function(chunk) {
        // Handle Promises properly - they should not reach res.end
        if (chunk && typeof chunk.then === 'function') {
          console.warn('Warning: Promise passed to ETag middleware, this should be awaited first');
          return originalEnd.call(this, chunk);
        }

        // Multiple safety checks to prevent header conflicts
        if (res.headersSent || res.finished || !chunk || res.statusCode < 200 || res.statusCode >= 300) {
          return originalEnd.call(this, chunk);
        }

        try {
          const etag = etagManager.setETagHeaders(res, chunk);

          if (etag && etagManager.isNotModified(req, etag) && !res.headersSent) {
            try {
              res.statusCode = 304;
              res.removeHeader('Content-Length');
              res.removeHeader('Content-Type');
              originalEnd.call(this);
              return;
            } catch (headerError) {
              // Headers already sent, continue with normal response
            }
          }
        } catch (error) {
          // ETag processing failed, continue with normal response
        }

        originalEnd.call(this, chunk);
      };

      next();
    },

    // Push hints middleware
    pushHintsMiddleware: (req, res, next) => {
      if (!enablePushHints || req.method !== 'GET') {
        return next();
      }

      const url = new URL(req.url, `http://${req.headers.host}`);
      pushHints.addPreloadHeaders(res, url.pathname);

      next();
    },

    // Get cache statistics
    getCacheStats: () => ({
      response: responseCache.getStats(),
      static: staticCache.getStats(),
      api: apiCache.getStats()
    }),

    // Clear caches
    clearCaches: () => {
      responseCache.clear();
      staticCache.clear();
      apiCache.clear();
    }
  };
}

// ============================================================================
// Request Optimization Utilities
// ============================================================================

class RequestOptimizer {
  constructor() {
    this.requestPool = new Map();
    this.pendingRequests = new Map();
  }

  // Deduplicate identical concurrent requests
  deduplicateRequest(key, requestHandler) {
    if (this.pendingRequests.has(key)) {
      // Return existing promise for identical request
      return this.pendingRequests.get(key);
    }

    const promise = requestHandler()
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  // Batch similar requests
  batchRequests(requests, batchHandler, batchSize = 10) {
    const batches = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }

    return Promise.all(
      batches.map(batch => batchHandler(batch))
    ).then(results => results.flat());
  }
}

const requestOptimizer = new RequestOptimizer();

// ============================================================================
// Performance Monitoring
// ============================================================================

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requestCount: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      cacheHitRate: 0,
      compressionRatio: 0,
      memoryUsage: {},
      lastUpdated: Date.now()
    };
  }

  recordRequest(duration, cached = false, compressed = false, originalSize = 0, compressedSize = 0) {
    this.metrics.requestCount++;
    this.metrics.totalResponseTime += duration;
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.requestCount;

    if (duration > 1000) { // Slow request threshold: 1 second
      this.metrics.slowRequests++;
    }

    if (compressed && originalSize > 0) {
      const ratio = (originalSize - compressedSize) / originalSize;
      this.metrics.compressionRatio = (this.metrics.compressionRatio + ratio) / 2;
    }

    this.updateMemoryMetrics();
    this.metrics.lastUpdated = Date.now();
  }

  updateMemoryMetrics() {
    const usage = process.memoryUsage();
    this.metrics.memoryUsage = {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    };
  }

  getMetrics() {
    const cacheStats = responseCache.getStats();
    this.metrics.cacheHitRate = cacheStats.hitRate;

    return {
      ...this.metrics,
      cache: cacheStats,
      uptime: process.uptime(),
      pid: process.pid
    };
  }

  reset() {
    this.metrics = {
      requestCount: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      cacheHitRate: 0,
      compressionRatio: 0,
      memoryUsage: {},
      lastUpdated: Date.now()
    };
  }
}

const performanceMonitor = new PerformanceMonitor();

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  createPerformanceMiddleware,
  MemoryCache,
  CompressionHandler,
  ETagManager,
  RequestOptimizer,
  PerformanceMonitor,

  // Instances
  responseCache,
  staticCache,
  apiCache,
  compressionHandler,
  etagManager,
  requestOptimizer,
  performanceMonitor
};
/**
 * Optimized Routing Middleware
 * Provides fast route matching and request handling optimizations
 */

const { performanceMonitor } = require('./performance');

// ============================================================================
// Route Trie for Fast Matching
// ============================================================================

class RouteNode {
  constructor() {
    this.children = new Map();
    this.handler = null;
    this.method = null;
    this.isWildcard = false;
    this.paramName = null;
  }
}

class RouteTrie {
  constructor() {
    this.root = new RouteNode();
    this.staticRoutes = new Map(); // Fast lookup for exact static routes
  }

  addRoute(method, path, handler) {
    // Add to static routes cache for exact matches
    const staticKey = `${method}:${path}`;
    this.staticRoutes.set(staticKey, handler);

    // Add to trie for pattern matching
    const segments = path.split('/').filter(Boolean);
    let current = this.root;

    for (const segment of segments) {
      if (segment.startsWith(':')) {
        // Parameter segment
        const paramName = segment.slice(1);
        let paramNode = null;

        for (const [key, child] of current.children) {
          if (child.isWildcard && child.paramName === paramName) {
            paramNode = child;
            break;
          }
        }

        if (!paramNode) {
          paramNode = new RouteNode();
          paramNode.isWildcard = true;
          paramNode.paramName = paramName;
          current.children.set(`:${paramName}`, paramNode);
        }

        current = paramNode;
      } else {
        // Static segment
        if (!current.children.has(segment)) {
          current.children.set(segment, new RouteNode());
        }
        current = current.children.get(segment);
      }
    }

    current.handler = handler;
    current.method = method;
  }

  findRoute(method, path) {
    // Fast path: check static routes first
    const staticKey = `${method}:${path}`;
    const staticHandler = this.staticRoutes.get(staticKey);
    if (staticHandler) {
      return { handler: staticHandler, params: {} };
    }

    // Pattern matching path
    const segments = path.split('/').filter(Boolean);
    const params = {};
    let current = this.root;

    for (const segment of segments) {
      // Try exact match first
      if (current.children.has(segment)) {
        current = current.children.get(segment);
        continue;
      }

      // Try wildcard match
      let wildcardNode = null;
      for (const [key, child] of current.children) {
        if (child.isWildcard) {
          wildcardNode = child;
          params[child.paramName] = segment;
          break;
        }
      }

      if (wildcardNode) {
        current = wildcardNode;
        continue;
      }

      // No match found
      return null;
    }

    if (current.handler && current.method === method) {
      return { handler: current.handler, params };
    }

    return null;
  }
}

// ============================================================================
// Optimized Request Router
// ============================================================================

class OptimizedRouter {
  constructor() {
    this.trie = new RouteTrie();
    this.middleware = [];
    this.errorHandler = null;
    this.notFoundHandler = null;
    this.methodCache = new Map(); // Cache for method-specific routes
  }

  use(middleware) {
    this.middleware.push(middleware);
  }

  get(path, handler) {
    this.addRoute('GET', path, handler);
  }

  post(path, handler) {
    this.addRoute('POST', path, handler);
  }

  put(path, handler) {
    this.addRoute('PUT', path, handler);
  }

  delete(path, handler) {
    this.addRoute('DELETE', path, handler);
  }

  addRoute(method, path, handler) {
    this.trie.addRoute(method, path, handler);
  }

  setErrorHandler(handler) {
    this.errorHandler = handler;
  }

  setNotFoundHandler(handler) {
    this.notFoundHandler = handler;
  }

  async handle(req, res) {
    const startTime = Date.now();

    try {
      // Parse URL once
      req.parsedUrl = req.parsedUrl || new URL(req.url, `http://${req.headers.host}`);
      const { pathname } = req.parsedUrl;

      // Find route
      const route = this.trie.findRoute(req.method, pathname);

      if (!route) {
        if (this.notFoundHandler) {
          return await this.notFoundHandler(req, res);
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'not_found' }));
        }
      }

      // Add route params to request
      req.params = route.params;

      // Run middleware
      for (const middleware of this.middleware) {
        await this.runMiddleware(middleware, req, res);
      }

      // Run route handler
      await route.handler(req, res);

      // Record performance metrics
      const duration = Date.now() - startTime;
      performanceMonitor.recordRequest(duration);

    } catch (error) {
      const duration = Date.now() - startTime;
      performanceMonitor.recordRequest(duration);

      if (this.errorHandler) {
        return await this.errorHandler(error, req, res);
      } else {
        console.error('Router error:', error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'internal_error' }));
        }
      }
    }
  }

  async runMiddleware(middleware, req, res) {
    return new Promise((resolve, reject) => {
      middleware(req, res, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

// ============================================================================
// Request Pooling and Batching
// ============================================================================

class RequestBatcher {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 10;
    this.batchTimeout = options.batchTimeout || 100; // ms
    this.batches = new Map();
  }

  addToBatch(key, request) {
    if (!this.batches.has(key)) {
      this.batches.set(key, {
        requests: [],
        timer: null
      });
    }

    const batch = this.batches.get(key);
    batch.requests.push(request);

    // Process batch if full
    if (batch.requests.length >= this.batchSize) {
      this.processBatch(key);
    } else if (!batch.timer) {
      // Set timer for partial batch
      batch.timer = setTimeout(() => {
        this.processBatch(key);
      }, this.batchTimeout);
    }
  }

  async processBatch(key) {
    const batch = this.batches.get(key);
    if (!batch || batch.requests.length === 0) {
      return;
    }

    // Clear timer
    if (batch.timer) {
      clearTimeout(batch.timer);
    }

    const requests = batch.requests.slice();
    this.batches.delete(key);

    try {
      // Process all requests in the batch
      await Promise.all(requests.map(request => request.handler()));
    } catch (error) {
      console.error('Batch processing error:', error);
      // Handle individual request errors
      requests.forEach(request => {
        if (request.reject) {
          request.reject(error);
        }
      });
    }
  }
}

// ============================================================================
// Connection Pooling
// ============================================================================

class ConnectionPool {
  constructor(options = {}) {
    this.maxConnections = options.maxConnections || 100;
    this.connectionTimeout = options.connectionTimeout || 30000; // 30 seconds
    this.connections = new Set();
    this.queue = [];
    this.stats = {
      active: 0,
      waiting: 0,
      created: 0,
      destroyed: 0
    };
  }

  addConnection(connection) {
    if (this.connections.size >= this.maxConnections) {
      // Close oldest connection
      const oldest = this.connections.values().next().value;
      if (oldest) {
        oldest.destroy();
        this.connections.delete(oldest);
      }
    }

    this.connections.add(connection);
    this.stats.active = this.connections.size;
    this.stats.created++;

    // Set timeout for idle connections
    const timeout = setTimeout(() => {
      if (this.connections.has(connection)) {
        connection.destroy();
        this.connections.delete(connection);
        this.stats.active = this.connections.size;
        this.stats.destroyed++;
      }
    }, this.connectionTimeout);

    connection.on('close', () => {
      clearTimeout(timeout);
      this.connections.delete(connection);
      this.stats.active = this.connections.size;
    });

    connection.on('error', () => {
      clearTimeout(timeout);
      this.connections.delete(connection);
      this.stats.active = this.connections.size;
      this.stats.destroyed++;
    });
  }

  getStats() {
    return {
      ...this.stats,
      maxConnections: this.maxConnections,
      utilizationRate: (this.stats.active / this.maxConnections * 100).toFixed(2) + '%'
    };
  }
}

// ============================================================================
// Response Streaming Optimization
// ============================================================================

class StreamOptimizer {
  constructor() {
    this.chunkSize = 64 * 1024; // 64KB chunks
  }

  createOptimizedStream(data, res, contentType = 'application/json') {
    const chunks = this.chunkData(data);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache'
    });

    let index = 0;
    const writeNext = () => {
      if (index < chunks.length) {
        res.write(chunks[index]);
        index++;
        setImmediate(writeNext); // Non-blocking iteration
      } else {
        res.end();
      }
    };

    writeNext();
  }

  chunkData(data) {
    if (typeof data === 'string') {
      const buffer = Buffer.from(data, 'utf8');
      return this.chunkBuffer(buffer);
    }

    if (Buffer.isBuffer(data)) {
      return this.chunkBuffer(data);
    }

    if (typeof data === 'object') {
      const json = JSON.stringify(data);
      const buffer = Buffer.from(json, 'utf8');
      return this.chunkBuffer(buffer);
    }

    return [data];
  }

  chunkBuffer(buffer) {
    const chunks = [];
    for (let i = 0; i < buffer.length; i += this.chunkSize) {
      chunks.push(buffer.slice(i, i + this.chunkSize));
    }
    return chunks;
  }
}

// ============================================================================
// Exports
// ============================================================================

const globalRouter = new OptimizedRouter();
const requestBatcher = new RequestBatcher();
const connectionPool = new ConnectionPool();
const streamOptimizer = new StreamOptimizer();

module.exports = {
  OptimizedRouter,
  RouteTrie,
  RequestBatcher,
  ConnectionPool,
  StreamOptimizer,

  // Global instances
  globalRouter,
  requestBatcher,
  connectionPool,
  streamOptimizer
};
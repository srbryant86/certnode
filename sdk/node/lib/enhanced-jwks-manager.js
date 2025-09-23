/**
 * Enhanced JWKS Manager with Circuit Breaker and Retry Logic
 * Provides resilient JWKS fetching with comprehensive error handling
 */

const https = require('https');
const { withRetry, createNetworkError, createConfigurationError } = require('./errors');
const { withCircuitBreaker } = require('./circuit-breaker');

// ============================================================================
// Enhanced JWKS Manager
// ============================================================================

/**
 * Enhanced JWKS Manager with retry logic, circuit breaker, and comprehensive error handling
 */
class EnhancedJWKSManager {
  /**
   * @param {Object} options - Configuration options
   * @param {number} options.ttlMs - TTL for cached JWKS in milliseconds (default: 300000 = 5 minutes)
   * @param {Function} options.fetcher - Custom fetch function
   * @param {boolean} options.enableRetry - Enable automatic retry on failure (default: true)
   * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
   * @param {number} options.retryDelayMs - Base delay between retries in milliseconds (default: 1000)
   * @param {boolean} options.enableCircuitBreaker - Enable circuit breaker protection (default: true)
   * @param {boolean} options.enableStats - Enable cache statistics (default: false)
   * @param {number} options.timeoutMs - Request timeout in milliseconds (default: 5000)
   */
  constructor(options = {}) {
    this.ttlMs = options.ttlMs || 300000; // 5 minutes
    this.fetcher = options.fetcher;
    this.enableRetry = options.enableRetry !== false;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelayMs = options.retryDelayMs || 1000;
    this.enableCircuitBreaker = options.enableCircuitBreaker !== false;
    this.enableStats = options.enableStats || false;
    this.timeoutMs = options.timeoutMs || 5000;

    // Cache storage
    this.cache = null; // { jwks, fetchedAt, etag, lastModified, url }

    // Statistics tracking
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      lastFetchTime: null,
      cacheSize: 0,
      fetchAttempts: 0,
      fetchFailures: 0,
      averageFetchTimeMs: 0,
      totalFetchTimeMs: 0
    };

    // Validate configuration
    this._validateConfig();
  }

  /**
   * Get cached JWKS if available and valid
   * @returns {Object|null} Cached JWKS or null if not available/expired
   */
  getFresh() {
    if (!this.cache) {
      if (this.enableStats) this.stats.misses++;
      return null;
    }

    const age = Date.now() - this.cache.fetchedAt;
    if (age <= this.ttlMs) {
      if (this.enableStats) this.stats.hits++;
      return this.cache.jwks;
    }

    // Cache expired
    if (this.enableStats) {
      this.stats.misses++;
      this.stats.evictions++;
    }
    return null;
  }

  /**
   * Set JWKS from object with validation
   * @param {Object} jwks - JWKS object to cache
   * @returns {Object} Validated JWKS object
   */
  setFromObject(jwks) {
    // Validate JWKS structure
    const validation = this.validate(jwks);
    if (!validation.valid) {
      throw createConfigurationError('jwks', jwks, 'valid JWKS object');
    }

    this.cache = {
      jwks,
      fetchedAt: Date.now(),
      etag: null,
      lastModified: null,
      url: null
    };

    if (this.enableStats) {
      this.stats.cacheSize = this._calculateCacheSize(jwks);
    }

    return jwks;
  }

  /**
   * Fetch JWKS from URL with retry logic and circuit breaker protection
   * @param {string} url - JWKS endpoint URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Fetched JWKS object
   */
  async fetchFromUrl(url, options = {}) {
    if (!url || typeof url !== 'string') {
      throw createConfigurationError('url', url, 'valid URL string');
    }

    const fetchOptions = {
      timeoutMs: options.timeoutMs || this.timeoutMs,
      headers: options.headers || {},
      disableRetry: options.disableRetry || false
    };

    // Add conditional headers for cache validation
    if (this.cache && this.cache.url === url) {
      if (this.cache.etag) {
        fetchOptions.headers['If-None-Match'] = this.cache.etag;
      }
      if (this.cache.lastModified) {
        fetchOptions.headers['If-Modified-Since'] = this.cache.lastModified;
      }
    }

    // Create the fetch operation
    const fetchOperation = async () => {
      const startTime = Date.now();
      this.stats.fetchAttempts++;

      try {
        const response = await this._performFetch(url, fetchOptions);
        const fetchTime = Date.now() - startTime;

        if (this.enableStats) {
          this.stats.totalFetchTimeMs += fetchTime;
          this.stats.averageFetchTimeMs = this.stats.totalFetchTimeMs / this.stats.fetchAttempts;
          this.stats.lastFetchTime = new Date();
        }

        return this._processFetchResponse(response, url);
      } catch (error) {
        this.stats.fetchFailures++;
        throw createNetworkError(error, { url, fetchTime: Date.now() - startTime });
      }
    };

    // Apply retry logic if enabled
    let protectedOperation = fetchOperation;
    if (this.enableRetry && !fetchOptions.disableRetry) {
      protectedOperation = () => withRetry(fetchOperation, {
        maxAttempts: this.maxRetries,
        baseDelayMs: this.retryDelayMs,
        backoffMultiplier: 2,
        jitterMs: 100
      });
    }

    // Apply circuit breaker if enabled
    if (this.enableCircuitBreaker) {
      const breakerName = `jwks-manager-${this._hashUrl(url)}`;
      protectedOperation = withCircuitBreaker(protectedOperation, breakerName, {
        failureThreshold: 5,
        recoveryTimeoutMs: 60000,
        monitoringPeriodMs: 60000
      });
    }

    return await protectedOperation();
  }

  /**
   * Get thumbprints of all keys in JWKS
   * @param {Object} jwks - JWKS object (optional, uses cached if not provided)
   * @returns {string[]} Array of key thumbprints
   */
  thumbprints(jwks = null) {
    const obj = jwks || (this.cache && this.cache.jwks);
    if (!obj || !Array.isArray(obj.keys)) return [];

    const thumbprints = [];
    for (const key of obj.keys) {
      try {
        const thumbprint = this._calculateThumbprint(key);
        if (thumbprint) thumbprints.push(thumbprint);
      } catch (error) {
        // Skip invalid keys
      }
    }
    return thumbprints;
  }

  /**
   * Validate JWKS structure
   * @param {Object} jwks - JWKS object to validate
   * @returns {Object} Validation result
   */
  validate(jwks) {
    const errors = [];
    const warnings = [];

    if (!jwks || typeof jwks !== 'object') {
      errors.push('JWKS must be an object');
      return { valid: false, errors, warnings };
    }

    if (!Array.isArray(jwks.keys)) {
      errors.push('JWKS must have a "keys" array');
      return { valid: false, errors, warnings };
    }

    if (jwks.keys.length === 0) {
      warnings.push('JWKS contains no keys');
    }

    // Validate individual keys
    for (let i = 0; i < jwks.keys.length; i++) {
      const key = jwks.keys[i];
      const keyErrors = this._validateKey(key, i);
      errors.push(...keyErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get cache statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits + this.stats.misses > 0
        ? this.stats.hits / (this.stats.hits + this.stats.misses)
        : 0,
      failureRate: this.stats.fetchAttempts > 0
        ? this.stats.fetchFailures / this.stats.fetchAttempts
        : 0,
      isCached: !!this.cache,
      cacheAge: this.cache ? Date.now() - this.cache.fetchedAt : null
    };
  }

  /**
   * Clear the cache
   */
  clearCache() {
    if (this.enableStats && this.cache) {
      this.stats.evictions++;
    }
    this.cache = null;
    if (this.enableStats) {
      this.stats.cacheSize = 0;
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Validate configuration options
   */
  _validateConfig() {
    if (this.ttlMs < 0) {
      throw createConfigurationError('ttlMs', this.ttlMs, 'non-negative number');
    }

    if (this.maxRetries < 0) {
      throw createConfigurationError('maxRetries', this.maxRetries, 'non-negative number');
    }

    if (this.retryDelayMs < 0) {
      throw createConfigurationError('retryDelayMs', this.retryDelayMs, 'non-negative number');
    }

    if (this.timeoutMs <= 0) {
      throw createConfigurationError('timeoutMs', this.timeoutMs, 'positive number');
    }
  }

  /**
   * Perform the actual HTTP fetch
   */
  async _performFetch(url, options) {
    const doFetch = this.fetcher || this._defaultFetcher;
    return await doFetch(url, options.headers, options.timeoutMs);
  }

  /**
   * Default HTTPS fetch implementation
   */
  _defaultFetcher(url, headers = {}, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        req.destroy();
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      const req = https.request(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'CertNode-SDK/2.0',
          ...headers
        }
      }, (res) => {
        clearTimeout(timeout);
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8')
          });
        });
      });

      req.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      req.end();
    });
  }

  /**
   * Process fetch response and update cache
   */
  _processFetchResponse(response, url) {
    // Handle 304 Not Modified
    if (response.status === 304 && this.cache && this.cache.url === url) {
      this.cache.fetchedAt = Date.now();
      return this.cache.jwks;
    }

    // Handle non-200 responses
    if (response.status !== 200) {
      throw new Error(`JWKS fetch failed: HTTP ${response.status}`);
    }

    // Parse JWKS JSON
    let jwks;
    try {
      jwks = JSON.parse(response.body);
    } catch (error) {
      throw new Error('Invalid JWKS JSON response');
    }

    // Validate JWKS structure
    const validation = this.validate(jwks);
    if (!validation.valid) {
      throw new Error(`Invalid JWKS structure: ${validation.errors.join(', ')}`);
    }

    // Update cache
    this.cache = {
      jwks,
      fetchedAt: Date.now(),
      etag: response.headers['etag'] || null,
      lastModified: response.headers['last-modified'] || null,
      url
    };

    if (this.enableStats) {
      this.stats.cacheSize = this._calculateCacheSize(jwks);
    }

    return jwks;
  }

  /**
   * Validate individual JWK
   */
  _validateKey(key, index) {
    const errors = [];

    if (!key || typeof key !== 'object') {
      errors.push(`Key ${index}: must be an object`);
      return errors;
    }

    if (!key.kty) {
      errors.push(`Key ${index}: missing "kty" parameter`);
    } else if (!['EC', 'OKP'].includes(key.kty)) {
      errors.push(`Key ${index}: unsupported key type "${key.kty}"`);
    }

    if (key.kty === 'EC') {
      if (key.crv !== 'P-256') {
        errors.push(`Key ${index}: unsupported curve "${key.crv}" for EC key`);
      }
      if (!key.x || !key.y) {
        errors.push(`Key ${index}: EC key missing x or y coordinates`);
      }
    }

    if (key.kty === 'OKP') {
      if (key.crv !== 'Ed25519') {
        errors.push(`Key ${index}: unsupported curve "${key.crv}" for OKP key`);
      }
      if (!key.x) {
        errors.push(`Key ${index}: OKP key missing x coordinate`);
      }
    }

    return errors;
  }

  /**
   * Calculate JWK thumbprint
   */
  _calculateThumbprint(jwk) {
    const crypto = require('crypto');

    if (jwk.kty === 'EC' && jwk.crv === 'P-256' && jwk.x && jwk.y) {
      const json = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
      return crypto.createHash('sha256').update(json, 'utf8').digest('base64url');
    }

    if (jwk.kty === 'OKP' && jwk.crv === 'Ed25519' && jwk.x) {
      const json = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x });
      return crypto.createHash('sha256').update(json, 'utf8').digest('base64url');
    }

    return null;
  }

  /**
   * Calculate cache size estimate
   */
  _calculateCacheSize(jwks) {
    return JSON.stringify(jwks).length;
  }

  /**
   * Hash URL for circuit breaker naming
   */
  _hashUrl(url) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(url).digest('hex').substring(0, 8);
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  EnhancedJWKSManager
};
const { createLogger } = require('../util/logger');

class RedisRateLimiter {
  constructor(options = {}) {
    this.logger = createLogger('rate-limiter');
    this.redis = options.redis || null;
    this.keyPrefix = options.keyPrefix || 'rl:';
    this.fallbackLimiter = options.fallbackLimiter || null;
    this.enabled = !!this.redis;

    // Default configuration
    this.config = {
      ip: {
        max: parseInt(process.env.RL_IP_MAX) || 120,
        windowMs: parseInt(process.env.RL_IP_WINDOW_MS) || 60000,
        blockDurationMs: parseInt(process.env.RL_IP_BLOCK_MS) || 300000 // 5 minutes
      },
      key: {
        max: parseInt(process.env.RL_KEY_MAX) || 1000,
        windowMs: parseInt(process.env.RL_KEY_WINDOW_MS) || 60000,
        blockDurationMs: parseInt(process.env.RL_KEY_BLOCK_MS) || 900000 // 15 minutes
      },
      global: {
        max: parseInt(process.env.RL_GLOBAL_MAX) || 10000,
        windowMs: parseInt(process.env.RL_GLOBAL_WINDOW_MS) || 60000,
        blockDurationMs: parseInt(process.env.RL_GLOBAL_BLOCK_MS) || 600000 // 10 minutes
      },
      ...options.config
    };

    // Abuse detection thresholds
    this.abuseThresholds = {
      suspicious: options.suspiciousThreshold || 5, // 5x normal rate
      malicious: options.maliciousThreshold || 10,  // 10x normal rate
      ...options.abuseThresholds
    };
  }

  // Get client IP with proper handling of proxy headers
  getClientIP(req) {
    // Check various headers in order of preference
    const headers = [
      'cf-connecting-ip',    // Cloudflare
      'x-real-ip',          // Nginx
      'x-forwarded-for',    // Standard proxy header
      'x-client-ip',        // Apache
      'x-forwarded',
      'forwarded-for',
      'forwarded'
    ];

    for (const header of headers) {
      const value = req.headers[header];
      if (value) {
        // Handle comma-separated IPs (take first one)
        const ip = value.split(',')[0].trim();
        if (this.isValidIP(ip)) {
          return ip;
        }
      }
    }

    // Fall back to connection remote address
    return req.socket?.remoteAddress ||
           req.connection?.remoteAddress ||
           '127.0.0.1';
  }

  // Validate IP address format
  isValidIP(ip) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  // Extract API key from Authorization header
  getApiKey(req) {
    const auth = req.headers.authorization;
    if (!auth) return null;

    const match = auth.match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : null;
  }

  // Generate Redis keys for different rate limit dimensions
  getRedisKeys(req) {
    const ip = this.getClientIP(req);
    const apiKey = this.getApiKey(req);
    const timestamp = Math.floor(Date.now() / 1000);

    return {
      ip: {
        count: `${this.keyPrefix}ip:${ip}:${Math.floor(timestamp / (this.config.ip.windowMs / 1000))}`,
        block: `${this.keyPrefix}ip:block:${ip}`,
        abuse: `${this.keyPrefix}ip:abuse:${ip}`
      },
      key: apiKey ? {
        count: `${this.keyPrefix}key:${apiKey}:${Math.floor(timestamp / (this.config.key.windowMs / 1000))}`,
        block: `${this.keyPrefix}key:block:${apiKey}`,
        abuse: `${this.keyPrefix}key:abuse:${apiKey}`
      } : null,
      global: {
        count: `${this.keyPrefix}global:${Math.floor(timestamp / (this.config.global.windowMs / 1000))}`,
        block: `${this.keyPrefix}global:block`
      }
    };
  }

  // Check if client is blocked
  async isBlocked(req) {
    if (!this.enabled) return false;

    try {
      const keys = this.getRedisKeys(req);
      const checks = [
        this.redis.get(keys.ip.block),
        keys.key ? this.redis.get(keys.key.block) : Promise.resolve(null),
        this.redis.get(keys.global.block)
      ];

      const results = await Promise.all(checks);
      return results.some(result => result !== null);
    } catch (error) {
      this.logger.error('Block check failed', { error: error.message });
      return false; // Fail open
    }
  }

  // Increment counters and check limits
  async checkLimits(req) {
    if (!this.enabled) {
      // Fall back to in-memory limiter if Redis unavailable
      if (this.fallbackLimiter) {
        return this.fallbackLimiter.allow(req);
      }
      return { ok: true, retryAfterMs: 0, remaining: 1000 };
    }

    try {
      const keys = this.getRedisKeys(req);
      const pipeline = this.redis.pipeline();

      // Increment counters
      pipeline.incr(keys.ip.count);
      pipeline.expire(keys.ip.count, Math.ceil(this.config.ip.windowMs / 1000));

      if (keys.key) {
        pipeline.incr(keys.key.count);
        pipeline.expire(keys.key.count, Math.ceil(this.config.key.windowMs / 1000));
      }

      pipeline.incr(keys.global.count);
      pipeline.expire(keys.global.count, Math.ceil(this.config.global.windowMs / 1000));

      const results = await pipeline.exec();
      const ipCount = results[0][1];
      const keyCount = keys.key ? results[2][1] : 0;
      const globalCount = keys.key ? results[4][1] : results[2][1];

      // Check limits
      const ipExceeded = ipCount > this.config.ip.max;
      const keyExceeded = keys.key && keyCount > this.config.key.max;
      const globalExceeded = globalCount > this.config.global.max;

      if (ipExceeded || keyExceeded || globalExceeded) {
        // Determine which limit was exceeded and set retry time
        let retryAfterMs = this.config.ip.windowMs;
        let dimension = 'ip';

        if (keyExceeded) {
          retryAfterMs = Math.max(retryAfterMs, this.config.key.windowMs);
          dimension = 'key';
        }
        if (globalExceeded) {
          retryAfterMs = Math.max(retryAfterMs, this.config.global.windowMs);
          dimension = 'global';
        }

        // Check for abuse patterns
        await this.checkAbusePatterns(req, { ipCount, keyCount, globalCount });

        this.logger.warn('Rate limit exceeded', {
          ip: this.getClientIP(req),
          apiKey: this.getApiKey(req),
          dimension,
          ipCount,
          keyCount,
          globalCount,
          request_id: req.id
        });

        return {
          ok: false,
          retryAfterMs,
          remaining: 0,
          dimension,
          counts: { ip: ipCount, key: keyCount, global: globalCount }
        };
      }

      return {
        ok: true,
        retryAfterMs: 0,
        remaining: Math.min(
          this.config.ip.max - ipCount,
          keys.key ? this.config.key.max - keyCount : Infinity,
          this.config.global.max - globalCount
        ),
        counts: { ip: ipCount, key: keyCount, global: globalCount }
      };

    } catch (error) {
      this.logger.error('Rate limit check failed', { error: error.message });

      // Fall back to in-memory limiter on Redis failure
      if (this.fallbackLimiter) {
        return this.fallbackLimiter.allow(req);
      }

      // Fail open - allow request but log the failure
      return { ok: true, retryAfterMs: 0, remaining: 1000, fallback: true };
    }
  }

  // Detect and handle abuse patterns
  async checkAbusePatterns(req, counts) {
    if (!this.enabled) return;

    try {
      const keys = this.getRedisKeys(req);
      const ip = this.getClientIP(req);
      const apiKey = this.getApiKey(req);

      // Check for suspicious activity (5x normal rate)
      const suspiciousIP = counts.ipCount > (this.config.ip.max * this.abuseThresholds.suspicious);
      const suspiciousKey = counts.keyCount > (this.config.key.max * this.abuseThresholds.suspicious);

      // Check for malicious activity (10x normal rate)
      const maliciousIP = counts.ipCount > (this.config.ip.max * this.abuseThresholds.malicious);
      const maliciousKey = counts.keyCount > (this.config.key.max * this.abuseThresholds.malicious);

      if (maliciousIP || maliciousKey) {
        // Block for extended period
        const blockDuration = maliciousIP ?
          this.config.ip.blockDurationMs :
          this.config.key.blockDurationMs;

        await this.redis.setex(
          maliciousIP ? keys.ip.block : keys.key.block,
          Math.ceil(blockDuration / 1000),
          '1'
        );

        this.logger.error('Malicious activity detected - blocking client', {
          ip,
          apiKey,
          type: maliciousIP ? 'ip' : 'key',
          counts,
          blockDurationMs: blockDuration
        });

        // Track abuse metrics
        await this.redis.incr(maliciousIP ? keys.ip.abuse : keys.key.abuse);
      } else if (suspiciousIP || suspiciousKey) {
        this.logger.warn('Suspicious activity detected', {
          ip,
          apiKey,
          type: suspiciousIP ? 'ip' : 'key',
          counts
        });

        // Track suspicious activity
        await this.redis.incr(suspiciousIP ? keys.ip.abuse : keys.key.abuse);
      }
    } catch (error) {
      this.logger.error('Abuse pattern check failed', { error: error.message });
    }
  }

  // Main rate limiting function
  async allow(req) {
    // First check if client is blocked
    if (await this.isBlocked(req)) {
      this.logger.warn('Blocked client attempted request', {
        ip: this.getClientIP(req),
        apiKey: this.getApiKey(req),
        request_id: req.id
      });

      return {
        ok: false,
        retryAfterMs: 300000, // 5 minutes default
        remaining: 0,
        blocked: true
      };
    }

    // Check rate limits
    return await this.checkLimits(req);
  }

  // Get rate limit status without consuming tokens
  async getStatus(req) {
    if (!this.enabled) return null;

    try {
      const keys = this.getRedisKeys(req);
      const counts = await Promise.all([
        this.redis.get(keys.ip.count) || 0,
        keys.key ? this.redis.get(keys.key.count) || 0 : 0,
        this.redis.get(keys.global.count) || 0
      ]);

      return {
        ip: { count: parseInt(counts[0]), limit: this.config.ip.max },
        key: keys.key ? { count: parseInt(counts[1]), limit: this.config.key.max } : null,
        global: { count: parseInt(counts[2]), limit: this.config.global.max }
      };
    } catch (error) {
      this.logger.error('Status check failed', { error: error.message });
      return null;
    }
  }
}

function createRedisRateLimiter(options = {}) {
  return new RedisRateLimiter(options);
}

module.exports = {
  RedisRateLimiter,
  createRedisRateLimiter
};
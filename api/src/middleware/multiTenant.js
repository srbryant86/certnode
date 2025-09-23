/**
 * Multi-Tenant Architecture Middleware
 * Provides tenant isolation, routing, and resource management for SaaS deployments
 */

const { createContextLogger } = require('./logging');

class MultiTenantManager {
  constructor(options = {}) {
    this.config = {
      tenantIdentification: options.tenantIdentification || 'subdomain', // 'subdomain', 'header', 'path'
      defaultTenant: options.defaultTenant || 'default',
      enableTenantCache: options.enableTenantCache !== false,
      cacheTimeout: options.cacheTimeout || 300000, // 5 minutes
      strictIsolation: options.strictIsolation !== false,
      ...options
    };

    this.tenantCache = new Map();
    this.tenantConfigs = new Map();
    this.resourceLimits = new Map();

    this.initializeDefaultTenant();
  }

  initializeDefaultTenant() {
    // Set up default tenant configuration
    this.tenantConfigs.set(this.config.defaultTenant, {
      id: this.config.defaultTenant,
      name: 'Default Tenant',
      status: 'active',
      features: ['basic_verification', 'api_access'],
      limits: {
        apiRequests: 1000,
        batchSize: 100,
        webhooks: 5,
        storage: '1GB'
      },
      settings: {
        branding: {
          logo: null,
          primaryColor: '#007bff',
          customDomain: null
        },
        security: {
          requireAuth: true,
          allowedOrigins: ['*'],
          rateLimitMultiplier: 1.0
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // Tenant Identification Middleware
  identifyTenant() {
    return async (req, res, next) => {
      const logger = createContextLogger(req.correlationId);

      try {
        let tenantId = null;

        switch (this.config.tenantIdentification) {
          case 'subdomain':
            tenantId = this.extractTenantFromSubdomain(req);
            break;
          case 'header':
            tenantId = this.extractTenantFromHeader(req);
            break;
          case 'path':
            tenantId = this.extractTenantFromPath(req);
            break;
          case 'custom':
            tenantId = await this.extractTenantCustom(req);
            break;
          default:
            tenantId = this.config.defaultTenant;
        }

        if (!tenantId) {
          tenantId = this.config.defaultTenant;
        }

        // Get tenant configuration
        const tenant = await this.getTenantConfig(tenantId);

        if (!tenant || tenant.status !== 'active') {
          return res.status(404).json({
            error: 'Tenant not found or inactive',
            tenantId,
            timestamp: new Date().toISOString()
          });
        }

        // Attach tenant information to request
        req.tenant = tenant;
        req.tenantId = tenantId;

        // Set tenant context in logger
        req.logger = createContextLogger(req.correlationId, {
          tenantId: tenantId,
          tenantName: tenant.name
        });

        logger.debug('Tenant identified', {
          tenantId,
          tenantName: tenant.name,
          identification: this.config.tenantIdentification
        });

        next();

      } catch (error) {
        logger.error('Tenant identification failed', {
          error: error.message,
          stack: error.stack
        });

        res.status(500).json({
          error: 'Tenant identification failed',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  extractTenantFromSubdomain(req) {
    const host = req.get('host') || req.get('x-forwarded-host');
    if (!host) return null;

    const subdomain = host.split('.')[0];

    // Skip common subdomains
    if (['www', 'api', 'app', 'admin'].includes(subdomain)) {
      return null;
    }

    return subdomain;
  }

  extractTenantFromHeader(req) {
    return req.get('x-tenant-id') ||
           req.get('x-tenant') ||
           req.get('tenant-id');
  }

  extractTenantFromPath(req) {
    // Extract from path like /tenant/{tenantId}/api/...
    const pathParts = req.path.split('/');
    if (pathParts[1] === 'tenant' && pathParts[2]) {
      return pathParts[2];
    }
    return null;
  }

  async extractTenantCustom(req) {
    // Custom tenant identification logic
    // Can be overridden by specific implementations
    return null;
  }

  // Tenant Configuration Management
  async getTenantConfig(tenantId) {
    // Check cache first
    if (this.config.enableTenantCache && this.tenantCache.has(tenantId)) {
      const cached = this.tenantCache.get(tenantId);
      if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.config;
      }
    }

    // Check in-memory store
    if (this.tenantConfigs.has(tenantId)) {
      const config = this.tenantConfigs.get(tenantId);

      if (this.config.enableTenantCache) {
        this.tenantCache.set(tenantId, {
          config,
          timestamp: Date.now()
        });
      }

      return config;
    }

    // TODO: Fetch from database
    // const tenant = await this.fetchTenantFromDatabase(tenantId);

    return null;
  }

  async createTenant(tenantData) {
    const tenant = {
      id: tenantData.id || this.generateTenantId(),
      name: tenantData.name,
      status: tenantData.status || 'active',
      features: tenantData.features || ['basic_verification'],
      limits: {
        apiRequests: tenantData.limits?.apiRequests || 1000,
        batchSize: tenantData.limits?.batchSize || 100,
        webhooks: tenantData.limits?.webhooks || 5,
        storage: tenantData.limits?.storage || '1GB'
      },
      settings: {
        branding: {
          logo: tenantData.branding?.logo || null,
          primaryColor: tenantData.branding?.primaryColor || '#007bff',
          customDomain: tenantData.branding?.customDomain || null
        },
        security: {
          requireAuth: tenantData.security?.requireAuth !== false,
          allowedOrigins: tenantData.security?.allowedOrigins || ['*'],
          rateLimitMultiplier: tenantData.security?.rateLimitMultiplier || 1.0
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store tenant configuration
    this.tenantConfigs.set(tenant.id, tenant);

    // Initialize resource tracking
    this.initializeTenantResources(tenant.id);

    return tenant;
  }

  async updateTenant(tenantId, updates) {
    const existingTenant = await this.getTenantConfig(tenantId);
    if (!existingTenant) {
      throw new Error('Tenant not found');
    }

    const updatedTenant = {
      ...existingTenant,
      ...updates,
      id: tenantId, // Prevent ID changes
      updatedAt: new Date().toISOString()
    };

    // Store updated configuration
    this.tenantConfigs.set(tenantId, updatedTenant);

    // Clear cache
    if (this.config.enableTenantCache) {
      this.tenantCache.delete(tenantId);
    }

    return updatedTenant;
  }

  async deleteTenant(tenantId) {
    if (tenantId === this.config.defaultTenant) {
      throw new Error('Cannot delete default tenant');
    }

    // Remove tenant configuration
    this.tenantConfigs.delete(tenantId);

    // Clear cache
    if (this.config.enableTenantCache) {
      this.tenantCache.delete(tenantId);
    }

    // Clean up resources
    this.resourceLimits.delete(tenantId);

    return { deleted: true, tenantId };
  }

  // Resource Management and Limits
  initializeTenantResources(tenantId) {
    this.resourceLimits.set(tenantId, {
      apiRequests: {
        current: 0,
        limit: 0,
        resetTime: Date.now() + 3600000 // 1 hour
      },
      batchJobs: {
        current: 0,
        limit: 0
      },
      webhooks: {
        current: 0,
        limit: 0
      },
      storage: {
        current: 0,
        limit: 0
      }
    });
  }

  enforceResourceLimits() {
    return async (req, res, next) => {
      if (!req.tenant) {
        return next();
      }

      const logger = req.logger || createContextLogger(req.correlationId);
      const tenantId = req.tenantId;

      try {
        // Check API request limits
        if (!(await this.checkApiRequestLimit(tenantId))) {
          return res.status(429).json({
            error: 'API request limit exceeded',
            limit: req.tenant.limits.apiRequests,
            resetTime: this.getResetTime(tenantId, 'apiRequests'),
            timestamp: new Date().toISOString()
          });
        }

        // Increment API request counter
        await this.incrementResourceUsage(tenantId, 'apiRequests');

        next();

      } catch (error) {
        logger.error('Resource limit enforcement failed', {
          error: error.message,
          tenantId
        });
        next(); // Continue on error to avoid blocking legitimate requests
      }
    };
  }

  async checkApiRequestLimit(tenantId) {
    const resources = this.resourceLimits.get(tenantId);
    if (!resources) return true;

    const apiRequests = resources.apiRequests;

    // Reset counter if time window has passed
    if (Date.now() > apiRequests.resetTime) {
      apiRequests.current = 0;
      apiRequests.resetTime = Date.now() + 3600000; // 1 hour
    }

    const tenant = await this.getTenantConfig(tenantId);
    return apiRequests.current < tenant.limits.apiRequests;
  }

  async incrementResourceUsage(tenantId, resourceType) {
    const resources = this.resourceLimits.get(tenantId);
    if (!resources || !resources[resourceType]) return;

    resources[resourceType].current++;
  }

  getResetTime(tenantId, resourceType) {
    const resources = this.resourceLimits.get(tenantId);
    if (!resources || !resources[resourceType]) return null;

    return new Date(resources[resourceType].resetTime).toISOString();
  }

  // Database Connection Management (Multi-tenant)
  getTenantDatabase() {
    return (req, res, next) => {
      if (!req.tenant) {
        return next();
      }

      // In a real implementation, you might:
      // 1. Use tenant-specific database connections
      // 2. Use schema-based isolation
      // 3. Use table prefixes
      // 4. Use separate databases per tenant

      // For now, we'll add tenant context to queries
      req.dbContext = {
        tenantId: req.tenantId,
        isolationMode: this.config.strictIsolation ? 'strict' : 'soft'
      };

      next();
    };
  }

  // Security and Access Control
  enforceDataIsolation() {
    return (req, res, next) => {
      if (!req.tenant || !this.config.strictIsolation) {
        return next();
      }

      // Add tenant filter to all database queries
      const originalQuery = req.query;
      req.query = {
        ...originalQuery,
        tenantId: req.tenantId
      };

      // Override JSON response to ensure tenant isolation
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Filter out data that doesn't belong to this tenant
        const filteredData = this.filterTenantData(data, req.tenantId);
        return originalJson(filteredData);
      };

      next();
    };
  }

  filterTenantData(data, tenantId) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.filter(item =>
        !item.tenantId || item.tenantId === tenantId
      );
    }

    if (data.tenantId && data.tenantId !== tenantId) {
      return null;
    }

    return data;
  }

  // Tenant-aware Routing
  createTenantRouter() {
    return (req, res, next) => {
      if (!req.tenant) {
        return next();
      }

      // Modify request path for tenant-specific routing
      if (this.config.tenantIdentification === 'path') {
        // Remove tenant prefix from path
        req.url = req.url.replace(`/tenant/${req.tenantId}`, '');
        req.path = req.path.replace(`/tenant/${req.tenantId}`, '');
      }

      // Add tenant-specific middleware based on features
      this.applyTenantFeatures(req, res, next);
    };
  }

  applyTenantFeatures(req, res, next) {
    const tenant = req.tenant;

    // Apply feature-specific middleware
    if (tenant.features.includes('advanced_analytics')) {
      req.analyticsEnabled = true;
    }

    if (tenant.features.includes('premium_support')) {
      req.prioritySupport = true;
    }

    if (tenant.features.includes('custom_branding')) {
      req.customBranding = tenant.settings.branding;
    }

    next();
  }

  // Tenant Metrics and Analytics
  collectTenantMetrics() {
    return (req, res, next) => {
      if (!req.tenant) {
        return next();
      }

      const startTime = Date.now();

      // Override response.end to collect metrics
      const originalEnd = res.end.bind(res);
      res.end = (...args) => {
        const duration = Date.now() - startTime;

        // Collect metrics asynchronously
        setImmediate(() => {
          this.recordTenantMetric(req.tenantId, {
            endpoint: req.path,
            method: req.method,
            statusCode: res.statusCode,
            duration,
            timestamp: new Date().toISOString()
          });
        });

        return originalEnd(...args);
      };

      next();
    };
  }

  recordTenantMetric(tenantId, metric) {
    // In a real implementation, this would store metrics in a database
    // or send to a metrics collection system
    console.log(`Tenant metric [${tenantId}]:`, metric);
  }

  // Utility Methods
  generateTenantId() {
    return 'tenant_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Error Handling
  handleTenantError() {
    return (error, req, res, next) => {
      const logger = req.logger || createContextLogger(req.correlationId);

      if (error.name === 'TenantNotFoundError') {
        return res.status(404).json({
          error: 'Tenant not found',
          tenantId: req.tenantId,
          timestamp: new Date().toISOString()
        });
      }

      if (error.name === 'TenantAccessDeniedError') {
        return res.status(403).json({
          error: 'Access denied for tenant',
          tenantId: req.tenantId,
          timestamp: new Date().toISOString()
        });
      }

      if (error.name === 'TenantLimitExceededError') {
        return res.status(429).json({
          error: 'Tenant limit exceeded',
          limit: error.limit,
          current: error.current,
          timestamp: new Date().toISOString()
        });
      }

      // Log tenant-specific errors
      logger.error('Tenant-specific error occurred', {
        error: error.message,
        tenantId: req.tenantId,
        stack: error.stack
      });

      next(error);
    };
  }

  // Health Check
  async healthCheck() {
    const tenantCount = this.tenantConfigs.size;
    const activeTenants = Array.from(this.tenantConfigs.values())
      .filter(tenant => tenant.status === 'active').length;

    return {
      status: 'healthy',
      tenants: {
        total: tenantCount,
        active: activeTenants,
        cached: this.tenantCache.size
      },
      configuration: {
        identification: this.config.tenantIdentification,
        strictIsolation: this.config.strictIsolation,
        cacheEnabled: this.config.enableTenantCache
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Error Classes
class TenantNotFoundError extends Error {
  constructor(tenantId) {
    super(`Tenant not found: ${tenantId}`);
    this.name = 'TenantNotFoundError';
    this.tenantId = tenantId;
  }
}

class TenantAccessDeniedError extends Error {
  constructor(tenantId, reason) {
    super(`Access denied for tenant ${tenantId}: ${reason}`);
    this.name = 'TenantAccessDeniedError';
    this.tenantId = tenantId;
    this.reason = reason;
  }
}

class TenantLimitExceededError extends Error {
  constructor(tenantId, limit, current) {
    super(`Tenant limit exceeded for ${tenantId}: ${current}/${limit}`);
    this.name = 'TenantLimitExceededError';
    this.tenantId = tenantId;
    this.limit = limit;
    this.current = current;
  }
}

module.exports = {
  MultiTenantManager,
  TenantNotFoundError,
  TenantAccessDeniedError,
  TenantLimitExceededError
};
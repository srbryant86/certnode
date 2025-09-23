/**
 * Multi-Tenant Management API Routes
 * RESTful endpoints for tenant administration and configuration
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const { MultiTenantManager } = require('../middleware/multiTenant');
const { createContextLogger } = require('../middleware/logging');

// Initialize multi-tenant manager
const tenantManager = new MultiTenantManager({
  tenantIdentification: process.env.TENANT_IDENTIFICATION || 'subdomain',
  strictIsolation: process.env.TENANT_STRICT_ISOLATION === 'true',
  enableTenantCache: process.env.TENANT_CACHE_ENABLED !== 'false'
});

// Rate limiting for tenant operations
const tenantRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: {
    error: 'Too many tenant management requests',
    retryAfter: '15 minutes'
  }
});

// Validation schemas
const createTenantValidation = [
  body('name')
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tenant name must be 2-100 characters'),
  body('id')
    .optional()
    .isString()
    .matches(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
    .withMessage('Tenant ID must be lowercase alphanumeric with hyphens'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('limits.apiRequests')
    .optional()
    .isInt({ min: 100, max: 1000000 })
    .withMessage('API request limit must be between 100 and 1,000,000'),
  body('limits.batchSize')
    .optional()
    .isInt({ min: 10, max: 10000 })
    .withMessage('Batch size limit must be between 10 and 10,000'),
  body('limits.webhooks')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Webhook limit must be between 1 and 100'),
  body('branding.primaryColor')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Primary color must be a valid hex color'),
  body('branding.customDomain')
    .optional()
    .isFQDN()
    .withMessage('Custom domain must be a valid FQDN'),
  body('security.allowedOrigins')
    .optional()
    .isArray()
    .withMessage('Allowed origins must be an array'),
  body('security.rateLimitMultiplier')
    .optional()
    .isFloat({ min: 0.1, max: 10.0 })
    .withMessage('Rate limit multiplier must be between 0.1 and 10.0')
];

const updateTenantValidation = [
  param('tenantId')
    .isString()
    .notEmpty()
    .withMessage('Tenant ID is required'),
  body('name')
    .optional()
    .isString()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tenant name must be 2-100 characters'),
  body('status')
    .optional()
    .isIn(['active', 'suspended', 'inactive'])
    .withMessage('Status must be active, suspended, or inactive')
];

const tenantParamValidation = [
  param('tenantId')
    .isString()
    .notEmpty()
    .withMessage('Tenant ID is required')
];

// Middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

const requireAdminAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Admin API key must be provided'
    });
  }

  // TODO: Implement actual admin API key validation
  req.admin = {
    id: 'admin_123',
    role: 'admin',
    permissions: ['tenant.create', 'tenant.read', 'tenant.update', 'tenant.delete']
  };

  next();
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin || !req.admin.permissions.includes(permission)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permission,
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
};

/**
 * POST /api/v1/admin/tenants
 * Create a new tenant
 */
router.post('/',
  tenantRateLimit,
  requireAdminAuth,
  requirePermission('tenant.create'),
  createTenantValidation,
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const tenantData = req.body;

      logger.info('Creating new tenant', {
        tenantName: tenantData.name,
        requestedId: tenantData.id,
        adminId: req.admin.id
      });

      const tenant = await tenantManager.createTenant(tenantData);

      logger.info('Tenant created successfully', {
        tenantId: tenant.id,
        tenantName: tenant.name
      });

      res.status(201).json({
        tenant,
        message: 'Tenant created successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to create tenant', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        error: 'Failed to create tenant',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/v1/admin/tenants
 * List all tenants
 */
router.get('/',
  requireAdminAuth,
  requirePermission('tenant.read'),
  query('status').optional().isIn(['active', 'suspended', 'inactive']),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('offset').optional().isInt({ min: 0 }),
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const filters = {
        status: req.query.status
      };

      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      logger.debug('Listing tenants', { filters, limit, offset });

      // Get all tenants (in a real implementation, this would query the database)
      const allTenants = Array.from(tenantManager.tenantConfigs.values());

      // Apply filters
      let filteredTenants = allTenants;
      if (filters.status) {
        filteredTenants = filteredTenants.filter(tenant => tenant.status === filters.status);
      }

      // Apply pagination
      const total = filteredTenants.length;
      const tenants = filteredTenants.slice(offset, offset + limit);

      res.json({
        tenants,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to list tenants', {
        error: error.message
      });

      res.status(500).json({
        error: 'Failed to list tenants',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/v1/admin/tenants/:tenantId
 * Get a specific tenant
 */
router.get('/:tenantId',
  requireAdminAuth,
  requirePermission('tenant.read'),
  tenantParamValidation,
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { tenantId } = req.params;

      logger.debug('Getting tenant details', { tenantId });

      const tenant = await tenantManager.getTenantConfig(tenantId);

      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found',
          tenantId,
          timestamp: new Date().toISOString()
        });
      }

      // Get tenant metrics
      const metrics = tenantManager.resourceLimits.get(tenantId);

      res.json({
        tenant,
        metrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to get tenant details', {
        error: error.message,
        tenantId: req.params.tenantId
      });

      res.status(500).json({
        error: 'Failed to get tenant details',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * PUT /api/v1/admin/tenants/:tenantId
 * Update a tenant
 */
router.put('/:tenantId',
  tenantRateLimit,
  requireAdminAuth,
  requirePermission('tenant.update'),
  updateTenantValidation,
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { tenantId } = req.params;
      const updates = req.body;

      logger.info('Updating tenant', {
        tenantId,
        updates: Object.keys(updates),
        adminId: req.admin.id
      });

      const updatedTenant = await tenantManager.updateTenant(tenantId, updates);

      logger.info('Tenant updated successfully', { tenantId });

      res.json({
        tenant: updatedTenant,
        message: 'Tenant updated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to update tenant', {
        error: error.message,
        tenantId: req.params.tenantId
      });

      if (error.message === 'Tenant not found') {
        return res.status(404).json({
          error: 'Tenant not found',
          tenantId: req.params.tenantId,
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        error: 'Failed to update tenant',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * DELETE /api/v1/admin/tenants/:tenantId
 * Delete a tenant
 */
router.delete('/:tenantId',
  requireAdminAuth,
  requirePermission('tenant.delete'),
  tenantParamValidation,
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { tenantId } = req.params;

      logger.info('Deleting tenant', {
        tenantId,
        adminId: req.admin.id
      });

      await tenantManager.deleteTenant(tenantId);

      logger.info('Tenant deleted successfully', { tenantId });

      res.json({
        message: 'Tenant deleted successfully',
        tenantId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to delete tenant', {
        error: error.message,
        tenantId: req.params.tenantId
      });

      if (error.message === 'Tenant not found') {
        return res.status(404).json({
          error: 'Tenant not found',
          tenantId: req.params.tenantId,
          timestamp: new Date().toISOString()
        });
      }

      if (error.message === 'Cannot delete default tenant') {
        return res.status(400).json({
          error: 'Cannot delete default tenant',
          tenantId: req.params.tenantId,
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        error: 'Failed to delete tenant',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/v1/admin/tenants/:tenantId/metrics
 * Get tenant usage metrics
 */
router.get('/:tenantId/metrics',
  requireAdminAuth,
  requirePermission('tenant.read'),
  tenantParamValidation,
  query('period').optional().isIn(['hour', 'day', 'week', 'month']),
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { tenantId } = req.params;
      const period = req.query.period || 'day';

      logger.debug('Getting tenant metrics', { tenantId, period });

      const tenant = await tenantManager.getTenantConfig(tenantId);
      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found',
          tenantId,
          timestamp: new Date().toISOString()
        });
      }

      const metrics = tenantManager.resourceLimits.get(tenantId);

      // In a real implementation, this would query historical metrics from a database
      const historicalMetrics = {
        period,
        apiRequests: {
          current: metrics?.apiRequests?.current || 0,
          limit: tenant.limits.apiRequests,
          history: [] // Would contain time-series data
        },
        batchJobs: {
          current: metrics?.batchJobs?.current || 0,
          limit: tenant.limits.batchSize,
          history: []
        },
        webhooks: {
          current: metrics?.webhooks?.current || 0,
          limit: tenant.limits.webhooks,
          history: []
        },
        storage: {
          current: metrics?.storage?.current || 0,
          limit: tenant.limits.storage,
          history: []
        }
      };

      res.json({
        tenantId,
        metrics: historicalMetrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to get tenant metrics', {
        error: error.message,
        tenantId: req.params.tenantId
      });

      res.status(500).json({
        error: 'Failed to get tenant metrics',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /api/v1/admin/tenants/:tenantId/reset-limits
 * Reset tenant usage limits
 */
router.post('/:tenantId/reset-limits',
  tenantRateLimit,
  requireAdminAuth,
  requirePermission('tenant.update'),
  tenantParamValidation,
  body('resourceType').optional().isIn(['apiRequests', 'batchJobs', 'webhooks', 'storage']),
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { tenantId } = req.params;
      const { resourceType } = req.body;

      logger.info('Resetting tenant limits', {
        tenantId,
        resourceType: resourceType || 'all',
        adminId: req.admin.id
      });

      const tenant = await tenantManager.getTenantConfig(tenantId);
      if (!tenant) {
        return res.status(404).json({
          error: 'Tenant not found',
          tenantId,
          timestamp: new Date().toISOString()
        });
      }

      const resources = tenantManager.resourceLimits.get(tenantId);
      if (!resources) {
        tenantManager.initializeTenantResources(tenantId);
      } else {
        if (resourceType) {
          // Reset specific resource
          if (resources[resourceType]) {
            resources[resourceType].current = 0;
            if (resourceType === 'apiRequests') {
              resources[resourceType].resetTime = Date.now() + 3600000; // 1 hour
            }
          }
        } else {
          // Reset all resources
          Object.keys(resources).forEach(key => {
            resources[key].current = 0;
            if (key === 'apiRequests') {
              resources[key].resetTime = Date.now() + 3600000;
            }
          });
        }
      }

      logger.info('Tenant limits reset successfully', { tenantId, resourceType });

      res.json({
        message: 'Tenant limits reset successfully',
        tenantId,
        resourceType: resourceType || 'all',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to reset tenant limits', {
        error: error.message,
        tenantId: req.params.tenantId
      });

      res.status(500).json({
        error: 'Failed to reset tenant limits',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/v1/admin/tenants/health
 * Multi-tenant system health check
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await tenantManager.healthCheck();

    const healthy = healthStatus.tenants.active > 0;

    res.status(healthy ? 200 : 503).json(healthStatus);

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/v1/admin/tenants/stats
 * System-wide tenant statistics
 */
router.get('/stats',
  requireAdminAuth,
  requirePermission('tenant.read'),
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const allTenants = Array.from(tenantManager.tenantConfigs.values());

      const stats = {
        total: allTenants.length,
        byStatus: {
          active: allTenants.filter(t => t.status === 'active').length,
          suspended: allTenants.filter(t => t.status === 'suspended').length,
          inactive: allTenants.filter(t => t.status === 'inactive').length
        },
        features: {},
        limits: {
          avg: {},
          max: {},
          min: {}
        },
        cache: {
          size: tenantManager.tenantCache.size,
          enabled: tenantManager.config.enableTenantCache
        },
        configuration: {
          identification: tenantManager.config.tenantIdentification,
          strictIsolation: tenantManager.config.strictIsolation
        },
        timestamp: new Date().toISOString()
      };

      // Calculate feature usage
      allTenants.forEach(tenant => {
        tenant.features.forEach(feature => {
          stats.features[feature] = (stats.features[feature] || 0) + 1;
        });
      });

      // Calculate limit statistics
      const limitKeys = ['apiRequests', 'batchSize', 'webhooks'];
      limitKeys.forEach(key => {
        const values = allTenants.map(t => t.limits[key]).filter(v => v !== undefined);
        if (values.length > 0) {
          stats.limits.avg[key] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
          stats.limits.max[key] = Math.max(...values);
          stats.limits.min[key] = Math.min(...values);
        }
      });

      res.json(stats);

    } catch (error) {
      logger.error('Failed to get tenant stats', {
        error: error.message
      });

      res.status(500).json({
        error: 'Failed to get tenant stats',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

module.exports = router;
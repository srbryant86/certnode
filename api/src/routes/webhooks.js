/**
 * Enterprise Webhook Management API Routes
 * RESTful endpoints for webhook subscription management and event delivery
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const WebhookManager = require('../services/webhookManager');
const { createContextLogger } = require('../middleware/logging');

// Initialize webhook manager
const webhookManager = new WebhookManager({
  maxRetries: process.env.WEBHOOK_MAX_RETRIES || 5,
  timeout: process.env.WEBHOOK_TIMEOUT || 30000,
  concurrency: process.env.WEBHOOK_CONCURRENCY || 5
});

// Rate limiting for webhook operations
const webhookRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many webhook requests',
    retryAfter: '15 minutes'
  }
});

// Validation schemas
const createSubscriptionValidation = [
  body('url')
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Valid URL is required'),
  body('events')
    .optional()
    .isArray()
    .withMessage('Events must be an array'),
  body('events.*')
    .optional()
    .isString()
    .withMessage('Event names must be strings'),
  body('secret')
    .optional()
    .isLength({ min: 16 })
    .withMessage('Secret must be at least 16 characters'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object'),
  body('headers')
    .optional()
    .isObject()
    .withMessage('Headers must be an object'),
  body('retryPolicy.maxRetries')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Max retries must be between 0 and 10'),
  body('retryPolicy.retryDelay')
    .optional()
    .isInt({ min: 1000, max: 300000 })
    .withMessage('Retry delay must be between 1000ms and 300000ms')
];

const updateSubscriptionValidation = [
  param('subscriptionId')
    .isUUID()
    .withMessage('Invalid subscription ID'),
  body('url')
    .optional()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Valid URL is required'),
  body('events')
    .optional()
    .isArray()
    .withMessage('Events must be an array'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean')
];

const subscriptionParamValidation = [
  param('subscriptionId')
    .isUUID()
    .withMessage('Invalid subscription ID')
];

const eventPublishValidation = [
  body('type')
    .isString()
    .notEmpty()
    .withMessage('Event type is required'),
  body('data')
    .notEmpty()
    .withMessage('Event data is required'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
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

const requireAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'API key must be provided'
    });
  }

  // TODO: Implement actual API key validation
  req.user = {
    id: 'user_123',
    tenantId: 'tenant_456',
    tier: 'enterprise'
  };

  next();
};

/**
 * POST /api/v1/webhooks/subscriptions
 * Create a new webhook subscription
 */
router.post('/subscriptions',
  webhookRateLimit,
  requireAuth,
  createSubscriptionValidation,
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const subscriptionConfig = {
        ...req.body,
        userId: req.user.id,
        tenantId: req.user.tenantId
      };

      logger.info('Creating webhook subscription', {
        url: subscriptionConfig.url,
        events: subscriptionConfig.events,
        userId: req.user.id
      });

      const subscription = await webhookManager.createSubscription(subscriptionConfig);

      logger.info('Webhook subscription created', {
        subscriptionId: subscription.id,
        url: subscription.url
      });

      res.status(201).json({
        subscription,
        message: 'Webhook subscription created successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to create webhook subscription', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        error: 'Failed to create webhook subscription',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/v1/webhooks/subscriptions
 * List webhook subscriptions
 */
router.get('/subscriptions',
  requireAuth,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const filters = {
        userId: req.user.id,
        tenantId: req.user.tenantId,
        active: req.query.active ? req.query.active === 'true' : undefined,
        event: req.query.event
      };

      logger.debug('Listing webhook subscriptions', { filters });

      const subscriptions = await webhookManager.listSubscriptions(filters);

      res.json({
        subscriptions,
        count: subscriptions.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to list webhook subscriptions', {
        error: error.message
      });

      res.status(500).json({
        error: 'Failed to list webhook subscriptions',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/v1/webhooks/subscriptions/:subscriptionId
 * Get a specific webhook subscription
 */
router.get('/subscriptions/:subscriptionId',
  requireAuth,
  subscriptionParamValidation,
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { subscriptionId } = req.params;

      logger.debug('Getting webhook subscription', { subscriptionId });

      const subscription = await webhookManager.getSubscription(subscriptionId);

      if (!subscription) {
        return res.status(404).json({
          error: 'Subscription not found',
          subscriptionId,
          timestamp: new Date().toISOString()
        });
      }

      // Check ownership
      if (subscription.userId !== req.user.id && subscription.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have access to this subscription',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        subscription,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to get webhook subscription', {
        error: error.message,
        subscriptionId: req.params.subscriptionId
      });

      res.status(500).json({
        error: 'Failed to get webhook subscription',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * PUT /api/v1/webhooks/subscriptions/:subscriptionId
 * Update a webhook subscription
 */
router.put('/subscriptions/:subscriptionId',
  webhookRateLimit,
  requireAuth,
  updateSubscriptionValidation,
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { subscriptionId } = req.params;

      logger.info('Updating webhook subscription', {
        subscriptionId,
        updates: Object.keys(req.body)
      });

      // Check ownership first
      const existingSubscription = await webhookManager.getSubscription(subscriptionId);
      if (!existingSubscription) {
        return res.status(404).json({
          error: 'Subscription not found',
          subscriptionId,
          timestamp: new Date().toISOString()
        });
      }

      if (existingSubscription.userId !== req.user.id && existingSubscription.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Access denied',
          timestamp: new Date().toISOString()
        });
      }

      const updatedSubscription = await webhookManager.updateSubscription(subscriptionId, req.body);

      logger.info('Webhook subscription updated', { subscriptionId });

      res.json({
        subscription: updatedSubscription,
        message: 'Webhook subscription updated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to update webhook subscription', {
        error: error.message,
        subscriptionId: req.params.subscriptionId
      });

      res.status(500).json({
        error: 'Failed to update webhook subscription',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * DELETE /api/v1/webhooks/subscriptions/:subscriptionId
 * Delete a webhook subscription
 */
router.delete('/subscriptions/:subscriptionId',
  requireAuth,
  subscriptionParamValidation,
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { subscriptionId } = req.params;

      logger.info('Deleting webhook subscription', { subscriptionId });

      // Check ownership first
      const existingSubscription = await webhookManager.getSubscription(subscriptionId);
      if (!existingSubscription) {
        return res.status(404).json({
          error: 'Subscription not found',
          subscriptionId,
          timestamp: new Date().toISOString()
        });
      }

      if (existingSubscription.userId !== req.user.id && existingSubscription.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Access denied',
          timestamp: new Date().toISOString()
        });
      }

      await webhookManager.deleteSubscription(subscriptionId);

      logger.info('Webhook subscription deleted', { subscriptionId });

      res.json({
        message: 'Webhook subscription deleted successfully',
        subscriptionId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to delete webhook subscription', {
        error: error.message,
        subscriptionId: req.params.subscriptionId
      });

      res.status(500).json({
        error: 'Failed to delete webhook subscription',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /api/v1/webhooks/subscriptions/:subscriptionId/test
 * Test a webhook subscription
 */
router.post('/subscriptions/:subscriptionId/test',
  webhookRateLimit,
  requireAuth,
  subscriptionParamValidation,
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { subscriptionId } = req.params;
      const eventType = req.body.eventType || 'test.event';

      logger.info('Testing webhook subscription', { subscriptionId, eventType });

      // Check ownership first
      const subscription = await webhookManager.getSubscription(subscriptionId);
      if (!subscription) {
        return res.status(404).json({
          error: 'Subscription not found',
          subscriptionId,
          timestamp: new Date().toISOString()
        });
      }

      if (subscription.userId !== req.user.id && subscription.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Access denied',
          timestamp: new Date().toISOString()
        });
      }

      const testResult = await webhookManager.testWebhook(subscriptionId, eventType);

      logger.info('Webhook test initiated', {
        subscriptionId,
        testId: testResult.testId
      });

      res.json({
        ...testResult,
        message: 'Webhook test initiated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to test webhook subscription', {
        error: error.message,
        subscriptionId: req.params.subscriptionId
      });

      res.status(500).json({
        error: 'Failed to test webhook subscription',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/v1/webhooks/subscriptions/:subscriptionId/deliveries
 * Get delivery history for a subscription
 */
router.get('/subscriptions/:subscriptionId/deliveries',
  requireAuth,
  subscriptionParamValidation,
  query('status').optional().isIn(['success', 'failed']),
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('offset').optional().isInt({ min: 0 }),
  query('since').optional().isISO8601(),
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { subscriptionId } = req.params;

      logger.debug('Getting delivery history', { subscriptionId });

      // Check ownership first
      const subscription = await webhookManager.getSubscription(subscriptionId);
      if (!subscription) {
        return res.status(404).json({
          error: 'Subscription not found',
          subscriptionId,
          timestamp: new Date().toISOString()
        });
      }

      if (subscription.userId !== req.user.id && subscription.tenantId !== req.user.tenantId) {
        return res.status(403).json({
          error: 'Access denied',
          timestamp: new Date().toISOString()
        });
      }

      const options = {
        status: req.query.status,
        limit: parseInt(req.query.limit) || 100,
        offset: parseInt(req.query.offset) || 0,
        since: req.query.since
      };

      const history = await webhookManager.getDeliveryHistory(subscriptionId, options);

      res.json({
        subscriptionId,
        ...history,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to get delivery history', {
        error: error.message,
        subscriptionId: req.params.subscriptionId
      });

      res.status(500).json({
        error: 'Failed to get delivery history',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /api/v1/webhooks/events/publish
 * Publish an event to webhooks (internal API)
 */
router.post('/events/publish',
  webhookRateLimit,
  requireAuth, // Could be admin/system auth
  eventPublishValidation,
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { type, data, metadata = {} } = req.body;

      logger.info('Publishing webhook event', {
        eventType: type,
        dataSize: JSON.stringify(data).length
      });

      const result = await webhookManager.publishEvent(type, data, {
        ...metadata,
        userId: req.user.id,
        tenantId: req.user.tenantId,
        correlationId: req.correlationId
      });

      logger.info('Webhook event published', {
        eventId: result.eventId,
        subscriptions: result.subscriptions,
        queued: result.queued
      });

      res.json({
        ...result,
        message: 'Event published successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Failed to publish webhook event', {
        error: error.message,
        eventType: req.body.type
      });

      res.status(500).json({
        error: 'Failed to publish webhook event',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/v1/webhooks/events/types
 * Get supported event types
 */
router.get('/events/types',
  requireAuth,
  async (req, res) => {
    res.json({
      eventTypes: webhookManager.eventTypes,
      descriptions: {
        'receipt.verified': 'Fired when a receipt is successfully verified',
        'receipt.failed': 'Fired when receipt verification fails',
        'batch.completed': 'Fired when a batch processing job completes',
        'batch.failed': 'Fired when a batch processing job fails',
        'user.created': 'Fired when a new user account is created',
        'subscription.updated': 'Fired when a webhook subscription is modified',
        'security.alert': 'Fired when a security event occurs',
        'system.maintenance': 'Fired during system maintenance windows'
      },
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * GET /api/v1/webhooks/metrics
 * Get webhook system metrics
 */
router.get('/metrics',
  requireAuth,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const metrics = await webhookManager.getMetrics();

      // Filter metrics for user/tenant if not admin
      if (req.user.role !== 'admin') {
        // Return limited metrics for regular users
        res.json({
          subscriptions: {
            total: metrics.subscriptions.total,
            active: metrics.subscriptions.active
          },
          timestamp: metrics.timestamp
        });
      } else {
        res.json(metrics);
      }

    } catch (error) {
      logger.error('Failed to get webhook metrics', {
        error: error.message
      });

      res.status(500).json({
        error: 'Failed to get webhook metrics',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/v1/webhooks/health
 * Webhook system health check
 */
router.get('/health', async (req, res) => {
  try {
    const metrics = await webhookManager.getMetrics();

    const healthy = metrics.queue.waiting < 1000 && metrics.queue.failed < 100;

    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'healthy' : 'degraded',
      metrics: {
        queue: metrics.queue,
        subscriptions: metrics.subscriptions
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Webhook signature verification utility endpoint
router.post('/verify-signature',
  requireAuth,
  body('payload').notEmpty(),
  body('signature').notEmpty(),
  body('secret').notEmpty(),
  handleValidationErrors,
  (req, res) => {
    try {
      const { payload, signature, secret } = req.body;

      const isValid = webhookManager.verifySignature(payload, signature, secret);

      res.json({
        valid: isValid,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(400).json({
        error: 'Signature verification failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down webhook manager...');
  await webhookManager.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down webhook manager...');
  await webhookManager.shutdown();
  process.exit(0);
});

module.exports = router;
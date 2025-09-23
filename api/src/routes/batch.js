/**
 * Enterprise Batch Processing API Routes
 * RESTful endpoints for high-volume batch operations
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, param, query, validationResult } = require('express-validator');
const BatchProcessor = require('../services/batchProcessor');
const { createContextLogger } = require('../middleware/logging');

// Initialize batch processor
const batchProcessor = new BatchProcessor({
  concurrency: process.env.BATCH_CONCURRENCY || 10,
  maxRetries: process.env.BATCH_MAX_RETRIES || 3,
  timeout: process.env.BATCH_TIMEOUT || 30000
});

// Rate limiting for batch operations
const batchRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 batch requests per windowMs
  message: {
    error: 'Too many batch requests',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Enterprise rate limiting (higher limits for authenticated enterprise users)
const enterpriseRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skip: (req) => !req.user || req.user.tier !== 'enterprise',
  message: {
    error: 'Rate limit exceeded for enterprise tier',
    retryAfter: '15 minutes'
  }
});

// Validation middleware
const validateBatchRequest = [
  body('receipts')
    .isArray({ min: 1, max: 10000 })
    .withMessage('Receipts must be an array with 1-10000 items'),
  body('receipts.*.id')
    .optional()
    .isString()
    .withMessage('Receipt ID must be a string'),
  body('receipts.*.data')
    .notEmpty()
    .withMessage('Receipt data is required'),
  body('options.batchSize')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Batch size must be between 1 and 1000'),
  body('options.includeDetails')
    .optional()
    .isBoolean()
    .withMessage('includeDetails must be a boolean'),
  body('options.validateTiming')
    .optional()
    .isBoolean()
    .withMessage('validateTiming must be a boolean')
];

const validateJobQuery = [
  param('jobId')
    .isUUID()
    .withMessage('Job ID must be a valid UUID'),
  query('includeResults')
    .optional()
    .isBoolean()
    .withMessage('includeResults must be a boolean')
];

const validateBulkOperation = [
  body('operation')
    .isIn(['bulk_verify', 'bulk_export', 'bulk_analytics'])
    .withMessage('Operation must be one of: bulk_verify, bulk_export, bulk_analytics'),
  body('data')
    .notEmpty()
    .withMessage('Data is required for bulk operations'),
  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object')
];

// Middleware to handle validation errors
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

// Authentication middleware (placeholder - implement based on your auth system)
const requireAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'API key must be provided in X-API-Key header or Authorization header'
    });
  }

  // TODO: Implement actual API key validation
  req.user = {
    id: 'user_123',
    tier: 'enterprise', // or 'standard', 'premium'
    limits: {
      batchSize: 10000,
      concurrentJobs: 10
    }
  };

  next();
};

/**
 * POST /api/v1/batch/receipts/verify
 * Submit a batch of receipts for verification
 */
router.post('/receipts/verify',
  batchRateLimit,
  enterpriseRateLimit,
  requireAuth,
  validateBatchRequest,
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { receipts, options = {} } = req.body;

      // Check user limits
      if (receipts.length > req.user.limits.batchSize) {
        return res.status(400).json({
          error: 'Batch size exceeds limit',
          limit: req.user.limits.batchSize,
          requested: receipts.length
        });
      }

      logger.info('Batch verification request received', {
        receiptCount: receipts.length,
        userId: req.user.id,
        options
      });

      // Submit job to batch processor
      const job = await batchProcessor.addJob('receipt-verification', {
        receipts,
        options,
        userId: req.user.id,
        correlationId: req.correlationId
      }, {
        priority: req.user.tier === 'enterprise' ? 1 : 5,
        removeOnComplete: 100,
        removeOnFail: 50
      });

      logger.info('Batch job created', {
        jobId: job.jobId,
        receiptCount: receipts.length
      });

      res.status(202).json({
        jobId: job.jobId,
        status: 'accepted',
        message: 'Batch verification job queued successfully',
        estimatedCompletion: new Date(Date.now() + (receipts.length * 100)).toISOString(), // Rough estimate
        statusUrl: `/api/v1/batch/jobs/${job.jobId}`,
        receiptCount: receipts.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Batch verification failed', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        error: 'Batch verification failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /api/v1/batch/operations
 * Submit bulk operations (export, analytics, etc.)
 */
router.post('/operations',
  batchRateLimit,
  enterpriseRateLimit,
  requireAuth,
  validateBulkOperation,
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { operation, data, options = {} } = req.body;

      logger.info('Bulk operation request received', {
        operation,
        userId: req.user.id,
        dataSize: JSON.stringify(data).length
      });

      // Submit job to batch processor
      const job = await batchProcessor.addJob('bulk-operations', {
        operation,
        data,
        options,
        userId: req.user.id,
        correlationId: req.correlationId
      }, {
        priority: req.user.tier === 'enterprise' ? 1 : 5,
        removeOnComplete: 50,
        removeOnFail: 25
      });

      logger.info('Bulk operation job created', {
        jobId: job.jobId,
        operation
      });

      res.status(202).json({
        jobId: job.jobId,
        status: 'accepted',
        operation,
        message: 'Bulk operation job queued successfully',
        statusUrl: `/api/v1/batch/jobs/${job.jobId}`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Bulk operation failed', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        error: 'Bulk operation failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/v1/batch/jobs/:jobId
 * Get job status and results
 */
router.get('/jobs/:jobId',
  requireAuth,
  validateJobQuery,
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { jobId } = req.params;
      const includeResults = req.query.includeResults === 'true';

      logger.debug('Job status request', { jobId, includeResults });

      // Try to find job in any queue
      let jobStatus = null;
      const queueNames = ['receipt-verification', 'bulk-operations', 'analytics-processing'];

      for (const queueName of queueNames) {
        try {
          jobStatus = await batchProcessor.getJobStatus(queueName, jobId);
          if (jobStatus) {
            jobStatus.queueName = queueName;
            break;
          }
        } catch (error) {
          // Continue to next queue
        }
      }

      if (!jobStatus) {
        return res.status(404).json({
          error: 'Job not found',
          jobId,
          message: 'Job may have expired or never existed',
          timestamp: new Date().toISOString()
        });
      }

      // Filter results if not requested
      if (!includeResults && jobStatus.result) {
        if (jobStatus.result.results) {
          delete jobStatus.result.results;
        }
      }

      res.json({
        ...jobStatus,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Job status check failed', {
        error: error.message,
        jobId: req.params.jobId
      });

      res.status(500).json({
        error: 'Failed to get job status',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/v1/batch/jobs/:jobId/results
 * Get detailed job results
 */
router.get('/jobs/:jobId/results',
  requireAuth,
  param('jobId').isUUID().withMessage('Job ID must be a valid UUID'),
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { jobId } = req.params;

      logger.debug('Job results request', { jobId });

      // Try to find job in any queue
      let jobStatus = null;
      const queueNames = ['receipt-verification', 'bulk-operations', 'analytics-processing'];

      for (const queueName of queueNames) {
        try {
          jobStatus = await batchProcessor.getJobStatus(queueName, jobId);
          if (jobStatus) break;
        } catch (error) {
          // Continue to next queue
        }
      }

      if (!jobStatus) {
        return res.status(404).json({
          error: 'Job not found',
          jobId,
          timestamp: new Date().toISOString()
        });
      }

      if (jobStatus.status !== 'completed') {
        return res.status(400).json({
          error: 'Job not completed',
          status: jobStatus.status,
          message: 'Job results are only available for completed jobs',
          timestamp: new Date().toISOString()
        });
      }

      if (!jobStatus.result) {
        return res.status(404).json({
          error: 'No results available',
          message: 'Job completed but no results were stored',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        jobId,
        status: jobStatus.status,
        results: jobStatus.result,
        metadata: {
          completedAt: jobStatus.finishedAt,
          processingTime: jobStatus.finishedAt && jobStatus.createdAt
            ? new Date(jobStatus.finishedAt) - new Date(jobStatus.createdAt)
            : null
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Job results retrieval failed', {
        error: error.message,
        jobId: req.params.jobId
      });

      res.status(500).json({
        error: 'Failed to get job results',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /api/v1/batch/stats
 * Get batch processing statistics
 */
router.get('/stats',
  requireAuth,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      logger.debug('Batch stats request', { userId: req.user.id });

      const stats = await batchProcessor.getAllQueueStats();

      res.json({
        ...stats,
        userTier: req.user.tier,
        userLimits: req.user.limits
      });

    } catch (error) {
      logger.error('Stats retrieval failed', {
        error: error.message
      });

      res.status(500).json({
        error: 'Failed to get statistics',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * DELETE /api/v1/batch/jobs/:jobId
 * Cancel a pending job
 */
router.delete('/jobs/:jobId',
  requireAuth,
  param('jobId').isUUID().withMessage('Job ID must be a valid UUID'),
  handleValidationErrors,
  async (req, res) => {
    const logger = req.logger || createContextLogger(req.correlationId);

    try {
      const { jobId } = req.params;

      logger.info('Job cancellation request', { jobId, userId: req.user.id });

      // Try to find and cancel job in any queue
      let cancelled = false;
      const queueNames = ['receipt-verification', 'bulk-operations', 'analytics-processing'];

      for (const queueName of queueNames) {
        try {
          const queue = batchProcessor.jobQueues.get(queueName);
          const job = await queue.getJob(jobId);

          if (job) {
            const state = await job.getState();

            if (['waiting', 'delayed'].includes(state)) {
              await job.remove();
              cancelled = true;
              break;
            } else if (state === 'active') {
              return res.status(400).json({
                error: 'Cannot cancel active job',
                status: state,
                message: 'Job is currently being processed and cannot be cancelled',
                timestamp: new Date().toISOString()
              });
            } else {
              return res.status(400).json({
                error: 'Cannot cancel completed job',
                status: state,
                message: 'Job has already completed and cannot be cancelled',
                timestamp: new Date().toISOString()
              });
            }
          }
        } catch (error) {
          // Continue to next queue
        }
      }

      if (!cancelled) {
        return res.status(404).json({
          error: 'Job not found or cannot be cancelled',
          jobId,
          timestamp: new Date().toISOString()
        });
      }

      logger.info('Job cancelled successfully', { jobId });

      res.json({
        jobId,
        status: 'cancelled',
        message: 'Job cancelled successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Job cancellation failed', {
        error: error.message,
        jobId: req.params.jobId
      });

      res.status(500).json({
        error: 'Failed to cancel job',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
);

// Health check endpoint for batch processing
router.get('/health', async (req, res) => {
  try {
    const stats = await batchProcessor.getAllQueueStats();

    // Check if all queues are responsive
    const healthy = Object.values(stats.queues).every(queue =>
      queue.processing.workers > 0
    );

    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'healthy' : 'degraded',
      queues: stats.queues,
      overall: stats.overall,
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

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down batch processor...');
  await batchProcessor.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down batch processor...');
  await batchProcessor.shutdown();
  process.exit(0);
});

module.exports = router;
/**
 * Enterprise Webhook Management System
 * Reliable, scalable webhook delivery with retry logic and monitoring
 */

const crypto = require('crypto');
const axios = require('axios');
const Bull = require('bull');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const { createContextLogger } = require('../middleware/logging');

class WebhookManager {
  constructor(options = {}) {
    this.config = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: options.redisDb || 2
      },
      maxRetries: options.maxRetries || 5,
      retryDelay: options.retryDelay || 1000,
      timeout: options.timeout || 30000,
      concurrency: options.concurrency || 5,
      verificationEnabled: options.verificationEnabled !== false,
      ...options
    };

    this.redis = new Redis(this.config.redis);
    this.webhookQueue = null;
    this.subscriptions = new Map();

    this.metrics = {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      avgDeliveryTime: 0,
      activeWebhooks: 0
    };

    this.eventTypes = [
      'receipt.verified',
      'receipt.failed',
      'batch.completed',
      'batch.failed',
      'user.created',
      'subscription.updated',
      'security.alert',
      'system.maintenance'
    ];

    this.initialize();
  }

  async initialize() {
    // Create webhook delivery queue
    this.webhookQueue = new Bull('webhook-delivery', {
      redis: this.config.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: this.config.maxRetries,
        backoff: {
          type: 'exponential',
          delay: this.config.retryDelay
        }
      }
    });

    // Set up webhook delivery worker
    this.webhookQueue.process(this.config.concurrency, this.deliverWebhook.bind(this));

    // Set up event handlers
    this.setupEventHandlers();

    // Load existing subscriptions
    await this.loadSubscriptions();

    // Start metrics collection
    this.startMetricsCollection();

    console.log('Webhook manager initialized');
  }

  setupEventHandlers() {
    this.webhookQueue.on('completed', (job, result) => {
      this.metrics.successfulDeliveries++;
      this.updateDeliveryMetrics(job, 'success', result);
    });

    this.webhookQueue.on('failed', (job, err) => {
      this.metrics.failedDeliveries++;
      this.updateDeliveryMetrics(job, 'failed', err);
    });

    this.webhookQueue.on('stalled', (job) => {
      console.warn(`Webhook delivery job ${job.id} stalled`);
    });
  }

  // Subscription Management
  async createSubscription(config) {
    const subscription = {
      id: uuidv4(),
      url: config.url,
      events: config.events || ['*'],
      secret: config.secret || this.generateSecret(),
      active: config.active !== false,
      retryPolicy: {
        maxRetries: config.maxRetries || this.config.maxRetries,
        retryDelay: config.retryDelay || this.config.retryDelay
      },
      filters: config.filters || {},
      headers: config.headers || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: config.userId,
      tenantId: config.tenantId
    };

    // Validate subscription
    await this.validateSubscription(subscription);

    // Store subscription
    await this.redis.hset(
      'webhooks:subscriptions',
      subscription.id,
      JSON.stringify(subscription)
    );

    // Cache subscription for quick access
    this.subscriptions.set(subscription.id, subscription);

    // Update metrics
    this.metrics.activeWebhooks++;

    return {
      id: subscription.id,
      url: subscription.url,
      events: subscription.events,
      secret: subscription.secret,
      active: subscription.active,
      createdAt: subscription.createdAt
    };
  }

  async updateSubscription(subscriptionId, updates) {
    const subscription = await this.getSubscription(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const updatedSubscription = {
      ...subscription,
      ...updates,
      id: subscriptionId, // Prevent ID changes
      updatedAt: new Date().toISOString()
    };

    // Validate updated subscription
    await this.validateSubscription(updatedSubscription);

    // Store updated subscription
    await this.redis.hset(
      'webhooks:subscriptions',
      subscriptionId,
      JSON.stringify(updatedSubscription)
    );

    // Update cache
    this.subscriptions.set(subscriptionId, updatedSubscription);

    return updatedSubscription;
  }

  async deleteSubscription(subscriptionId) {
    const subscription = await this.getSubscription(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Remove from storage
    await this.redis.hdel('webhooks:subscriptions', subscriptionId);

    // Remove from cache
    this.subscriptions.delete(subscriptionId);

    // Update metrics
    this.metrics.activeWebhooks--;

    return { deleted: true, subscriptionId };
  }

  async getSubscription(subscriptionId) {
    // Try cache first
    if (this.subscriptions.has(subscriptionId)) {
      return this.subscriptions.get(subscriptionId);
    }

    // Fetch from Redis
    const subscriptionData = await this.redis.hget('webhooks:subscriptions', subscriptionId);
    if (!subscriptionData) {
      return null;
    }

    const subscription = JSON.parse(subscriptionData);
    this.subscriptions.set(subscriptionId, subscription);
    return subscription;
  }

  async listSubscriptions(filters = {}) {
    const allSubscriptions = await this.redis.hgetall('webhooks:subscriptions');
    let subscriptions = Object.values(allSubscriptions).map(data => JSON.parse(data));

    // Apply filters
    if (filters.userId) {
      subscriptions = subscriptions.filter(sub => sub.userId === filters.userId);
    }

    if (filters.tenantId) {
      subscriptions = subscriptions.filter(sub => sub.tenantId === filters.tenantId);
    }

    if (filters.active !== undefined) {
      subscriptions = subscriptions.filter(sub => sub.active === filters.active);
    }

    if (filters.event) {
      subscriptions = subscriptions.filter(sub =>
        sub.events.includes('*') || sub.events.includes(filters.event)
      );
    }

    return subscriptions;
  }

  // Event Publishing
  async publishEvent(eventType, payload, metadata = {}) {
    const logger = createContextLogger(metadata.correlationId || uuidv4());

    logger.info('Publishing webhook event', {
      eventType,
      payloadSize: JSON.stringify(payload).length,
      metadata
    });

    // Get matching subscriptions
    const matchingSubscriptions = await this.getMatchingSubscriptions(eventType, payload, metadata);

    if (matchingSubscriptions.length === 0) {
      logger.debug('No matching subscriptions found', { eventType });
      return { delivered: 0, queued: 0 };
    }

    const event = {
      id: uuidv4(),
      type: eventType,
      data: payload,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        source: 'certnode-api',
        version: '1.0'
      }
    };

    // Queue delivery jobs for each subscription
    let queuedCount = 0;
    for (const subscription of matchingSubscriptions) {
      try {
        await this.queueDelivery(subscription, event);
        queuedCount++;
      } catch (error) {
        logger.error('Failed to queue webhook delivery', {
          subscriptionId: subscription.id,
          error: error.message
        });
      }
    }

    logger.info('Webhook event queued for delivery', {
      eventId: event.id,
      eventType,
      subscriptions: matchingSubscriptions.length,
      queued: queuedCount
    });

    return {
      eventId: event.id,
      delivered: 0,
      queued: queuedCount,
      subscriptions: matchingSubscriptions.length
    };
  }

  async getMatchingSubscriptions(eventType, payload, metadata) {
    const allSubscriptions = await this.listSubscriptions({ active: true });

    return allSubscriptions.filter(subscription => {
      // Check event type matching
      const eventMatches = subscription.events.includes('*') ||
                          subscription.events.includes(eventType);

      if (!eventMatches) return false;

      // Apply filters if defined
      if (subscription.filters && Object.keys(subscription.filters).length > 0) {
        return this.applyFilters(subscription.filters, payload, metadata);
      }

      // Check tenant/user isolation
      if (subscription.tenantId && metadata.tenantId) {
        return subscription.tenantId === metadata.tenantId;
      }

      if (subscription.userId && metadata.userId) {
        return subscription.userId === metadata.userId;
      }

      return true;
    });
  }

  applyFilters(filters, payload, metadata) {
    for (const [key, value] of Object.entries(filters)) {
      const actualValue = this.getNestedProperty(payload, key) ||
                         this.getNestedProperty(metadata, key);

      if (Array.isArray(value)) {
        if (!value.includes(actualValue)) return false;
      } else if (typeof value === 'object' && value.operator) {
        if (!this.applyOperatorFilter(actualValue, value)) return false;
      } else {
        if (actualValue !== value) return false;
      }
    }

    return true;
  }

  applyOperatorFilter(actualValue, filterConfig) {
    const { operator, value } = filterConfig;

    switch (operator) {
      case 'eq': return actualValue === value;
      case 'ne': return actualValue !== value;
      case 'gt': return actualValue > value;
      case 'gte': return actualValue >= value;
      case 'lt': return actualValue < value;
      case 'lte': return actualValue <= value;
      case 'in': return Array.isArray(value) && value.includes(actualValue);
      case 'contains': return typeof actualValue === 'string' && actualValue.includes(value);
      case 'regex': return new RegExp(value).test(actualValue);
      default: return false;
    }
  }

  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  async queueDelivery(subscription, event) {
    const deliveryJob = {
      subscriptionId: subscription.id,
      subscription,
      event,
      attempt: 1,
      queuedAt: new Date().toISOString()
    };

    const job = await this.webhookQueue.add('deliver', deliveryJob, {
      attempts: subscription.retryPolicy.maxRetries,
      backoff: {
        type: 'exponential',
        delay: subscription.retryPolicy.retryDelay
      },
      removeOnComplete: 100,
      removeOnFail: 50
    });

    this.metrics.totalDeliveries++;

    return job;
  }

  // Webhook Delivery
  async deliverWebhook(job) {
    const { subscription, event, attempt = 1 } = job.data;
    const logger = createContextLogger(event.id);

    const startTime = Date.now();

    try {
      logger.info('Delivering webhook', {
        subscriptionId: subscription.id,
        eventType: event.type,
        attempt,
        url: subscription.url
      });

      // Prepare webhook payload
      const webhookPayload = this.createWebhookPayload(event, subscription);

      // Generate signature if secret is provided
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'CertNode-Webhooks/1.0',
        'X-CertNode-Event': event.type,
        'X-CertNode-Event-ID': event.id,
        'X-CertNode-Delivery': job.id,
        'X-CertNode-Timestamp': event.metadata.timestamp,
        ...subscription.headers
      };

      if (subscription.secret && this.config.verificationEnabled) {
        headers['X-CertNode-Signature'] = this.generateSignature(
          JSON.stringify(webhookPayload),
          subscription.secret
        );
      }

      // Make HTTP request
      const response = await axios({
        method: 'POST',
        url: subscription.url,
        data: webhookPayload,
        headers,
        timeout: this.config.timeout,
        validateStatus: (status) => status >= 200 && status < 300,
        maxRedirects: 3
      });

      const deliveryTime = Date.now() - startTime;

      logger.info('Webhook delivered successfully', {
        subscriptionId: subscription.id,
        responseStatus: response.status,
        deliveryTime: `${deliveryTime}ms`
      });

      // Record successful delivery
      await this.recordDelivery(subscription.id, event.id, {
        status: 'success',
        responseStatus: response.status,
        responseHeaders: response.headers,
        deliveryTime,
        attempt
      });

      return {
        success: true,
        status: response.status,
        deliveryTime
      };

    } catch (error) {
      const deliveryTime = Date.now() - startTime;

      logger.error('Webhook delivery failed', {
        subscriptionId: subscription.id,
        error: error.message,
        attempt,
        deliveryTime: `${deliveryTime}ms`,
        responseStatus: error.response?.status,
        responseData: error.response?.data
      });

      // Record failed delivery
      await this.recordDelivery(subscription.id, event.id, {
        status: 'failed',
        error: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        deliveryTime,
        attempt
      });

      // Re-throw to trigger retry
      throw error;
    }
  }

  createWebhookPayload(event, subscription) {
    return {
      id: event.id,
      type: event.type,
      data: event.data,
      metadata: event.metadata,
      subscription: {
        id: subscription.id,
        url: subscription.url
      },
      timestamp: event.metadata.timestamp
    };
  }

  generateSignature(payload, secret) {
    return 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  verifySignature(payload, signature, secret) {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Delivery Tracking
  async recordDelivery(subscriptionId, eventId, deliveryData) {
    const deliveryRecord = {
      subscriptionId,
      eventId,
      ...deliveryData,
      timestamp: new Date().toISOString()
    };

    // Store delivery record with TTL (30 days)
    await this.redis.setex(
      `webhooks:delivery:${subscriptionId}:${eventId}`,
      30 * 24 * 60 * 60,
      JSON.stringify(deliveryRecord)
    );

    // Update subscription metrics
    await this.redis.hincrby(
      `webhooks:metrics:${subscriptionId}`,
      deliveryData.status === 'success' ? 'successful' : 'failed',
      1
    );
  }

  async getDeliveryHistory(subscriptionId, options = {}) {
    const pattern = `webhooks:delivery:${subscriptionId}:*`;
    const keys = await this.redis.keys(pattern);

    const deliveries = await Promise.all(
      keys.map(async (key) => {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
      })
    );

    let filteredDeliveries = deliveries.filter(Boolean);

    // Apply filters
    if (options.status) {
      filteredDeliveries = filteredDeliveries.filter(d => d.status === options.status);
    }

    if (options.since) {
      const sinceDate = new Date(options.since);
      filteredDeliveries = filteredDeliveries.filter(d =>
        new Date(d.timestamp) >= sinceDate
      );
    }

    // Sort by timestamp
    filteredDeliveries.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Apply pagination
    const limit = options.limit || 100;
    const offset = options.offset || 0;

    return {
      deliveries: filteredDeliveries.slice(offset, offset + limit),
      total: filteredDeliveries.length,
      hasMore: filteredDeliveries.length > offset + limit
    };
  }

  // Webhook Testing
  async testWebhook(subscriptionId, eventType = 'test.event') {
    const subscription = await this.getSubscription(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const testEvent = {
      id: uuidv4(),
      type: eventType,
      data: {
        message: 'This is a test webhook event',
        timestamp: new Date().toISOString()
      },
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'certnode-api',
        version: '1.0',
        test: true
      }
    };

    // Queue immediate delivery (bypass normal queuing)
    const job = await this.webhookQueue.add('deliver', {
      subscriptionId: subscription.id,
      subscription,
      event: testEvent,
      attempt: 1,
      test: true
    }, {
      priority: 1,
      attempts: 1
    });

    return {
      testId: job.id,
      eventId: testEvent.id,
      message: 'Test webhook queued for delivery'
    };
  }

  // Utility Methods
  generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  async validateSubscription(subscription) {
    // Validate URL
    try {
      new URL(subscription.url);
    } catch (error) {
      throw new Error('Invalid webhook URL');
    }

    // Validate events
    for (const event of subscription.events) {
      if (event !== '*' && !this.eventTypes.includes(event)) {
        throw new Error(`Invalid event type: ${event}`);
      }
    }

    // Validate URL accessibility (optional)
    if (process.env.NODE_ENV !== 'test' && subscription.validateUrl !== false) {
      try {
        await axios.head(subscription.url, { timeout: 5000 });
      } catch (error) {
        console.warn(`Warning: Webhook URL may not be accessible: ${subscription.url}`);
      }
    }

    return true;
  }

  async loadSubscriptions() {
    const subscriptionsData = await this.redis.hgetall('webhooks:subscriptions');

    for (const [id, data] of Object.entries(subscriptionsData)) {
      try {
        const subscription = JSON.parse(data);
        this.subscriptions.set(id, subscription);

        if (subscription.active) {
          this.metrics.activeWebhooks++;
        }
      } catch (error) {
        console.error(`Failed to load subscription ${id}:`, error.message);
      }
    }

    console.log(`Loaded ${this.subscriptions.size} webhook subscriptions`);
  }

  updateDeliveryMetrics(job, status, result) {
    const deliveryTime = job.finishedOn - job.processedOn;

    if (deliveryTime > 0) {
      this.metrics.avgDeliveryTime =
        (this.metrics.avgDeliveryTime + deliveryTime) / 2;
    }
  }

  startMetricsCollection() {
    setInterval(async () => {
      const queueStats = await this.webhookQueue.getJobCounts();

      const metrics = {
        ...this.metrics,
        queue: queueStats,
        timestamp: new Date().toISOString()
      };

      await this.redis.setex(
        'webhooks:metrics',
        300, // 5 minutes TTL
        JSON.stringify(metrics)
      );
    }, 30000); // Every 30 seconds
  }

  async getMetrics() {
    const queueStats = await this.webhookQueue.getJobCounts();

    return {
      ...this.metrics,
      queue: queueStats,
      subscriptions: {
        total: this.subscriptions.size,
        active: this.metrics.activeWebhooks
      },
      timestamp: new Date().toISOString()
    };
  }

  // Cleanup and Shutdown
  async shutdown() {
    console.log('Shutting down webhook manager...');

    if (this.webhookQueue) {
      await this.webhookQueue.close();
    }

    if (this.redis) {
      await this.redis.quit();
    }

    console.log('Webhook manager shutdown complete');
  }
}

module.exports = WebhookManager;
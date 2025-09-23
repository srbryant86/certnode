/**
 * Enterprise Batch Processing System
 * High-performance batch processing for receipt verification at scale
 */

const Bull = require('bull');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const { createContextLogger } = require('../middleware/logging');

class BatchProcessor {
  constructor(options = {}) {
    this.config = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: options.redisDb || 1
      },
      concurrency: options.concurrency || 10,
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 30000,
      ...options
    };

    this.redis = new Redis(this.config.redis);
    this.jobQueues = new Map();
    this.workers = new Map();
    this.metrics = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      avgProcessingTime: 0,
      throughput: 0
    };

    this.initialize();
  }

  async initialize() {
    // Create different queues for different job types
    this.createQueue('receipt-verification', {
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: this.config.maxRetries,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      }
    });

    this.createQueue('bulk-operations', {
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: this.config.maxRetries,
        timeout: this.config.timeout * 2
      }
    });

    this.createQueue('analytics-processing', {
      defaultJobOptions: {
        removeOnComplete: 200,
        removeOnFail: 100,
        attempts: 1,
        delay: 5000 // Process analytics with slight delay
      }
    });

    // Set up workers for each queue
    this.startWorkers();

    // Initialize metrics collection
    this.startMetricsCollection();
  }

  createQueue(name, options = {}) {
    const queue = new Bull(name, {
      redis: this.config.redis,
      ...options
    });

    // Queue event handlers
    queue.on('completed', (job, result) => {
      this.metrics.completedJobs++;
      this.updateMetrics(job, 'completed');
    });

    queue.on('failed', (job, err) => {
      this.metrics.failedJobs++;
      this.updateMetrics(job, 'failed', err);
    });

    queue.on('stalled', (job) => {
      console.warn(`Job ${job.id} stalled in queue ${name}`);
    });

    this.jobQueues.set(name, queue);
    return queue;
  }

  startWorkers() {
    // Receipt verification worker
    this.startWorker('receipt-verification', this.processReceiptVerification.bind(this));

    // Bulk operations worker
    this.startWorker('bulk-operations', this.processBulkOperation.bind(this));

    // Analytics processing worker
    this.startWorker('analytics-processing', this.processAnalytics.bind(this));
  }

  startWorker(queueName, processor) {
    const queue = this.jobQueues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const worker = queue.process(this.config.concurrency, async (job) => {
      const startTime = Date.now();
      const logger = createContextLogger(job.data.correlationId || job.id);

      try {
        logger.info(`Processing ${queueName} job`, {
          jobId: job.id,
          queueName,
          data: job.data
        });

        const result = await processor(job, logger);

        const processingTime = Date.now() - startTime;
        logger.info(`Job completed successfully`, {
          jobId: job.id,
          processingTime: `${processingTime}ms`,
          result: typeof result === 'object' ? JSON.stringify(result) : result
        });

        return result;

      } catch (error) {
        const processingTime = Date.now() - startTime;
        logger.error(`Job failed`, {
          jobId: job.id,
          processingTime: `${processingTime}ms`,
          error: error.message,
          stack: error.stack
        });
        throw error;
      }
    });

    this.workers.set(queueName, worker);
    return worker;
  }

  async processReceiptVerification(job, logger) {
    const { receipts, options = {} } = job.data;

    if (!receipts || !Array.isArray(receipts)) {
      throw new Error('Invalid receipts data provided');
    }

    const results = [];
    const batchSize = options.batchSize || 50;

    // Process receipts in smaller batches to avoid memory issues
    for (let i = 0; i < receipts.length; i += batchSize) {
      const batch = receipts.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (receipt, index) => {
          try {
            // Import verification logic
            const { verifyReceipt } = require('./receiptVerification');

            const verification = await verifyReceipt(receipt, {
              includeDetails: options.includeDetails || false,
              validateTiming: options.validateTiming !== false
            });

            return {
              index: i + index,
              receiptId: receipt.id || `receipt_${i + index}`,
              status: 'verified',
              verification
            };

          } catch (error) {
            return {
              index: i + index,
              receiptId: receipt.id || `receipt_${i + index}`,
              status: 'failed',
              error: {
                message: error.message,
                code: error.code || 'VERIFICATION_ERROR'
              }
            };
          }
        })
      );

      // Process batch results
      batchResults.forEach((result, batchIndex) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            index: i + batchIndex,
            receiptId: `receipt_${i + batchIndex}`,
            status: 'failed',
            error: {
              message: result.reason.message || 'Unknown error',
              code: 'BATCH_PROCESSING_ERROR'
            }
          });
        }
      });

      // Update job progress
      const progress = Math.round(((i + batch.length) / receipts.length) * 100);
      await job.progress(progress);

      // Small delay to prevent overwhelming the system
      if (i + batchSize < receipts.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    // Generate summary statistics
    const summary = {
      totalReceipts: receipts.length,
      verifiedCount: results.filter(r => r.status === 'verified').length,
      failedCount: results.filter(r => r.status === 'failed').length,
      processingTime: Date.now() - job.timestamp,
      batchId: job.id
    };

    return {
      summary,
      results: options.includeResults !== false ? results : undefined,
      metadata: {
        jobId: job.id,
        queueName: 'receipt-verification',
        timestamp: new Date().toISOString()
      }
    };
  }

  async processBulkOperation(job, logger) {
    const { operation, data, options = {} } = job.data;

    switch (operation) {
      case 'bulk_verify':
        return await this.processBulkVerification(data, options, job);

      case 'bulk_export':
        return await this.processBulkExport(data, options, job);

      case 'bulk_analytics':
        return await this.processBulkAnalytics(data, options, job);

      default:
        throw new Error(`Unknown bulk operation: ${operation}`);
    }
  }

  async processBulkVerification(data, options, job) {
    // Delegate to receipt verification processor
    return await this.processReceiptVerification(
      { data: { receipts: data.receipts, options } },
      createContextLogger(job.id)
    );
  }

  async processBulkExport(data, options, job) {
    const { format = 'json', filters = {} } = options;

    // Simulate data export process
    await job.progress(25);

    // Fetch data based on filters
    const exportData = await this.fetchExportData(filters);
    await job.progress(50);

    // Format data according to requested format
    const formattedData = await this.formatExportData(exportData, format);
    await job.progress(75);

    // Store or prepare download
    const exportUrl = await this.storeExportData(formattedData, format, job.id);
    await job.progress(100);

    return {
      exportId: job.id,
      format,
      recordCount: exportData.length,
      downloadUrl: exportUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  async processBulkAnalytics(data, options, job) {
    const { timeRange, metrics = [] } = options;

    const analyticsResults = {
      timeRange,
      metrics: {},
      generatedAt: new Date().toISOString()
    };

    // Process each requested metric
    for (const metric of metrics) {
      await job.progress((metrics.indexOf(metric) / metrics.length) * 100);

      switch (metric) {
        case 'verification_trends':
          analyticsResults.metrics.verificationTrends = await this.calculateVerificationTrends(timeRange);
          break;

        case 'error_analysis':
          analyticsResults.metrics.errorAnalysis = await this.calculateErrorAnalysis(timeRange);
          break;

        case 'performance_metrics':
          analyticsResults.metrics.performanceMetrics = await this.calculatePerformanceMetrics(timeRange);
          break;
      }
    }

    return analyticsResults;
  }

  async processAnalytics(job, logger) {
    const { eventType, eventData, timestamp } = job.data;

    // Process analytics events
    switch (eventType) {
      case 'verification_completed':
        await this.recordVerificationMetrics(eventData);
        break;

      case 'api_request':
        await this.recordApiMetrics(eventData);
        break;

      case 'error_occurred':
        await this.recordErrorMetrics(eventData);
        break;
    }

    return { processed: true, eventType, timestamp };
  }

  // Queue management methods
  async addJob(queueName, jobData, options = {}) {
    const queue = this.jobQueues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const jobId = options.jobId || uuidv4();
    const job = await queue.add(jobData, {
      jobId,
      ...options
    });

    this.metrics.totalJobs++;

    return {
      jobId: job.id,
      queueName,
      status: 'queued',
      createdAt: new Date().toISOString()
    };
  }

  async getJobStatus(queueName, jobId) {
    const queue = this.jobQueues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();

    return {
      jobId: job.id,
      queueName,
      status: state,
      progress: job.progress(),
      data: job.data,
      result: job.returnvalue,
      createdAt: new Date(job.timestamp).toISOString(),
      processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      failedReason: job.failedReason,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts
    };
  }

  async getQueueStats(queueName) {
    const queue = this.jobQueues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed()
    ]);

    return {
      queueName,
      counts: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length
      },
      processing: {
        concurrency: this.config.concurrency,
        workers: this.workers.has(queueName) ? 1 : 0
      }
    };
  }

  async getAllQueueStats() {
    const stats = {};

    for (const queueName of this.jobQueues.keys()) {
      stats[queueName] = await this.getQueueStats(queueName);
    }

    return {
      queues: stats,
      overall: this.metrics,
      timestamp: new Date().toISOString()
    };
  }

  // Utility methods
  updateMetrics(job, status, error = null) {
    const processingTime = job.finishedOn - job.processedOn;

    if (processingTime > 0) {
      this.metrics.avgProcessingTime =
        (this.metrics.avgProcessingTime + processingTime) / 2;
    }

    // Calculate throughput (jobs per minute)
    const now = Date.now();
    if (!this.lastThroughputCalculation) {
      this.lastThroughputCalculation = now;
      this.throughputCounter = 0;
    }

    this.throughputCounter++;

    if (now - this.lastThroughputCalculation >= 60000) { // 1 minute
      this.metrics.throughput = this.throughputCounter;
      this.throughputCounter = 0;
      this.lastThroughputCalculation = now;
    }
  }

  startMetricsCollection() {
    // Collect metrics every 30 seconds
    setInterval(async () => {
      const allStats = await this.getAllQueueStats();

      // Store metrics in Redis for monitoring
      await this.redis.setex(
        'batch-processor:metrics',
        300, // 5 minutes TTL
        JSON.stringify(allStats)
      );
    }, 30000);
  }

  // Helper methods for bulk operations
  async fetchExportData(filters) {
    // Implementation would fetch data from database based on filters
    // This is a placeholder
    return [];
  }

  async formatExportData(data, format) {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        // CSV formatting logic
        return this.convertToCSV(data);
      case 'xml':
        // XML formatting logic
        return this.convertToXML(data);
      default:
        return JSON.stringify(data);
    }
  }

  async storeExportData(data, format, jobId) {
    // Store export data and return download URL
    const fileName = `export_${jobId}.${format}`;
    // Implementation would store to S3, local file system, etc.
    return `/downloads/${fileName}`;
  }

  // Analytics calculation methods
  async calculateVerificationTrends(timeRange) {
    // Implementation for verification trends
    return { trend: 'increasing', change: '+15%' };
  }

  async calculateErrorAnalysis(timeRange) {
    // Implementation for error analysis
    return { mostCommonError: 'INVALID_SIGNATURE', frequency: '2.3%' };
  }

  async calculatePerformanceMetrics(timeRange) {
    // Implementation for performance metrics
    return { avgResponseTime: '45ms', throughput: '1250/min' };
  }

  async recordVerificationMetrics(eventData) {
    // Record verification metrics
    await this.redis.hincrby('metrics:verifications', 'total', 1);
    if (eventData.success) {
      await this.redis.hincrby('metrics:verifications', 'successful', 1);
    } else {
      await this.redis.hincrby('metrics:verifications', 'failed', 1);
    }
  }

  async recordApiMetrics(eventData) {
    // Record API metrics
    await this.redis.hincrby('metrics:api', 'requests', 1);
    await this.redis.hincrby(`metrics:api:endpoints`, eventData.endpoint, 1);
  }

  async recordErrorMetrics(eventData) {
    // Record error metrics
    await this.redis.hincrby('metrics:errors', eventData.errorType, 1);
  }

  // Cleanup methods
  async shutdown() {
    console.log('Shutting down batch processor...');

    // Close all queues
    for (const queue of this.jobQueues.values()) {
      await queue.close();
    }

    // Close Redis connection
    await this.redis.quit();

    console.log('Batch processor shutdown complete');
  }

  // Utility methods for data conversion
  convertToCSV(data) {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  convertToXML(data) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';

    for (const item of data) {
      xml += '  <item>\n';
      for (const [key, value] of Object.entries(item)) {
        xml += `    <${key}>${value}</${key}>\n`;
      }
      xml += '  </item>\n';
    }

    xml += '</root>';
    return xml;
  }
}

module.exports = BatchProcessor;
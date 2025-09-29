import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';

export interface DetectionJob {
  id: string;
  receiptId: string;
  contentType: string;
  contentHash: string;
  contentBase64?: string;
  priority: 'high' | 'normal' | 'low';
  attempts?: number;
  maxAttempts?: number;
}

export interface QueueMetrics {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalProcessed: number;
  averageProcessingTime: number;
}

export interface DetectionResult {
  confidence: number;
  methods?: string[];
  indicators?: Record<string, unknown>;
  reasoning: string;
  modelSignatures?: Record<string, unknown>;
  confidenceInterval?: [number, number];
  processingTime: number;
  metadata?: Record<string, unknown>;
  statistics?: Record<string, unknown>;
  method: string;
  timestamp: string;
}

/**
 * Redis-backed detection job queue using BullMQ
 * Provides persistence, retries, and reliability for production
 */
export class RedisDetectionQueue {
  private redis: Redis;
  private queue: Queue;
  private worker: Worker;
  private queueEvents: QueueEvents;

  constructor(redisConfig?: { host?: string; port?: number; password?: string }) {
    // Initialize Redis connection
    this.redis = new Redis({
      host: redisConfig?.host || process.env.REDIS_HOST || 'localhost',
      port: redisConfig?.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: redisConfig?.password || process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Initialize BullMQ queue
    this.queue = new Queue('content-detection', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50,      // Keep last 50 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    // Initialize worker
    this.worker = new Worker(
      'content-detection',
      this.processJob.bind(this),
      {
        connection: this.redis,
        concurrency: parseInt(process.env.DETECTION_CONCURRENCY || '3'),
      }
    );

    // Initialize queue events for monitoring
    this.queueEvents = new QueueEvents('content-detection', {
      connection: this.redis,
    });

    this.setupEventListeners();
  }

  /**
   * Add a new detection job to the queue
   */
  async addJob(jobData: Omit<DetectionJob, 'id'>): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const priority = this.getPriorityValue(jobData.priority);

    const job = await this.queue.add(
      'detect-content',
      {
        ...jobData,
        id: jobId,
      },
      {
        priority,
        attempts: jobData.maxAttempts || 3,
        jobId,
      }
    );

    console.log(`Added detection job ${jobId} for content ${jobData.contentHash}`);
    return job.id || jobId;
  }

  /**
   * Get job status and result
   */
  async getJob(jobId: string): Promise<Job | null> {
    return await this.queue.getJob(jobId);
  }

  /**
   * Get queue metrics
   */
  async getMetrics(): Promise<QueueMetrics> {
    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    // Calculate average processing time from recent completed jobs
    const recentCompleted = completed.slice(-50); // Last 50 jobs
    const totalProcessingTime = recentCompleted.reduce((sum, job) => {
      if (job.finishedOn && job.processedOn) {
        return sum + (job.finishedOn - job.processedOn);
      }
      return sum;
    }, 0);

    const averageProcessingTime = recentCompleted.length > 0
      ? totalProcessingTime / recentCompleted.length
      : 0;

    return {
      pending: waiting.length,
      processing: active.length,
      completed: completed.length,
      failed: failed.length,
      totalProcessed: completed.length + failed.length,
      averageProcessingTime,
    };
  }

  /**
   * Process a single detection job
   */
  private async processJob(job: Job): Promise<DetectionResult> {
    const jobData = job.data as DetectionJob;

    console.log(`Processing job ${jobData.id} (attempt ${job.attemptsMade + 1})`);

    try {
      // Perform AI detection based on content type
      const result = await this.runDetection(jobData);

      // Update the receipt in the database with the detection result
      await this.updateReceiptWithResult(jobData.receiptId, result);

      console.log(`Completed job ${jobData.id}`);
      return result;

    } catch (error) {
      console.error(`Job ${jobData.id} failed:`, error);

      // BullMQ will handle retries automatically based on job configuration
      throw error;
    }
  }

  /**
   * Run AI detection for a job
   */
  private async runDetection(jobData: DetectionJob): Promise<DetectionResult> {
    if (!jobData.contentBase64) {
      throw new Error('No content provided for detection');
    }

    if (jobData.contentType.startsWith('text/')) {
      // Text detection
      const { advancedTextDetector } = await import('../content/detectors/advanced-text');
      const content = Buffer.from(jobData.contentBase64, 'base64').toString('utf-8');
      const result = await advancedTextDetector.analyze(content);

      return {
        confidence: result.confidence,
        methods: result.methods,
        indicators: result.indicators,
        reasoning: result.reasoning,
        modelSignatures: result.modelSignatures,
        confidenceInterval: result.confidenceInterval,
        processingTime: result.processingTime,
        method: "redis_background_text_detection",
        timestamp: new Date().toISOString(),
      };

    } else if (jobData.contentType.startsWith('image/')) {
      // Image detection
      const { imageMetadataDetector } = await import('../content/detectors/image-metadata');
      const imageBuffer = Buffer.from(jobData.contentBase64, 'base64');
      const result = await imageMetadataDetector.analyze(imageBuffer);

      return {
        confidence: result.confidence,
        metadata: result.metadata,
        statistics: result.statistics,
        indicators: result.indicators,
        reasoning: result.reasoning,
        processingTime: result.processingTime,
        method: "redis_background_image_detection",
        timestamp: new Date().toISOString(),
      };

    } else {
      // Unsupported content type
      return {
        confidence: 0,
        reasoning: "Content type not supported for AI detection",
        processingTime: 0,
        method: "redis_background_detection",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Update receipt with detection results
   */
  private async updateReceiptWithResult(receiptId: string, result: DetectionResult) {
    try {
      const { prisma } = await import('../prisma');

      await prisma.receipt.update({
        where: { id: receiptId },
        data: {
          contentAiScores: result
        }
      });

      console.log(`Updated receipt ${receiptId} with detection results`);
    } catch (error) {
      console.error(`Failed to update receipt ${receiptId}:`, error);
      throw error;
    }
  }

  /**
   * Get priority value for BullMQ (higher number = higher priority)
   */
  private getPriorityValue(priority: DetectionJob['priority']): number {
    switch (priority) {
      case 'high': return 10;
      case 'normal': return 5;
      case 'low': return 1;
      default: return 5;
    }
  }

  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners() {
    this.worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      if (job) {
        console.error(`Job ${job.id} failed with error: ${err.message}`);
      }
    });

    this.worker.on('stalled', (jobId) => {
      console.warn(`Job ${jobId} stalled`);
    });

    this.queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(`Job ${jobId} completed with result:`, returnvalue);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`Job ${jobId} failed: ${failedReason}`);
    });
  }

  /**
   * Gracefully shutdown the queue
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down Redis detection queue...');

    await this.worker.close();
    await this.queueEvents.close();
    await this.queue.close();
    await this.redis.quit();

    console.log('Redis detection queue shutdown complete');
  }

  /**
   * Health check for the queue system
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      await this.redis.ping();
      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Factory function to create queue instance with environment-based fallback
export function createDetectionQueue(): RedisDetectionQueue {
  // Check if Redis is available/configured
  const useRedis = process.env.NODE_ENV === 'production' || process.env.USE_REDIS_QUEUE === 'true';

  if (useRedis) {
    try {
      return new RedisDetectionQueue();
    } catch (error) {
      console.warn('Failed to initialize Redis queue, falling back to in-memory queue:', error);
      // In a real implementation, you might want to fall back to the in-memory queue
      throw error;
    }
  } else {
    console.log('Using Redis queue (development/production mode)');
    return new RedisDetectionQueue();
  }
}
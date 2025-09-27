export interface DetectionJob {
  id: string;
  receiptId: string;
  contentType: string;
  contentHash: string;
  contentBase64?: string;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
  attempts: number;
  maxAttempts: number;
}

export interface QueueMetrics {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalProcessed: number;
  averageProcessingTime: number;
}

/**
 * Simple in-memory job queue for AI detection processing
 * In production, this would be replaced with Redis/BullMQ
 */
export class DetectionJobQueue {
  private jobs = new Map<string, DetectionJob>();
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private concurrency = 3; // Number of jobs to process concurrently

  constructor() {
    this.startProcessing();
  }

  /**
   * Add a new detection job to the queue
   */
  async addJob(job: Omit<DetectionJob, 'id' | 'status' | 'createdAt' | 'attempts' | 'maxAttempts'>): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const detectionJob: DetectionJob = {
      ...job,
      id: jobId,
      status: 'pending',
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3
    };

    this.jobs.set(jobId, detectionJob);
    console.log(`Added detection job ${jobId} for content ${job.contentHash}`);

    return jobId;
  }

  /**
   * Get job status and result
   */
  async getJob(jobId: string): Promise<DetectionJob | null> {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get queue metrics
   */
  getMetrics(): QueueMetrics {
    const jobs = Array.from(this.jobs.values());

    const pending = jobs.filter(j => j.status === 'pending').length;
    const processing = jobs.filter(j => j.status === 'processing').length;
    const completed = jobs.filter(j => j.status === 'completed').length;
    const failed = jobs.filter(j => j.status === 'failed').length;

    const completedJobs = jobs.filter(j => j.status === 'completed' && j.processedAt);
    const totalProcessingTime = completedJobs.reduce((sum, job) => {
      if (job.processedAt && job.createdAt) {
        return sum + (job.processedAt.getTime() - job.createdAt.getTime());
      }
      return sum;
    }, 0);

    const averageProcessingTime = completedJobs.length > 0
      ? totalProcessingTime / completedJobs.length
      : 0;

    return {
      pending,
      processing,
      completed,
      failed,
      totalProcessed: completed + failed,
      averageProcessingTime
    };
  }

  /**
   * Start the background job processor
   */
  private startProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processJobs();
      }
    }, 1000); // Check every second

    // Process immediately
    this.processJobs();
  }

  /**
   * Process pending jobs
   */
  private async processJobs() {
    this.isProcessing = true;

    try {
      const pendingJobs = Array.from(this.jobs.values())
        .filter(job => job.status === 'pending')
        .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
        .slice(0, this.concurrency);

      if (pendingJobs.length === 0) {
        this.isProcessing = false;
        return;
      }

      // Process jobs concurrently
      await Promise.all(pendingJobs.map(job => this.processJob(job)));

    } catch (error) {
      console.error('Error processing jobs:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: DetectionJob) {
    // Update job status
    job.status = 'processing';
    job.attempts += 1;
    this.jobs.set(job.id, job);

    console.log(`Processing job ${job.id} (attempt ${job.attempts})`);

    try {
      // Perform AI detection based on content type
      const result = await this.runDetection(job);

      // Update job with result
      job.status = 'completed';
      job.result = result;
      job.processedAt = new Date();
      this.jobs.set(job.id, job);

      console.log(`Completed job ${job.id} in ${job.processedAt.getTime() - job.createdAt.getTime()}ms`);

      // TODO: Update the receipt in the database with the detection result
      await this.updateReceiptWithResult(job.receiptId, result);

    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);

      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        job.processedAt = new Date();
      } else {
        // Retry later
        job.status = 'pending';
      }

      this.jobs.set(job.id, job);
    }
  }

  /**
   * Run AI detection for a job
   */
  private async runDetection(job: DetectionJob): Promise<Record<string, unknown>> {
    if (!job.contentBase64) {
      throw new Error('No content provided for detection');
    }

    if (job.contentType.startsWith('text/')) {
      // Text detection
      const { advancedTextDetector } = await import('../content/detectors/advanced-text');
      const content = Buffer.from(job.contentBase64, 'base64').toString('utf-8');
      const result = await advancedTextDetector.analyze(content);

      return {
        confidence: result.confidence,
        methods: result.methods,
        indicators: result.indicators,
        reasoning: result.reasoning,
        modelSignatures: result.modelSignatures,
        confidenceInterval: result.confidenceInterval,
        processingTime: result.processingTime,
        method: "background_text_detection",
        timestamp: new Date().toISOString(),
      };

    } else if (job.contentType.startsWith('image/')) {
      // Image detection
      const { imageMetadataDetector } = await import('../content/detectors/image-metadata');
      const imageBuffer = Buffer.from(job.contentBase64, 'base64');
      const result = await imageMetadataDetector.analyze(imageBuffer);

      return {
        confidence: result.confidence,
        metadata: result.metadata,
        statistics: result.statistics,
        indicators: result.indicators,
        reasoning: result.reasoning,
        processingTime: result.processingTime,
        method: "background_image_detection",
        timestamp: new Date().toISOString(),
      };

    } else {
      // Unsupported content type
      return {
        confidence: 0,
        reasoning: "Content type not supported for AI detection",
        method: "background_detection",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Update receipt with detection results
   */
  private async updateReceiptWithResult(receiptId: string, result: Record<string, unknown>) {
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
   * Get priority weight for sorting
   */
  private getPriorityWeight(priority: DetectionJob['priority']): number {
    switch (priority) {
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  /**
   * Clean up old completed/failed jobs
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000) { // 24 hours default
    const cutoff = new Date(Date.now() - maxAge);
    const jobsToDelete: string[] = [];

    for (const [jobId, job] of this.jobs.entries()) {
      if ((job.status === 'completed' || job.status === 'failed') && job.processedAt && job.processedAt < cutoff) {
        jobsToDelete.push(jobId);
      }
    }

    jobsToDelete.forEach(jobId => this.jobs.delete(jobId));

    if (jobsToDelete.length > 0) {
      console.log(`Cleaned up ${jobsToDelete.length} old jobs`);
    }
  }

  /**
   * Stop the job processor
   */
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

// Global queue instance
export const globalDetectionQueue = new DetectionJobQueue();

// Cleanup old jobs every hour
setInterval(() => {
  globalDetectionQueue.cleanup();
}, 60 * 60 * 1000);
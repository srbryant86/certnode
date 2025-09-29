/**
 * Queue factory that switches between in-memory and Redis implementations
 * based on environment configuration
 */

import { DetectionJobQueue as InMemoryQueue } from './detection-jobs';
import { RedisDetectionQueue, createDetectionQueue } from './redis-detection-queue';

export interface IDetectionQueue {
  addJob(job: any): Promise<string>;
  getJob(jobId: string): Promise<any>;
  getMetrics(): Promise<any> | any;
}

class QueueAdapter implements IDetectionQueue {
  private queue: InMemoryQueue | RedisDetectionQueue;
  private isRedis: boolean;

  constructor() {
    // Determine which queue implementation to use
    this.isRedis = process.env.NODE_ENV === 'production' ||
                   process.env.USE_REDIS_QUEUE === 'true' ||
                   Boolean(process.env.REDIS_HOST || process.env.REDIS_URL);

    if (this.isRedis) {
      try {
        this.queue = createDetectionQueue();
        console.log('Initialized Redis-backed detection queue');
      } catch (error) {
        console.warn('Failed to initialize Redis queue, falling back to in-memory:', error);
        this.queue = new InMemoryQueue();
        this.isRedis = false;
      }
    } else {
      this.queue = new InMemoryQueue();
      console.log('Initialized in-memory detection queue');
    }
  }

  async addJob(job: any): Promise<string> {
    return await this.queue.addJob(job);
  }

  async getJob(jobId: string): Promise<any> {
    return await this.queue.getJob(jobId);
  }

  async getMetrics(): Promise<any> | any {
    if (this.isRedis) {
      return await (this.queue as RedisDetectionQueue).getMetrics();
    } else {
      return (this.queue as InMemoryQueue).getMetrics();
    }
  }

  /**
   * Health check for the queue system
   */
  async healthCheck(): Promise<{ healthy: boolean; type: string; error?: string }> {
    try {
      if (this.isRedis && 'healthCheck' in this.queue) {
        const result = await (this.queue as RedisDetectionQueue).healthCheck();
        return { ...result, type: 'redis' };
      } else {
        // In-memory queue is always healthy if it exists
        return { healthy: true, type: 'memory' };
      }
    } catch (error) {
      return {
        healthy: false,
        type: this.isRedis ? 'redis' : 'memory',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.isRedis && 'shutdown' in this.queue) {
      await (this.queue as RedisDetectionQueue).shutdown();
    } else {
      // Stop in-memory queue
      (this.queue as InMemoryQueue).stop();
    }
  }
}

// Export singleton instance
export const detectionQueue = new QueueAdapter();

// Export types for external use
export type { DetectionJob, QueueMetrics } from './redis-detection-queue';
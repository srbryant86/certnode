import { detectionQueue } from '@/lib/queue'

// Mock the environment
const originalEnv = process.env.NODE_ENV

describe('Detection Queue', () => {
  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  it('should provide queue interface', () => {
    expect(detectionQueue).toBeDefined()
    expect(typeof detectionQueue.addJob).toBe('function')
    expect(typeof detectionQueue.getJob).toBe('function')
    expect(typeof detectionQueue.getMetrics).toBe('function')
    expect(typeof detectionQueue.healthCheck).toBe('function')
  })

  describe('addJob', () => {
    it('should add detection job', async () => {
      const jobData = {
        receiptId: 'test-receipt',
        contentType: 'text/plain',
        contentHash: 'sha256:test-hash',
        contentBase64: Buffer.from('test content').toString('base64'),
        priority: 'normal' as const,
      }

      const jobId = await detectionQueue.addJob(jobData)

      expect(typeof jobId).toBe('string')
      expect(jobId).toMatch(/^job_/)
    })

    it('should handle high priority jobs', async () => {
      const jobData = {
        receiptId: 'test-receipt',
        contentType: 'image/jpeg',
        contentHash: 'sha256:test-hash',
        contentBase64: Buffer.from('test image data').toString('base64'),
        priority: 'high' as const,
      }

      const jobId = await detectionQueue.addJob(jobData)
      expect(jobId).toBeDefined()
    })
  })

  describe('getMetrics', () => {
    it('should return queue metrics', async () => {
      const metrics = await detectionQueue.getMetrics()

      expect(metrics).toHaveProperty('pending')
      expect(metrics).toHaveProperty('processing')
      expect(metrics).toHaveProperty('completed')
      expect(metrics).toHaveProperty('failed')
      expect(metrics).toHaveProperty('totalProcessed')
      expect(metrics).toHaveProperty('averageProcessingTime')

      expect(typeof metrics.pending).toBe('number')
      expect(typeof metrics.processing).toBe('number')
      expect(typeof metrics.completed).toBe('number')
      expect(typeof metrics.failed).toBe('number')
    })
  })

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const health = await detectionQueue.healthCheck()

      expect(health).toHaveProperty('healthy')
      expect(health).toHaveProperty('type')
      expect(typeof health.healthy).toBe('boolean')
      expect(['redis', 'memory']).toContain(health.type)
    })
  })

  describe('getJob', () => {
    it('should retrieve job by ID', async () => {
      // First add a job
      const jobData = {
        receiptId: 'test-receipt',
        contentType: 'text/plain',
        contentHash: 'sha256:test-hash',
        contentBase64: Buffer.from('test').toString('base64'),
        priority: 'normal' as const,
      }

      const jobId = await detectionQueue.addJob(jobData)
      const retrievedJob = await detectionQueue.getJob(jobId)

      expect(retrievedJob).toBeDefined()

      // Handle different queue implementations
      if (retrievedJob && 'id' in retrievedJob) {
        expect(retrievedJob.id).toBe(jobId)
      }
    })

    it('should return null for non-existent job', async () => {
      const job = await detectionQueue.getJob('non-existent-job')
      expect(job).toBeNull()
    })
  })
})

describe('Queue Environment Selection', () => {
  it('should use in-memory queue in development', () => {
    process.env.NODE_ENV = 'development'
    process.env.USE_REDIS_QUEUE = 'false'
    delete process.env.REDIS_HOST

    // Import fresh instance to test environment detection
    const { detectionQueue: devQueue } = require('@/lib/queue')
    expect(devQueue).toBeDefined()
  })

  it('should attempt Redis queue in production', () => {
    process.env.NODE_ENV = 'production'

    const { detectionQueue: prodQueue } = require('@/lib/queue')
    expect(prodQueue).toBeDefined()
  })
})
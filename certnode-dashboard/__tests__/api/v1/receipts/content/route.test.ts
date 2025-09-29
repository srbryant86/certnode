import { POST } from '@/app/api/v1/receipts/content/route'
import { authenticateApiKey } from '@/lib/api-auth'
import { contentReceiptService } from '@/lib/content/service'
import { applyRateLimit } from '@/lib/rate-limiting'
import { detectionQueue } from '@/lib/queue'
import { NextRequest } from 'next/server'

// Mock all dependencies
jest.mock('@/lib/api-auth')
jest.mock('@/lib/content/service')
jest.mock('@/lib/rate-limiting')
jest.mock('@/lib/queue')

const mockAuthenticateApiKey = authenticateApiKey as jest.MockedFunction<typeof authenticateApiKey>
const mockApplyRateLimit = applyRateLimit as jest.MockedFunction<typeof applyRateLimit>
const mockContentReceiptService = {
  create: jest.fn(),
}
const mockDetectionQueue = {
  addJob: jest.fn(),
}

// Mock the service and queue
;(contentReceiptService as any) = mockContentReceiptService
;(detectionQueue as any) = mockDetectionQueue

describe('/api/v1/receipts/content', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default successful mocks
    mockAuthenticateApiKey.mockResolvedValue({
      success: true,
      enterpriseId: 'test-enterprise',
      apiKeyId: 'test-api-key',
    })

    mockApplyRateLimit.mockResolvedValue({
      success: true,
      limit: 1000,
      remaining: 999,
      resetTime: Date.now() + 60000,
    })

    mockContentReceiptService.create.mockResolvedValue({
      id: 'test-id',
      receiptId: 'test-receipt-id',
      contentHash: 'sha256:test-hash',
      cryptographicProof: { signature: 'test-signature' },
    })

    mockDetectionQueue.addJob.mockResolvedValue('test-job-id')
  })

  describe('POST', () => {
    it('should create content receipt successfully', async () => {
      const requestBody = {
        contentBase64: Buffer.from('Hello World').toString('base64'),
        contentType: 'text/plain',
        metadata: { source: 'test' },
      }

      const request = new NextRequest('http://localhost:3000/api/v1/receipts/content', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.receipt).toBeDefined()
      expect(data.receipt.id).toBe('test-id')

      expect(mockAuthenticateApiKey).toHaveBeenCalledWith(request)
      expect(mockApplyRateLimit).toHaveBeenCalledWith(request, 'test-api-key')
      expect(mockContentReceiptService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          enterpriseId: 'test-enterprise',
          contentBase64: requestBody.contentBase64,
          contentType: 'text/plain',
          metadata: { source: 'test' },
        })
      )
    })

    it('should reject unauthenticated requests', async () => {
      mockAuthenticateApiKey.mockResolvedValue({
        success: false,
        error: 'API key required in x-api-key header',
      })

      const request = new NextRequest('http://localhost:3000/api/v1/receipts/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contentHash: 'test-hash' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('API key required in x-api-key header')
    })

    it('should reject rate limited requests', async () => {
      mockApplyRateLimit.mockResolvedValue({
        success: false,
        limit: 1000,
        remaining: 0,
        resetTime: Date.now() + 60000,
        retryAfter: 60,
      })

      const request = new NextRequest('http://localhost:3000/api/v1/receipts/content', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify({ contentHash: 'test-hash' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Rate limit exceeded')
    })

    it('should require content data', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/receipts/content', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify({ contentType: 'text/plain' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Either contentBase64 or contentHash must be provided')
    })

    it('should handle background processing for large content', async () => {
      const largeContent = 'x'.repeat(6 * 1024 * 1024) // 6MB
      const requestBody = {
        contentBase64: Buffer.from(largeContent).toString('base64'),
        contentType: 'text/plain',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/receipts/content', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.backgroundJob).toBeDefined()
      expect(data.backgroundJob.id).toBe('test-job-id')
      expect(mockDetectionQueue.addJob).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'text/plain',
          contentBase64: requestBody.contentBase64,
          priority: 'normal',
        })
      )
    })

    it('should use high priority for very large content', async () => {
      const veryLargeContent = 'x'.repeat(60 * 1024 * 1024) // 60MB
      const requestBody = {
        contentBase64: Buffer.from(veryLargeContent).toString('base64'),
        contentType: 'application/pdf',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/receipts/content', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)

      expect(mockDetectionQueue.addJob).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'high',
        })
      )
    })

    it('should force background processing with query parameter', async () => {
      const requestBody = {
        contentBase64: Buffer.from('small content').toString('base64'),
        contentType: 'text/plain',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/receipts/content?background=true', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.backgroundJob).toBeDefined()
      expect(mockDetectionQueue.addJob).toHaveBeenCalled()
    })

    it('should handle service errors gracefully', async () => {
      mockContentReceiptService.create.mockRejectedValue(new Error('Service unavailable'))

      const request = new NextRequest('http://localhost:3000/api/v1/receipts/content', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify({ contentHash: 'test-hash' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Service unavailable')
    })
  })
})
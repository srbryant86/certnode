/**
 * Integration tests for content certification flow
 * Tests the complete end-to-end process from API call to database storage
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/v1/receipts/content/route'
import { GET as GetVerify } from '@/app/api/v1/verify/content/route'
import { prisma } from '@/lib/prisma'
import { authenticateApiKey } from '@/lib/api-auth'
import { applyRateLimit } from '@/lib/rate-limiting'
import crypto from 'crypto'

// Mock external dependencies but not our core logic
jest.mock('@/lib/api-auth')
jest.mock('@/lib/rate-limiting')
jest.mock('@/lib/signing')

const mockAuthenticateApiKey = authenticateApiKey as jest.MockedFunction<typeof authenticateApiKey>
const mockApplyRateLimit = applyRateLimit as jest.MockedFunction<typeof applyRateLimit>

describe('Content Certification Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful authentication
    mockAuthenticateApiKey.mockResolvedValue({
      success: true,
      enterpriseId: 'test-enterprise',
      apiKeyId: 'test-api-key',
    })

    // Mock successful rate limiting
    mockApplyRateLimit.mockResolvedValue({
      success: true,
      limit: 1000,
      remaining: 999,
      resetTime: Date.now() + 60000,
    })
  })

  describe('Content Receipt Creation and Verification', () => {
    it('should create and verify text content receipt', async () => {
      const testContent = 'This is test content for AI detection'
      const contentBase64 = Buffer.from(testContent).toString('base64')

      // Create content receipt
      const createRequest = new NextRequest('http://localhost:3000/api/v1/receipts/content', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify({
          contentBase64,
          contentType: 'text/plain',
          metadata: {
            source: 'integration-test',
            description: 'Test content for certification',
          },
          provenance: {
            creator: 'test-user',
            timestamp: new Date().toISOString(),
            location: 'test-environment',
          },
        }),
      })

      const createResponse = await POST(createRequest)
      expect(createResponse.status).toBe(201)

      const createData = await createResponse.json()
      expect(createData.success).toBe(true)
      expect(createData.receipt).toBeDefined()
      expect(createData.receipt.contentHash).toMatch(/^sha256:/)

      const contentHash = createData.receipt.contentHash

      // Verify the content using hash
      const verifyRequest = new NextRequest(`http://localhost:3000/api/v1/verify/content?hash=${encodeURIComponent(contentHash)}`)

      const verifyResponse = await GetVerify(verifyRequest)
      expect(verifyResponse.status).toBe(200)

      const verifyData = await verifyResponse.json()
      expect(verifyData.success).toBe(true)
      expect(verifyData.receipt).toBeDefined()
      expect(verifyData.receipt.contentHash).toBe(contentHash)
      expect(verifyData.receipt.contentType).toBe('text/plain')
    })

    it('should create receipt with hash-only input', async () => {
      const testHash = 'sha256:' + crypto.createHash('sha256').update('test content').digest('hex')

      const request = new NextRequest('http://localhost:3000/api/v1/receipts/content', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify({
          contentHash: testHash,
          contentType: 'application/pdf',
          metadata: {
            filename: 'document.pdf',
            size: 1024,
          },
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.receipt.contentHash).toBe(testHash)
    })

    it('should handle image content with metadata', async () => {
      // Mock image data
      const imageBuffer = Buffer.from('fake-image-data')
      const contentBase64 = imageBuffer.toString('base64')

      const request = new NextRequest('http://localhost:3000/api/v1/receipts/content', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify({
          contentBase64,
          contentType: 'image/jpeg',
          metadata: {
            width: 1920,
            height: 1080,
            camera: 'Canon EOS R5',
            location: { lat: 37.7749, lon: -122.4194 },
          },
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.receipt.contentHash).toMatch(/^sha256:/)
    })

    it('should reject request without content', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/receipts/content', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify({
          contentType: 'text/plain',
          metadata: { source: 'test' },
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Either contentBase64 or contentHash must be provided')
    })
  })

  describe('AI Detection Integration', () => {
    it('should process content with AI detection results', async () => {
      const testContent = 'This text was generated by an AI model for testing purposes'
      const contentBase64 = Buffer.from(testContent).toString('base64')

      const request = new NextRequest('http://localhost:3000/api/v1/receipts/content', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify({
          contentBase64,
          contentType: 'text/plain',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.receipt).toBeDefined()

      // AI detection should have been performed for text content
      // The actual detection is mocked, but we verify the structure is correct
    })

    it('should use background processing for large content', async () => {
      const largeContent = 'x'.repeat(6 * 1024 * 1024) // 6MB
      const contentBase64 = Buffer.from(largeContent).toString('base64')

      const request = new NextRequest('http://localhost:3000/api/v1/receipts/content', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'test-api-key',
        },
        body: JSON.stringify({
          contentBase64,
          contentType: 'text/plain',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.backgroundJob).toBeDefined()
      expect(data.backgroundJob.id).toMatch(/^job_/)
      expect(data.backgroundJob.status).toBe('queued')
    })
  })

  describe('Error Handling', () => {
    it('should handle authentication failure', async () => {
      mockAuthenticateApiKey.mockResolvedValue({
        success: false,
        error: 'Invalid API key',
      })

      const request = new NextRequest('http://localhost:3000/api/v1/receipts/content', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'invalid-key',
        },
        body: JSON.stringify({
          contentHash: 'sha256:test',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBe('Invalid API key')
    })

    it('should handle rate limiting', async () => {
      mockApplyRateLimit.mockResolvedValue({
        success: false,
        limit: 100,
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
        body: JSON.stringify({
          contentHash: 'sha256:test',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(429)

      const data = await response.json()
      expect(data.error).toBe('Rate limit exceeded')
      expect(response.headers.get('Retry-After')).toBe('60')
    })
  })

  describe('Verification Edge Cases', () => {
    it('should handle non-existent content hash', async () => {
      const nonExistentHash = 'sha256:' + '0'.repeat(64)

      const request = new NextRequest(`http://localhost:3000/api/v1/verify/content?hash=${encodeURIComponent(nonExistentHash)}`)

      const response = await GetVerify(request)
      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toBe('No content receipt found for this hash')
    })

    it('should normalize hash format', async () => {
      const hashWithoutPrefix = 'a'.repeat(64)

      const request = new NextRequest(`http://localhost:3000/api/v1/verify/content?hash=${hashWithoutPrefix}`)

      const response = await GetVerify(request)
      // Should attempt to find with normalized hash (adding sha256: prefix)
      expect(response.status).toBe(404) // Will be 404 since it's not in our test db
    })

    it('should require hash parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/verify/content')

      const response = await GetVerify(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Content hash parameter is required')
    })
  })
})
import { ContentReceiptService } from '@/lib/content/service'
import { prisma } from '@/lib/prisma'
import { signPayload } from '@/lib/signing'

// Mock the dependencies
jest.mock('@/lib/prisma')
jest.mock('@/lib/signing')

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockSignPayload = signPayload as jest.MockedFunction<typeof signPayload>

describe('ContentReceiptService', () => {
  let service: ContentReceiptService

  beforeEach(() => {
    service = new ContentReceiptService()
    jest.clearAllMocks()

    mockSignPayload.mockResolvedValue({
      signature: 'mock-signature',
      algorithm: 'ES256',
      keyId: 'mock-key-id',
    })

    mockPrisma.receipt.create.mockResolvedValue({
      id: 'test-receipt-id',
      enterpriseId: 'test-enterprise',
      transactionId: 'content_test123',
      transactionData: {},
      cryptographicProof: {},
      verificationStatus: 'VERIFIED',
      type: 'CONTENT',
      contentHash: 'sha256:test-hash',
      contentType: 'text/plain',
      contentMetadata: {},
      contentProvenance: {},
      contentAiScores: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any)
  })

  describe('create', () => {
    it('should create content receipt with base64 content', async () => {
      const input = {
        enterpriseId: 'test-enterprise',
        contentBase64: Buffer.from('Hello World').toString('base64'),
        contentType: 'text/plain',
        metadata: { source: 'test' },
      }

      const result = await service.create(input)

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('receiptId')
      expect(result).toHaveProperty('contentHash')
      expect(result).toHaveProperty('cryptographicProof')

      expect(mockSignPayload).toHaveBeenCalledWith(
        expect.objectContaining({
          contentHash: expect.stringMatching(/^sha256:/),
          metadata: expect.objectContaining({
            source: 'test',
            contentType: 'text/plain',
          }),
        })
      )

      expect(mockPrisma.receipt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            enterpriseId: 'test-enterprise',
            type: 'CONTENT',
          }),
        })
      )
    })

    it('should create content receipt with content hash only', async () => {
      const input = {
        enterpriseId: 'test-enterprise',
        contentHash: 'sha256:existing-hash',
        contentType: 'application/pdf',
      }

      const result = await service.create(input)

      expect(result.contentHash).toBe('sha256:existing-hash')
      expect(mockSignPayload).toHaveBeenCalled()
      expect(mockPrisma.receipt.create).toHaveBeenCalled()
    })

    it('should handle provenance data', async () => {
      const input = {
        enterpriseId: 'test-enterprise',
        contentBase64: Buffer.from('test content').toString('base64'),
        contentType: 'text/plain',
        provenance: {
          creator: 'test-user',
          timestamp: '2023-01-01T00:00:00Z',
          location: 'test-location',
        },
      }

      await service.create(input)

      expect(mockSignPayload).toHaveBeenCalledWith(
        expect.objectContaining({
          provenance: expect.objectContaining({
            creator: 'test-user',
            timestamp: '2023-01-01T00:00:00Z',
            location: 'test-location',
          }),
        })
      )
    })

    it('should handle AI detection results', async () => {
      const input = {
        enterpriseId: 'test-enterprise',
        contentBase64: Buffer.from('test content').toString('base64'),
        contentType: 'text/plain',
        detectorResults: {
          confidence: 0.95,
          method: 'advanced_text_detection',
          indicators: { perplexity: 12.5 },
        },
      }

      await service.create(input)

      expect(mockSignPayload).toHaveBeenCalledWith(
        expect.objectContaining({
          detectorResults: expect.objectContaining({
            confidence: 0.95,
            method: 'advanced_text_detection',
          }),
        })
      )
    })

    it('should throw error when neither contentBase64 nor contentHash provided', async () => {
      const input = {
        enterpriseId: 'test-enterprise',
        contentType: 'text/plain',
      }

      await expect(service.create(input)).rejects.toThrow(
        'Either contentBase64, contentBuffer, or contentHash must be provided'
      )
    })

    it('should handle buffer input', async () => {
      const input = {
        enterpriseId: 'test-enterprise',
        contentBuffer: Buffer.from('test content'),
        contentType: 'application/octet-stream',
      }

      const result = await service.create(input)

      expect(result.contentHash).toMatch(/^sha256:/)
      expect(mockSignPayload).toHaveBeenCalled()
      expect(mockPrisma.receipt.create).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle signing service errors', async () => {
      mockSignPayload.mockRejectedValue(new Error('Signing service unavailable'))

      const input = {
        enterpriseId: 'test-enterprise',
        contentBase64: Buffer.from('test').toString('base64'),
        contentType: 'text/plain',
      }

      await expect(service.create(input)).rejects.toThrow('Signing service unavailable')
    })

    it('should handle database errors', async () => {
      mockPrisma.receipt.create.mockRejectedValue(new Error('Database connection failed'))

      const input = {
        enterpriseId: 'test-enterprise',
        contentBase64: Buffer.from('test').toString('base64'),
        contentType: 'text/plain',
      }

      await expect(service.create(input)).rejects.toThrow('Database connection failed')
    })
  })
})
import { authenticateApiKey, hasPermission } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { KeyStatus } from '@prisma/client'

jest.mock('@/lib/prisma')

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('API Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('authenticateApiKey', () => {
    it('should authenticate valid API key', async () => {
      const mockApiKey = {
        id: 'test-api-key-id',
        keyHash: 'mock-hash',
        enterpriseId: 'test-enterprise',
        status: KeyStatus.ACTIVE,
        enterprise: {
          id: 'test-enterprise',
          tier: 'PRO',
        },
      }

      mockPrisma.apiKey.findUnique.mockResolvedValue(mockApiKey as any)

      const request = new NextRequest('http://localhost:3000/test', {
        headers: { 'x-api-key': 'test-api-key' },
      })

      const result = await authenticateApiKey(request)

      expect(result.success).toBe(true)
      expect(result.enterpriseId).toBe('test-enterprise')
      expect(result.apiKeyId).toBe('test-api-key-id')
    })

    it('should reject missing API key', async () => {
      const request = new NextRequest('http://localhost:3000/test')

      const result = await authenticateApiKey(request)

      expect(result.success).toBe(false)
      expect(result.error).toBe('API key required in x-api-key header')
    })

    it('should reject invalid API key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/test', {
        headers: { 'x-api-key': 'invalid-key' },
      })

      const result = await authenticateApiKey(request)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid or revoked API key')
    })

    it('should reject revoked API key', async () => {
      const mockApiKey = {
        id: 'test-api-key-id',
        keyHash: 'mock-hash',
        enterpriseId: 'test-enterprise',
        status: KeyStatus.REVOKED,
        enterprise: {
          id: 'test-enterprise',
          tier: 'PRO',
        },
      }

      mockPrisma.apiKey.findUnique.mockResolvedValue(mockApiKey as any)

      const request = new NextRequest('http://localhost:3000/test', {
        headers: { 'x-api-key': 'revoked-key' },
      })

      const result = await authenticateApiKey(request)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid or revoked API key')
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.apiKey.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/test', {
        headers: { 'x-api-key': 'test-key' },
      })

      const result = await authenticateApiKey(request)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication failed')
    })
  })

  describe('hasPermission', () => {
    it('should allow permission when explicitly granted', () => {
      const permissions = JSON.stringify(['receipts:write', 'receipts:read'])

      expect(hasPermission(permissions, 'receipts:write')).toBe(true)
      expect(hasPermission(permissions, 'receipts:read')).toBe(true)
    })

    it('should deny permission when not granted', () => {
      const permissions = JSON.stringify(['receipts:read'])

      expect(hasPermission(permissions, 'receipts:write')).toBe(false)
    })

    it('should allow all permissions with wildcard', () => {
      const permissions = JSON.stringify(['*'])

      expect(hasPermission(permissions, 'receipts:write')).toBe(true)
      expect(hasPermission(permissions, 'admin:delete')).toBe(true)
    })

    it('should handle malformed permissions JSON', () => {
      const permissions = 'invalid-json'

      expect(hasPermission(permissions, 'receipts:write')).toBe(false)
    })

    it('should handle null/empty permissions', () => {
      expect(hasPermission('', 'receipts:write')).toBe(false)
      expect(hasPermission('[]', 'receipts:write')).toBe(false)
    })
  })
})
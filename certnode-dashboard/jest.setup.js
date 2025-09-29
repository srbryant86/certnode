import '@testing-library/jest-dom'

// Mock environment variables
process.env.DATABASE_URL = 'file:./test.db'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock Prisma
jest.mock('./lib/prisma', () => ({
  prisma: {
    receipt: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    apiKey: {
      findUnique: jest.fn(),
    },
    enterprise: {
      findUnique: jest.fn(),
    },
  },
}))

// Mock signing service
jest.mock('./lib/signing', () => ({
  signPayload: jest.fn().mockResolvedValue({
    signature: 'mock-signature',
    algorithm: 'ES256',
    keyId: 'mock-key-id',
  }),
}))

// Global test timeout
jest.setTimeout(10000)
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  // Enable standalone output for Docker
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Force cache invalidation for deployment
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },

  // Image optimization for production
  images: {
    unoptimized: process.env.NODE_ENV === 'production',
  },

  async redirects() {
    return [
      {
        source: '/pricing/high-ticket',
        destination: '/pricing/dispute-protection',
        permanent: false,
      },
    ]
  },

  // Health check API route
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health',
      },
    ]
  },
}

module.exports = nextConfig
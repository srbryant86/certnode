/** @type {import('next').NextConfig} */
const isVercelDeployment = Boolean(process.env.VERCEL);
const enableStandaloneBuild = process.env.ENABLE_STANDALONE_BUILD === 'true';

const nextConfig = {
  experimental: {
    typedRoutes: true,
  },

  // Only enable standalone output when explicitly requested to avoid dev/start warnings
  output: enableStandaloneBuild ? 'standalone' : undefined,

  // Assets are served from /nextjs-pricing prefix ONLY for multi-app routing (not Vercel)
  assetPrefix: isVercelDeployment ? undefined : '/nextjs-pricing',

  // Force cache invalidation for deployment pipelines
  generateBuildId: async () => {
    if (process.env.CI && process.env.CI_BUILD_ID) {
      return process.env.CI_BUILD_ID;
    }
    return 'build-' + Date.now().toString();
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
    ];
  },

  // Health check API route
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health',
      },
    ];
  },
};

module.exports = nextConfig;

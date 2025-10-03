const isVercel = Boolean(process.env.VERCEL);

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isVercel ? { assetPrefix: '/certnode-dashboard' } : {}),
  async rewrites() {
    if (!isVercel) {
      return [];
    }

    return [
      {
        source: '/certnode-dashboard/:path*',
        destination: '/:path*',
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

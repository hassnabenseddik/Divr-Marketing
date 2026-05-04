/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'customer-assets.emergentagent.com' },
    ],
  },
  // /api/* proxy:
  //   • Local dev → Uvicorn on http://localhost:8001
  //   • Production (Vercel) → set BACKEND_URL env var to your Render URL
  //     e.g. BACKEND_URL=https://divr-api.onrender.com
  // If BACKEND_URL is not set in production, the rewrite is skipped and the
  // browser can call the backend directly via NEXT_PUBLIC_BACKEND_URL.
  async rewrites() {
    const isProd = process.env.NODE_ENV === 'production';
    const target = process.env.BACKEND_URL || (isProd ? '' : 'http://localhost:8001');
    if (!target) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${target}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

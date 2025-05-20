/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_BACKEND_URL ? 
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*` : 
          'http://localhost:3001/api/:path*',
      }
    ];
  },
  // Enable the React 18 features
  experimental: {
    serverActions: true,
  }
};

module.exports = nextConfig;
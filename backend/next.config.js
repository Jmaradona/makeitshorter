/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['shared'],
  // Only allow API routes, disable pages & app directory for UI
  output: 'standalone',
  // Enable the React 18 features
  experimental: {
    serverActions: true,
  }
};

module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal configuration to avoid micromatch issues
  output: 'standalone',
  poweredByHeader: false,
  
  // Force all pages to be dynamic
  experimental: {
    staticPageGenerationTimeout: 1000,
  },
  
  // Environment variables
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  },
  
  // Disable problematic optimizations
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
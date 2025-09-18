/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal configuration to avoid micromatch issues
  output: 'standalone',
  poweredByHeader: false,
  
  // Completely disable static generation
  experimental: {
    // Disable static optimization
    staticPageGenerationTimeout: 1,
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
/** @type {import('next').NextConfig} */
const webpack = require('webpack')

const nextConfig = {
  // Production optimizations
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  
  // Fix workspace root warning
  outputFileTracingRoot: __dirname,
  
  // Next.js 15 compatible configuration
  experimental: {
    // Enable modern features
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // Turbopack configuration (replaces deprecated turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Build performance optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Optimize client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Fix server-side rendering issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "crypto": false,
      "stream": false,
      "util": false,
      "buffer": false,
    }
    
    // Define global variables for server-side rendering
    config.plugins.push(
      new webpack.DefinePlugin({
        'self': 'undefined',
        'window': 'undefined',
        'global': 'globalThis',
      })
    )
    
    return config
  },
  
  // Environment variables
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  },
  
  // Image optimization
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
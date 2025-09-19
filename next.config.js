/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  
  // Next.js 15 compatible configuration
  experimental: {
    // Enable modern features
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // Exclude test files from build
  outputFileTracingExcludes: {
    '*': ['./tests/**/*', './scripts/**/*'],
  },
  
  // Build performance optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side fallbacks
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
      }
    }
    
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
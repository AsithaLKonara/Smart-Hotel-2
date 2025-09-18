/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  
  // Force dynamic rendering to avoid static generation issues
  trailingSlash: false,
  
  // Image optimization
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Environment variables (only non-sensitive ones)
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  },
  
  // Webpack configuration for security
  webpack: (config, { dev, isServer }) => {
    // Remove console.log in production
    if (!dev && !isServer && config.optimization?.minimizer?.[0]?.options?.terserOptions) {
      config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true
    }
    
    // Security: Don't expose server-only modules to client
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    }
    
    return config
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig 
const fs = require('fs')
const path = require('path')
const http = require('http')


// Manually parse .env.local / .env to bypass Next.js's variable expansion on $ characters
try {
  const loadRawEnv = (fileName) => {
    const filePath = path.join(__dirname, fileName)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      const dbUrlMatch = content.match(/^DATABASE_URL=["']?([^"'\n]+)["']?/m)
      if (dbUrlMatch && dbUrlMatch[1]) {
        process.env.DATABASE_URL = dbUrlMatch[1]
      }
      const directUrlMatch = content.match(/^DIRECT_URL=["']?([^"'\n]+)["']?/m)
      if (directUrlMatch && directUrlMatch[1]) {
        process.env.DIRECT_URL = directUrlMatch[1]
      }
    }
  }
  loadRawEnv('.env')
  loadRawEnv('.env.local')
} catch (err) {
  console.error('Failed to programmatically inject database URL:', err.message)
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow local network IP for HMR
  allowedDevOrigins: ['192.168.1.149'],

  // Basic configuration
  poweredByHeader: false,
  productionBrowserSourceMaps: true,

  // Next.js 15 compatible configuration
  transpilePackages: ['lucide-react'],

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },

  // 1. Externalize server-only runtime packages
  // EXTREMELY IMPORTANT: DO NOT add @sentry/nextjs or @sentry/node here!
  // Doing so will crash the Vercel Edge Runtime (MIDDLEWARE_INVOCATION_FAILED)
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    'require-in-the-middle',
    'import-in-the-middle',
    'pdfkit',
    'fontkit',
  ],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Configure enterprise-grade security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://images.unsplash.com https://res.cloudinary.com https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://analytics.google.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://www.googletagmanager.com https://images.unsplash.com https://res.cloudinary.com https://www.google.com https://analytics.google.com; frame-src 'self' https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  }
}

module.exports = nextConfig
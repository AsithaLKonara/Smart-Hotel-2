/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration
  poweredByHeader: false,
  optimizeFonts: false,
  productionBrowserSourceMaps: true,
  
  // Next.js 15 compatible configuration
  transpilePackages: ['lucide-react', 'framer-motion'],
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },

  // 1. Externalize server-only runtime packages
  experimental: {
    serverComponentsExternalPackages: [
      '@prisma/client',
      'prisma',
      '@sentry/nextjs',
      '@sentry/node',
      '@opentelemetry/api',
      '@opentelemetry/sdk-node',
      '@opentelemetry/instrumentation',
      'require-in-the-middle',
      'import-in-the-middle',
    ],
  },

  // 2. Configure safe client Webpack fallbacks to avoid browser loading crashes
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        perf_hooks: false,
        async_hooks: false,
        crypto: false,
        path: false,
        os: false,
        http: false,
        https: false,
        stream: false,
        zlib: false,
      }
    }
    return config
  },
  
  // Configure enterprise-grade security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://images.unsplash.com https://res.cloudinary.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.stripe.com; frame-src 'self' https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
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
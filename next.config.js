/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  
  // Next.js 15 compatible configuration
  experimental: {
    // Enable modern features
    optimizePackageImports: [
      'lucide-react', 
      'framer-motion',
      '@radix-ui/react-slot',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-toast',
      'class-variance-authority',
      'clsx',
      'tailwind-merge'
    ],
    // Optimize CSS
    optimizeCss: true,
  },
  
  // Exclude test files and unnecessary files from build
  outputFileTracingExcludes: {
    '*': [
      './tests/**/*', 
      './scripts/**/*',
      './docs/**/*',
      './*.md',
      './.git/**/*',
      './node_modules/.cache/**/*'
    ],
  },
  
  // Specify the correct workspace root
  outputFileTracingRoot: __dirname,
  
  // Build performance optimizations
  webpack: (config) => {
    return config
  },
  
  // Environment variables
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  },
  
  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'i.vimeocdn.com' },
      { protocol: 'https', hostname: 'smarthotel-demo-7lyfxphkz-asithalkonaras-projects.vercel.app' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Headers for performance and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com https://www.google-analytics.com;",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
              "img-src 'self' data: https: images.unsplash.com res.cloudinary.com i.vimeocdn.com;",
              "font-src 'self' data: https://fonts.gstatic.com;",
              "connect-src 'self' https://js.stripe.com https://checkout.stripe.com https://www.google-analytics.com https://www.googletagmanager.com;",
              "frame-src https://checkout.stripe.com https://player.vimeo.com;",
              "media-src 'self' https://player.vimeo.com https://vimeo.com https://i.vimeocdn.com;",
              "object-src 'none';",
              "base-uri 'self';",
              "form-action 'self';",
              "frame-ancestors 'none';",
              'upgrade-insecure-requests;'
            ].join(' ')
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60, stale-while-revalidate=300'
          },
        ],
      },
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'image/jpeg'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400'
          },
        ],
      },
    ]
  },
  
  // TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Sentry configuration (only active when @sentry/nextjs is installed)
  // Uncomment and configure when Sentry is installed:
  // sentry: {
  //   hideSourceMaps: true,
  //   widenClientFileUpload: true,
  //   transpileClientSDK: true,
  //   tunnelRoute: '/monitoring',
  //   disableLogger: true,
  //   automaticVercelMonitors: true,
  // },
  
}

module.exports = nextConfig
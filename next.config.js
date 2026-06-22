const fs = require('fs')
const path = require('path')
const http = require('http')

// Mitigate Next.js WebSocket SSRF (CVE-2026-44578) globally
try {
  const originalOn = http.Server.prototype.on
  const patchUpgrade = function (event, listener) {
    if (event === 'upgrade') {
      return originalOn.call(this, event, function (req, socket, head) {
        console.warn(`[SECURITY WARNING] Intercepted and blocked WebSocket upgrade attempt to: ${req.url}`)
        socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Type: text/plain\r\nContent-Length: 32\r\n\r\nWebSocket upgrades not allowed\n')
        socket.destroy()
      })
    }
    return originalOn.apply(this, arguments)
  }
  http.Server.prototype.on = patchUpgrade
  http.Server.prototype.addListener = patchUpgrade

  // Active Handles Scanner: Since Next.js registers the 'upgrade' event before parsing next.config.js,
  // we scan active handles to find the running HTTP server and override its listeners.
  const scanAndPatchActiveServers = () => {
    if (typeof process._getActiveHandles !== 'function') return
    const handles = process._getActiveHandles()
    for (const handle of handles) {
      if (
        handle &&
        (handle instanceof http.Server ||
         handle.constructor?.name === 'Server' ||
         (typeof handle.listen === 'function' && typeof handle.addListener === 'function'))
      ) {
        // Only patch if we haven't patched this server already
        if (!handle.__webSocketFirewallApplied) {
          handle.__webSocketFirewallApplied = true
          handle.removeAllListeners('upgrade')
          handle.on('upgrade', function (req, socket, head) {
            console.warn(`[SECURITY WARNING] Intercepted and blocked WebSocket upgrade attempt via handle to: ${req.url}`)
            socket.write('HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Type: text/plain\r\nContent-Length: 32\r\n\r\nWebSocket upgrades not allowed\n')
            socket.destroy()
          })
          console.log(`🛡️ WebSocket SSRF Firewall patched active server instance listening on port ${handle.address()?.port || 'unknown'}.`)
        }
      }
    }
  }

  // Scan immediately
  scanAndPatchActiveServers()
  // Scan periodically for the first 5 seconds to ensure we catch any deferred servers
  const scanInterval = setInterval(scanAndPatchActiveServers, 500)
  setTimeout(() => clearInterval(scanInterval), 5000)

  console.log('🛡️ WebSocket SSRF Firewall patch applied to next.config.js successfully.')
} catch (err) {
  console.error('Failed to apply WebSocket SSRF Firewall patch:', err.message)
}

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
    optimizePackageImports: ['lucide-react', 'framer-motion'],
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

  // Configure enterprise-grade security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://images.unsplash.com https://res.cloudinary.com https://www.googletagmanager.com https://www.google-analytics.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.stripe.com https://www.google-analytics.com; frame-src 'self' https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
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
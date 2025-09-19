import { NextRequest, NextResponse } from 'next/server'
import { enhancedRateLimit, createEnhancedRateLimitResponse } from '@/lib/rate-limit-enhanced'

// Generate nonce for CSP
function generateNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64')
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Generate nonce for this request
  const nonce = generateNonce()
  
  // Set secure headers
  const headers = {
    // Content Security Policy (relaxed for development)
    'Content-Security-Policy': process.env.NODE_ENV === 'production' ? [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'nonce-" + nonce + "' https://js.stripe.com https://checkout.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://checkout.stripe.com",
      "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join('; ') : [
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: 'sha256-kPx0AsF0oz2kKiZ875xSvv693TBHkQ/0SkMJZnnNpnQ='",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https: ws: wss:",
      "font-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    
    // Security headers
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    
    // HSTS (only in production)
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }),
    
    // Cache control for sensitive endpoints
    'Cache-Control': request.nextUrl.pathname.startsWith('/api/') ? 
      'no-store, no-cache, must-revalidate' : 
      'public, max-age=31536000, immutable'
  }

  // Apply headers
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Add nonce to request headers for use in pages
  response.headers.set('x-nonce', nonce)

  // Rate limiting temporarily disabled for testing
  // if (request.nextUrl.pathname.startsWith('/api/')) {
  //   let rateLimitType: 'auth' | 'booking' | 'api' | 'payment' = 'api'
  //   
  //   // Determine rate limit type based on endpoint
  //   if (request.nextUrl.pathname.includes('/auth/')) {
  //     rateLimitType = 'auth'
  //   } else if (request.nextUrl.pathname.includes('/bookings/') || 
  //              request.nextUrl.pathname.includes('/restaurant/orders')) {
  //     rateLimitType = 'booking'
  //   } else if (request.nextUrl.pathname.includes('/webhooks/stripe')) {
  //     rateLimitType = 'payment'
  //   }

  //   const rateLimitResult = enhancedRateLimit(request, rateLimitType)
  //   
  //   if (!rateLimitResult.allowed) {
  //     return createEnhancedRateLimitResponse(rateLimitResult)
  //   }

  //   // Add rate limit headers to successful responses
  //   response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
  //   response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
  // }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}


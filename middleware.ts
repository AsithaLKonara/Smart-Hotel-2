import { NextRequest, NextResponse } from 'next/server'
import { applyChaosDelay } from './lib/chaos'

// Fast, Edge-compatible request ID generator
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const path = url.pathname

  // Intercept all API endpoints
  if (!path.startsWith('/api')) {
    return NextResponse.next()
  }

  // Inject chaos latency if simulated by SRE controls
  await applyChaosDelay()

  // 1. Capture or generate unique correlation request ID
  const incomingRequestId = request.headers.get('x-request-id')
  const requestId = incomingRequestId || generateRequestId()

  // 2. Capture request start time
  const startTime = Date.now()

  // Clone headers and inject correlation ID + start time
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-request-id', requestId)
  requestHeaders.set('x-request-start', startTime.toString())

  // Create response passing down modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Propagate correlation ID to the client
  response.headers.set('X-Request-ID', requestId)

  // Calculate middleware passage latency
  const duration = Date.now() - startTime

  // Get user role/id if present in headers or session cookie
  const userId = request.headers.get('x-user-id') || 'anonymous'
  
  // Clean query string from logging path to avoid sensitive query parameters leakage
  const cleanPath = path.split('?')[0]

  // Output Edge-compatible flat JSON structured log for log aggregators
  console.log(
    JSON.stringify({
      level: 'info',
      message: `API Request: ${request.method} ${cleanPath}`,
      timestamp: new Date().toISOString(),
      requestId,
      userId,
      method: request.method,
      path: cleanPath,
      statusCode: response.status || 200,
      latency: duration,
      source: 'middleware',
    })
  )

  return response
}

// Ensure middleware only runs on API routes for performance optimization
export const config = {
  matcher: ['/api/:path*'],
}

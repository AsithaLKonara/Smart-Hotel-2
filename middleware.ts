import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { applyChaosDelay } from './lib/chaos'

// Centralized Authorization Matrix
const AUTH_MATRIX = [
  { path: '/api/admin/staff', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { path: '/api/admin/settings', roles: ['SUPER_ADMIN'] },
  { path: '/api/admin/receptionist', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'] },
  { path: '/api/admin/housekeeping', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'STAFF'] },
  { path: '/api/admin/kitchen', roles: ['SUPER_ADMIN', 'MANAGER', 'KITCHEN_STAFF', 'STAFF'] },
  { path: '/api/admin/executive', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { path: '/api/rooms', methods: ['POST', 'PATCH', 'DELETE'], roles: ['SUPER_ADMIN', 'MANAGER'] },
  { path: '/api/bookings', methods: ['PATCH', 'DELETE'], roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'] },
  { path: '/api/audit-logs', roles: ['SUPER_ADMIN', 'MANAGER'] },
]

function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const path = url.pathname

  if (!path.startsWith('/api')) {
    return NextResponse.next()
  }

  // Chaos engine removed for production stability
  // await applyChaosDelay()

  const requestId = request.headers.get('x-request-id') || generateRequestId()
  const startTime = Date.now()

  // 1. Resolve Session at the Edge
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // 2. RBAC Enforcement Logic
  const rule = AUTH_MATRIX.find(r => 
    path.startsWith(r.path) && 
    (!r.methods || r.methods.includes(request.method))
  )

  if (rule) {
    if (!token) {
      console.warn(`[SECURITY] Unauthenticated access attempt to protected route: ${path}`)
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = token.role as string
    if (!rule.roles.includes(userRole)) {
      console.error(`[SECURITY] Unauthorized access attempt: User ${token.id} [${userRole}] -> ${path}`)
      return NextResponse.json({ 
        error: 'Forbidden', 
        message: `Role [${userRole}] does not have permission to access this resource.` 
      }, { status: 403 })
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-request-id', requestId)
  requestHeaders.set('x-request-start', startTime.toString())
  if (token?.id) requestHeaders.set('x-user-id', token.id as string)

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.headers.set('X-Request-ID', requestId)
  const duration = Date.now() - startTime

  const cleanPath = path.split('?')[0]
  console.log(
    JSON.stringify({
      level: 'info',
      message: `API Request: ${request.method} ${cleanPath}`,
      timestamp: new Date().toISOString(),
      requestId,
      userId: token?.id || 'anonymous',
      role: token?.role || 'none',
      method: request.method,
      path: cleanPath,
      statusCode: response.status || 200,
      latency: duration,
      source: 'middleware-rbac',
    })
  )

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}

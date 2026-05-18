import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Centralized Route Protection Matrix
const PROTECTED_ROUTES = [
  { prefix: '/admin/settings', roles: ['SUPER_ADMIN'] },
  { prefix: '/admin/audit-logs', roles: ['SUPER_ADMIN'] },
  { prefix: '/admin/staff', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/api/staff', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/receptionist', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'] },
  { prefix: '/api/chaos', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/api/admin', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/tasks', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE'] },
  { prefix: '/api/tasks', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE'] },
  { prefix: '/admin/housekeeping', roles: ['SUPER_ADMIN', 'MANAGER', 'HOUSEKEEPING'] },
  { prefix: '/admin/bookings', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'] }, 
  { prefix: '/api/bookings', roles: ['GUEST', 'SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'] },
  { prefix: '/kitchen', roles: ['SUPER_ADMIN', 'MANAGER', 'KITCHEN'] },
  { prefix: '/api/kitchen', roles: ['SUPER_ADMIN', 'MANAGER', 'KITCHEN'] },
  { prefix: '/dashboard', roles: ['GUEST', 'SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/api/restaurant', roles: ['GUEST', 'SUPER_ADMIN', 'MANAGER', 'KITCHEN', 'RECEPTIONIST'] },
  { prefix: '/order', roles: ['GUEST', 'SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/dining', roles: ['GUEST', 'SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/profile', roles: ['GUEST', 'SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'KITCHEN', 'HOUSEKEEPING', 'MAINTENANCE'] },
  { prefix: '/my-bookings', roles: ['GUEST', 'SUPER_ADMIN', 'MANAGER'] },
]

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const path = url.pathname

  // 1. Bypass Public Assets & Public APIs
  if (
    path.startsWith('/_next') || 
    path.startsWith('/images') || 
    path.startsWith('/favicon') ||
    PUBLIC_API_PREFIXES.some(p => path.startsWith(p))
  ) {
    return NextResponse.next()
  }

  // 2. Resolve Session
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // 3. Enforce Authentication for ALL remaining /api routes (Default Deny)
  if (path.startsWith('/api') && !token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // 4. Identify applicable authorization rule
  const rule = PROTECTED_ROUTES.find(r => path.startsWith(r.prefix))

  if (rule) {
    // Check Authentication (for pages)
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }

    // Check Authorization
    const userRole = token.role as string
    if (!rule.roles.includes(userRole)) {
      const isApi = path.startsWith('/api')
      if (isApi) {
        return NextResponse.json({ 
          error: 'Forbidden', 
          message: `Role [${userRole}] does not have permission to access this resource.` 
        }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/kitchen/:path*',
    '/dashboard/:path*',
    '/api/:path*',
    '/profile',
    '/my-bookings',
  ],
}

// Routes that are explicitly PUBLIC and bypass middleware
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/health',
  '/api/webhooks',
  '/api/rooms',
  '/api/rooms/availability',
  '/api/rooms/check-availability',
  '/api/contact',
]

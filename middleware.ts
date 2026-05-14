import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Centralized Route Protection Matrix
const PROTECTED_ROUTES = [
  { prefix: '/admin/settings', roles: ['SUPER_ADMIN'] },
  { prefix: '/admin/audit-logs', roles: ['SUPER_ADMIN'] },
  { prefix: '/admin/staff', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/executive', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/receptionist', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'] },
  { prefix: '/admin/housekeeping', roles: ['SUPER_ADMIN', 'MANAGER', 'HOUSEKEEPING'] },
  { prefix: '/admin/manager', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/dashboard', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'] }, // Admin cockpit
  { prefix: '/kitchen', roles: ['SUPER_ADMIN', 'MANAGER', 'KITCHEN'] },
  { prefix: '/dashboard', roles: ['GUEST', 'SUPER_ADMIN', 'MANAGER'] }, // Guest dashboard
]

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const path = url.pathname

  // 1. Resolve Session
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // 2. Identify applicable protection rule
  const rule = PROTECTED_ROUTES.find(r => path.startsWith(r.prefix))

  if (rule) {
    // Check Authentication
    if (!token) {
      const isApi = path.startsWith('/api')
      if (isApi) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
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
      // Redirect to home if unauthorized for page
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
    '/api/admin/:path*',
    '/api/kitchen/:path*',
  ],
}

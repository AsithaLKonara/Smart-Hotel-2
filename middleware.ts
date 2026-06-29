import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Centralized Route Protection Matrix
const PROTECTED_ROUTES = [
  // 👑 SUPER ADMIN ONLY (SRE, Platform, Global)
  { prefix: '/admin/roles', roles: ['SUPER_ADMIN'] },
  { prefix: '/admin/audit-logs', roles: ['SUPER_ADMIN'] },
  { prefix: '/admin/corporate', roles: ['SUPER_ADMIN'] }, // Global properties, Loyalty
  { prefix: '/admin/settings/integrations', roles: ['SUPER_ADMIN'] },

  // 🔴 MANAGER & SUPER ADMIN (Business Operations, HR, Finance)
  { prefix: '/admin/dashboard', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/hr', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/procurement', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/analytics', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/manager', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/yield', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/events', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/crm/corporate', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/crm/travel-agents', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/ota', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/accounting/night-audit', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/admin/settings', roles: ['SUPER_ADMIN', 'MANAGER'] }, // General system settings

  // 🔵 RECEPTIONIST (Front Office, Reservations, Billing, CRM)
  { prefix: '/admin/receptionist', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'] },
  { prefix: '/admin/bookings', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'] },
  { prefix: '/admin/pos', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'] },
  { prefix: '/admin/accounting', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'] }, // Folios
  { prefix: '/admin/resort', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'] },
  { prefix: '/admin/crm', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'] }, // Guest CRM

  // 🧹 HOUSEKEEPING
  { prefix: '/admin/housekeeping', roles: ['SUPER_ADMIN', 'MANAGER', 'HOUSEKEEPING'] },

  // 🔧 MAINTENANCE
  { prefix: '/admin/maintenance', roles: ['SUPER_ADMIN', 'MANAGER', 'MAINTENANCE'] },

  // 🟠 KITCHEN
  { prefix: '/kitchen', roles: ['SUPER_ADMIN', 'MANAGER', 'KITCHEN'] },
  { prefix: '/api/kitchen', roles: ['SUPER_ADMIN', 'MANAGER', 'KITCHEN'] },

  // SHARED & APIs
  { prefix: '/admin/tasks', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE'] },
  { prefix: '/api/tasks', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE'] },
  { prefix: '/api/admin', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE'] },
  { prefix: '/api/admin/users', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/api/bookings', roles: ['GUEST', 'SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'KITCHEN'] },
  { prefix: '/api/restaurant', roles: ['GUEST', 'SUPER_ADMIN', 'MANAGER', 'KITCHEN', 'RECEPTIONIST'] },
  { prefix: '/api/portals/b2b', roles: ['SUPER_ADMIN', 'MANAGER'] },

  // 🟢 GUEST SUITE & FALLBACKS
  { prefix: '/dashboard', roles: ['GUEST', 'SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/order', roles: ['GUEST', 'SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/dining', roles: ['GUEST', 'SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/my-bookings', roles: ['GUEST', 'SUPER_ADMIN', 'MANAGER'] },
  { prefix: '/profile', roles: ['GUEST', 'SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'KITCHEN', 'HOUSEKEEPING', 'MAINTENANCE'] },

  // GENERIC ADMIN FALLBACK (Blocks GUESTS/KITCHEN from randomly probing /admin/*)
  { prefix: '/admin', roles: ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE'] },
]

export async function middleware(request: NextRequest) {
  // 0. Reject WebSocket upgrades to mitigate SSRF (CVE-2026-44578)
  const upgradeHeader = request.headers.get('upgrade')
  const connectionHeader = request.headers.get('connection')
  if (
    (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') ||
    (connectionHeader && connectionHeader.toLowerCase().includes('upgrade'))
  ) {
    return new NextResponse('WebSocket upgrades not allowed', { status: 400 })
  }

  const url = request.nextUrl
  const path = url.pathname

  // 0.5. CSRF Protection for state-changing internal Admin API requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && path.startsWith('/api/admin')) {
    const secFetchSite = request.headers.get('sec-fetch-site')
    if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'same-site') {
      return NextResponse.json({ error: 'CSRF violation: Cross-origin requests blocked for internal APIs.' }, { status: 403 })
    }
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    if (origin && host) {
      try {
        const originHost = new URL(origin).host
        if (originHost !== host) {
          return NextResponse.json({ error: 'CSRF violation: Origin mismatch.' }, { status: 403 })
        }
      } catch (e) {
        return NextResponse.json({ error: 'CSRF violation: Invalid Origin.' }, { status: 403 })
      }
    }
  }

  // 1. Bypass Public Assets, Public APIs, and Public Pages
  const isPublicPage = [
    '/', '/about', '/booking', '/booking-flow', '/contact', '/cookies', 
    '/facilities', '/gallery', '/privacy', '/rooms', '/spa', '/terms'
  ].some(p => path === p || path.startsWith(`${p}/`))
  
  const isAuthPage = path.startsWith('/auth')

  if (
    path.startsWith('/_next') ||
    path.startsWith('/images') ||
    path.startsWith('/favicon') ||
    isAuthPage ||
    isPublicPage ||
    PUBLIC_API_PREFIXES.some(p => path.startsWith(p))
  ) {
    return NextResponse.next()
  }

  // 2. Resolve Session
  let token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: 'next-auth.session-token'
  })
  if (!token && process.env.NODE_ENV === 'production') {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: '__Secure-next-auth.session-token'
    })
  }

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
    const userRole = (token.roleName || token.role || 'GUEST') as string

    // Intelligent Routing: If staff hits guest dashboard, redirect them correctly
    if (path === '/dashboard' || path === '/dashboard/') {
      if (userRole === 'RECEPTIONIST') return NextResponse.redirect(new URL('/admin/receptionist', request.url))
      if (userRole === 'KITCHEN') return NextResponse.redirect(new URL('/kitchen/dashboard', request.url))
      if (userRole === 'HOUSEKEEPING' || userRole === 'MAINTENANCE') return NextResponse.redirect(new URL('/admin/tasks', request.url))
      if (userRole === 'MANAGER' || userRole === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

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
  } else {
    // FAIL CLOSED: Default Deny for omitted routes
    if (path.startsWith('/api')) {
      return NextResponse.json({ error: 'Forbidden', message: 'No authorization rule defined' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|images|favicon.ico).*)',
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
  '/api/settings/contact',
  '/api/faq',
  '/api/social-links',
  '/api/footer-links',
  '/api/chat/messages',
  '/api/performance/metrics',
  '/api/navigation',
]

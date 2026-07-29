import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'
import { getBroadRole } from './rbac-utils'

/**
 * Extracts the effective propertyId for the current API request.
 * Enforces the user's assigned propertyId if they have one.
 * If the user is a SUPER_ADMIN, it allows reading from the 'x-property-id' header.
 */
export async function getEffectivePropertyId(req?: Request): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  // 1. Strict isolation: If the user is assigned a specific property in DB, enforce it.
  if (session.user.propertyId) {
    return session.user.propertyId
  }

  // 2. Global roles (e.g. SUPER_ADMIN) can view specific properties via header switcher
  const broadRole = getBroadRole(session.user.roleName || '')
  if (broadRole === 'SUPER_ADMIN') {
    if (req) {
      const headerPropertyId = req.headers.get('x-property-id')
      if (headerPropertyId && headerPropertyId !== 'all') {
        return headerPropertyId
      }
    }
  }

  return null // Global scope
}

/**
 * Validates if the current session holds the required granular permission.
 * Bypasses database lookups by reading the JWT session token injected by NextAuth.
 * Returns null if valid, or returns a 403 NextResponse if unauthorized.
 */
export async function requirePermission(action: string): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 })
  }

  const permissions = (session.user as any).permissions || []
  const roleName = (session.user as any).roleName || 'GUEST'

  // Super Admin implicitly holds all permissions
  if (roleName === 'SUPER_ADMIN') return null

  if (!permissions.includes(action)) {
    return NextResponse.json({ 
      error: 'Forbidden: Insufficient privileges.', 
      message: `Action [${action}] is restricted. You do not hold this capability in your Role Matrix.`
    }, { status: 403 })
  }

  return null
}

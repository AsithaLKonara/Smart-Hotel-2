import { getServerSession } from 'next-auth'
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

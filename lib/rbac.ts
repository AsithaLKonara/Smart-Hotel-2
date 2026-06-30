import prisma from '@/lib/db'

// Simplified 1:1 mapping of core roles
export const ROLE_GROUPS = {
  SUPER_ADMIN: ['SUPER_ADMIN', 'GENERAL_MANAGER'],
  MANAGER: ['MANAGER', 'REVENUE_MANAGER'],
  RECEPTIONIST: ['RECEPTIONIST', 'FRONT_DESK'],
  HOUSEKEEPING: ['HOUSEKEEPING', 'HOUSEKEEPING_MGR'],
  MAINTENANCE: ['MAINTENANCE'],
  KITCHEN: ['KITCHEN'],
  GUEST: ['GUEST', 'STANDARD', 'VIP']
}

/**
 * Resolves a highly granular DB role to its broad category.
 * If not found, defaults to GUEST.
 */
export function getBroadRole(granularRole: string): string {
  const role = granularRole?.toUpperCase() || 'GUEST'
  
  for (const [broadRole, roles] of Object.entries(ROLE_GROUPS)) {
    if (roles.includes(role)) {
      return broadRole
    }
  }
  
  return 'GUEST'
}

/**
 * Determines the primary dashboard entry point for a given granular role.
 */
export function getDefaultDashboardUrl(granularRole: string): string {
  const broadRole = getBroadRole(granularRole)
  
  switch (broadRole) {
    case 'SUPER_ADMIN':
    case 'MANAGER':
      return '/admin/dashboard'
    case 'RECEPTIONIST':
      return '/admin/bookings'
    case 'KITCHEN':
      return '/kitchen'
    case 'HOUSEKEEPING':
    case 'MAINTENANCE':
      return '/admin/tasks'
    case 'GUEST':
    default:
      return '/dashboard'
  }
}

/**
 * Enterprise RBAC Authorization Engine
 * Checks if a specific User ID holds a specific Permission action string.
 */
export async function hasPermission(userId: string, action: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    })

    if (!user || !user.role) return false

    // General Manager override - has implicit root access
    if (user.role.name === 'GENERAL_MANAGER') return true

    // Check specific permission
    const hasPerm = user.role.permissions.some((rp: any) => rp.permission.action === action)
    return hasPerm

  } catch (error) {
    console.error('RBAC check failed:', error)
    return false
  }
}

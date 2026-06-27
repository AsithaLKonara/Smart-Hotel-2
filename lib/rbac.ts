// Simplified 1:1 mapping of core roles
export const ROLE_GROUPS = {
  SUPER_ADMIN: ['SUPER_ADMIN'],
  MANAGER: ['MANAGER'],
  RECEPTIONIST: ['RECEPTIONIST'],
  HOUSEKEEPING: ['HOUSEKEEPING'],
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

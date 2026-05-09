export type UserRole =
  | 'SUPER_ADMIN'
  | 'CORPORATE_ADMIN'
  | 'GENERAL_MANAGER'
  | 'FRONT_DESK'
  | 'NIGHT_AUDITOR'
  | 'HOUSEKEEPER'
  | 'MAINTENANCE'
  | 'SECURITY'
  | 'FINANCE'
  | 'VALET'
  | 'KITCHEN'

export type UserPermission =
  | 'ledger:read'
  | 'ledger:write'
  | 'period:freeze'
  | 'reservation:create'
  | 'reservation:write'
  | 'checkout:saga'
  | 'task:create'
  | 'task:dispatch'
  | 'task:complete'
  | 'room:maintenance'
  | 'kitchen:kds'

export interface UserSessionProfile {
  userId: string
  role: UserRole
  activePropertyId: string
  tenantId: string
  isMfaVerified: boolean
}

export class RbacEngine {
  // Master Role permissions capability matrix mapping
  private static rolePermissions: Record<UserRole, UserPermission[]> = {
    SUPER_ADMIN: [
      'ledger:read', 'ledger:write', 'period:freeze',
      'reservation:create', 'reservation:write', 'checkout:saga',
      'task:create', 'task:dispatch', 'task:complete',
      'room:maintenance', 'kitchen:kds'
    ],
    CORPORATE_ADMIN: [
      'ledger:read', 'ledger:write', 'period:freeze',
      'reservation:create', 'reservation:write', 'checkout:saga',
      'task:create', 'task:dispatch'
    ],
    GENERAL_MANAGER: [
      'ledger:read', 'ledger:write', 'period:freeze',
      'reservation:create', 'reservation:write', 'checkout:saga',
      'task:create', 'task:dispatch', 'task:complete',
      'room:maintenance'
    ],
    FRONT_DESK: [
      'reservation:create', 'reservation:write', 'checkout:saga',
      'task:create', 'task:dispatch', 'task:complete'
    ],
    NIGHT_AUDITOR: [
      'ledger:read', 'ledger:write', 'period:freeze',
      'reservation:write'
    ],
    HOUSEKEEPER: [
      'task:complete'
    ],
    MAINTENANCE: [
      'task:complete',
      'room:maintenance'
    ],
    SECURITY: [
      'task:complete'
    ],
    FINANCE: [
      'ledger:read', 'ledger:write'
    ],
    VALET: [
      'task:complete'
    ],
    KITCHEN: [
      'kitchen:kds',
      'task:complete'
    ]
  }

  // Verifies that user has permission capability, matches target properties scope, and passes MFA checks
  static canExecute(
    session: UserSessionProfile,
    permission: UserPermission,
    targetPropertyId: string
  ): boolean {
    // 1. Super admin is granted absolute authority globally
    if (session.role === 'SUPER_ADMIN') {
      return true
    }

    // 2. Validate MFA enforcement for privileged actions (financial postings or period freezing)
    const isPrivilegedAction = permission === 'ledger:write' || permission === 'period:freeze'
    if (isPrivilegedAction && !session.isMfaVerified) {
      return false
    }

    // 3. Multi-property scope matching (Staff cannot cross their physical boundary)
    const isCorporate = session.role === 'CORPORATE_ADMIN'
    const propertyMatch = session.activePropertyId === targetPropertyId

    if (!isCorporate && !propertyMatch) {
      return false
    }

    // 4. Validate permission mapping in capabilities array
    const permissions = this.rolePermissions[session.role] || []
    return permissions.includes(permission)
  }

  // Generates transient supervisor override token for elevated desk tasks
  static requestSupervisorOverride(
    supervisorSession: UserSessionProfile,
    actionNeeded: UserPermission
  ): string | null {
    const isElevated = supervisorSession.role === 'GENERAL_MANAGER' || supervisorSession.role === 'SUPER_ADMIN'
    if (!isElevated) {
      return null
    }

    const token = `override-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    return token
  }
}

export default RbacEngine

import { RbacEngine, UserSessionProfile } from '../../../lib/security/rbac-engine'

describe('Enterprise Authentication & RBAC Engine Suite', () => {
  let frontDeskSession: UserSessionProfile
  let nightAuditorSession: UserSessionProfile
  let gmSession: UserSessionProfile

  beforeEach(() => {
    frontDeskSession = {
      userId: 'user-recept-01',
      role: 'FRONT_DESK',
      activePropertyId: 'property-colombo-1',
      tenantId: 'tenant-jetwing-group',
      isMfaVerified: false
    }

    nightAuditorSession = {
      userId: 'user-audit-01',
      role: 'NIGHT_AUDITOR',
      activePropertyId: 'property-colombo-1',
      tenantId: 'tenant-jetwing-group',
      isMfaVerified: true
    }

    gmSession = {
      userId: 'user-gm-01',
      role: 'GENERAL_MANAGER',
      activePropertyId: 'property-colombo-1',
      tenantId: 'tenant-jetwing-group',
      isMfaVerified: true
    }
  })

  test('should allow Front Desk to check-in reservations, but block financial period freezes', () => {
    const canCheckIn = RbacEngine.canExecute(frontDeskSession, 'reservation:create', 'property-colombo-1')
    const canFreeze = RbacEngine.canExecute(frontDeskSession, 'period:freeze', 'property-colombo-1')

    expect(canCheckIn).toBe(true)
    expect(canFreeze).toBe(false)
  })

  test('should allow Night Auditor to freeze periods, but block kitchen KDS access', () => {
    const canFreeze = RbacEngine.canExecute(nightAuditorSession, 'period:freeze', 'property-colombo-1')
    const canKds = RbacEngine.canExecute(nightAuditorSession, 'kitchen:kds', 'property-colombo-1')

    expect(canFreeze).toBe(true)
    expect(canKds).toBe(false)
  })

  test('should enforce strict property boundaries for front desk check-ins', () => {
    // Attempting check-in in property-galle-2 (which does not match user's active property)
    const crossCheckIn = RbacEngine.canExecute(frontDeskSession, 'reservation:create', 'property-galle-2')
    expect(crossCheckIn).toBe(false)
  })

  test('should block privileged financial postings if MFA is unverified', () => {
    const auditorNoMfa: UserSessionProfile = {
      ...nightAuditorSession,
      isMfaVerified: false // MFA is required for ledger writes
    }

    const canWriteLedger = RbacEngine.canExecute(auditorNoMfa, 'ledger:write', 'property-colombo-1')
    expect(canWriteLedger).toBe(false)
  })

  test('should generate supervisor override tokens for GMs and Super Admins', () => {
    const token = RbacEngine.requestSupervisorOverride(gmSession, 'period:freeze')
    expect(token).toBeDefined()
    expect(token?.startsWith('override-')).toBe(true)

    // Regular Front Desk cannot issue override tokens
    const failedToken = RbacEngine.requestSupervisorOverride(frontDeskSession, 'period:freeze')
    expect(failedToken).toBeNull()
  })
})

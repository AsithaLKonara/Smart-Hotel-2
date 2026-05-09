export interface IntrusionLog {
  timestamp: string
  vectorType: 'TOKEN_REPLAY' | 'LATERAL_MOVEMENT' | 'PRIVILEGE_ESCALATION'
  offendingUser: string
  propertyId: string
  blocked: boolean
}

export class RedTeamSimulator {
  private static attackLogs: IntrusionLog[] = []
  private static consumedNonces = new Set<string>()

  // Simulates standard credential replay attacks over HTTP requests
  static simulateApiRequest(req: { nonce: string; payload: string; user: string; propertyId: string }): {
    authorized: boolean
    alertTriggered: boolean
  } {
    // Check if the single-use token nonce has already been consumed (Anti-Replay)
    if (this.consumedNonces.has(req.nonce)) {
      this.logIntrusion({
        timestamp: new Date().toISOString(),
        vectorType: 'TOKEN_REPLAY',
        offendingUser: req.user,
        propertyId: req.propertyId,
        blocked: true
      })
      return { authorized: false, alertTriggered: true }
    }

    this.consumedNonces.add(req.nonce)
    return { authorized: true, alertTriggered: false }
  }

  // Simulates lateral movement attempts where staff of property A try to write/read records of property B
  static simulateLateralMovementAttempt(
    userScopePropertyId: string,
    targetPropertyId: string,
    user: string
  ): { accessGranted: boolean; isolationSuccess: boolean } {
    if (userScopePropertyId !== targetPropertyId) {
      this.logIntrusion({
        timestamp: new Date().toISOString(),
        vectorType: 'LATERAL_MOVEMENT',
        offendingUser: user,
        propertyId: targetPropertyId,
        blocked: true
      })
      return { accessGranted: false, isolationSuccess: true }
    }

    return { accessGranted: true, isolationSuccess: false }
  }

  // Simulates privilege escalation attempts where a client tries to raise their own authorization level
  static simulatePrivilegeEscalationAttempt(
    currentRole: string,
    requestedRole: string,
    user: string
  ): { escalationSuccessful: boolean; systemAlarmActive: boolean } {
    const isEscalationAdversarial = currentRole === 'RECEPTIONIST' && requestedRole === 'ADMIN'

    if (isEscalationAdversarial) {
      this.logIntrusion({
        timestamp: new Date().toISOString(),
        vectorType: 'PRIVILEGE_ESCALATION',
        offendingUser: user,
        propertyId: 'ALL',
        blocked: true
      })
      return { escalationSuccessful: false, systemAlarmActive: true }
    }

    return { escalationSuccessful: true, systemAlarmActive: false }
  }

  private static logIntrusion(log: IntrusionLog): void {
    this.attackLogs.push(log)
  }

  static getAttackLogs(): IntrusionLog[] {
    return this.attackLogs
  }

  static clearLogs(): void {
    this.attackLogs = []
    this.consumedNonces.clear()
  }
}

export default RedTeamSimulator

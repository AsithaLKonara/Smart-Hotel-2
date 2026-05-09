export interface ChaosProfile {
  injectLatencyMs: number
  failRedisLocks: boolean
  failDbTransactions: boolean
  duplicateMessageOutbox: boolean
  dropWebSocketFrames: boolean
}

export class ChaosEngine {
  private static activeProfile: ChaosProfile = {
    injectLatencyMs: 0,
    failRedisLocks: false,
    failDbTransactions: false,
    duplicateMessageOutbox: false,
    dropWebSocketFrames: false
  }

  // Set the active chaos profile
  static setChaosProfile(profile: Partial<ChaosProfile>): void {
    this.activeProfile = { ...this.activeProfile, ...profile }
  }

  // Intercept actions to inject artificial latency
  static async executeLatencyHook(): Promise<void> {
    if (this.activeProfile.injectLatencyMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.activeProfile.injectLatencyMs))
    }
  }

  // Checks if a Redis lock request should fail under chaos drills
  static shouldFailLock(): boolean {
    return this.activeProfile.failRedisLocks
  }

  // Checks if a Database transaction write should fail under chaos drills
  static shouldDropTransaction(): boolean {
    return this.activeProfile.failDbTransactions
  }

  // Checks if outbox publishers should duplicate events to test idempotency
  static shouldDuplicateOutbox(): boolean {
    return this.activeProfile.duplicateMessageOutbox
  }

  // Checks if websockets should simulate dropping packets
  static shouldDropSocketFrame(): boolean {
    return this.activeProfile.dropWebSocketFrames
  }

  static reset(): void {
    this.activeProfile = {
      injectLatencyMs: 0,
      failRedisLocks: false,
      failDbTransactions: false,
      duplicateMessageOutbox: false,
      dropWebSocketFrames: false
    }
  }
}

export default ChaosEngine

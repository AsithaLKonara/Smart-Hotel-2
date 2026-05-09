import crypto from 'crypto'

export interface WalLogEntry {
  sequenceNumber: number
  aggregateId: string
  eventType: string
  payloadStr: string
  timestampMs: number
}

export interface StateSnapshot {
  aggregateId: string
  statePayload: any
  checksum: string
  timestampMs: number
}

export class ContinuousRecoveryEngine {
  private static walLogs: WalLogEntry[] = []
  private static snapshotStore = new Map<string, StateSnapshot>()

  // Appends a new write transaction to the continuous WAL journal
  static appendWal(aggregateId: string, eventType: string, payload: any, timestampMs: number): WalLogEntry {
    const sequence = this.walLogs.length + 1
    const payloadStr = JSON.stringify(payload)
    
    const entry: WalLogEntry = {
      sequenceNumber: sequence,
      aggregateId,
      eventType,
      payloadStr,
      timestampMs
    }

    this.walLogs.push(entry)
    return entry
  }

  // Generates state snapshots representing checkpoint boundaries, signed with SHA-256 checksums
  static checkpointState(aggregateId: string, statePayload: any, timestampMs: number): StateSnapshot {
    const stateStr = JSON.stringify(statePayload)
    const checksum = crypto.createHash('sha256').update(stateStr).digest('hex')

    const snapshot: StateSnapshot = {
      aggregateId,
      statePayload,
      checksum,
      timestampMs
    }

    this.snapshotStore.set(aggregateId, snapshot)
    return snapshot
  }

  // Restores aggregate root states up to a specific millisecond timestamp by replaying WAL entries starting from checkpoint snapshot
  static restorePointInTime(
    aggregateId: string,
    targetTimestampMs: number,
    stateReplayer: (currentState: any, event: { eventType: string; payload: any }) => any
  ): any {
    const snapshot = this.snapshotStore.get(aggregateId)
    
    // 1. Verify snapshot exists and doesn't exceed our restoration point-in-time
    let currentState = {}
    let startingTime = 0

    if (snapshot && snapshot.timestampMs <= targetTimestampMs) {
      // Confirm snapshot checksum matches
      const stateStr = JSON.stringify(snapshot.statePayload)
      const computedChecksum = crypto.createHash('sha256').update(stateStr).digest('hex')
      
      if (computedChecksum !== snapshot.checksum) {
        throw new Error('RECOVERY_CORRUPTION_ERROR: Target state snapshot checksum mismatch!')
      }

      currentState = JSON.parse(stateStr)
      startingTime = snapshot.timestampMs
    }

    // 2. Scan WAL log, replaying events up to our targeted millisecond timestamp
    const applicableLogs = this.walLogs
      .filter(log => log.aggregateId === aggregateId && log.timestampMs > startingTime && log.timestampMs <= targetTimestampMs)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)

    for (const log of applicableLogs) {
      const payload = JSON.parse(log.payloadStr)
      currentState = stateReplayer(currentState, { eventType: log.eventType, payload })
    }

    return currentState
  }

  static getWalLogs(): WalLogEntry[] {
    return this.walLogs
  }

  static clearAll(): void {
    this.walLogs = []
    this.snapshotStore.clear()
  }
}

export default ContinuousRecoveryEngine

import crypto from 'crypto'

export interface DatabaseState {
  rooms: Map<string, any>
  ledgerBalances: Map<string, number>
}

export class ColdStartRebuilder {
  private static liveDatabase: DatabaseState = {
    rooms: new Map(),
    ledgerBalances: new Map()
  }

  // Wipes all live memory state and tables to simulate hard catastrophic hardware region failures
  static simulateCatastrophicWipe(): void {
    this.liveDatabase.rooms.clear()
    this.liveDatabase.ledgerBalances.clear()
  }

  // Replays snapshot checkpoint states and logs stream to reconstruct correct structures
  static executeColdStartRebuild(
    snapshot: { roomsState: any; ledgerState: any; checksum: string },
    walLogs: Array<{ aggregateId: string; type: 'ROOM' | 'LEDGER'; eventType: string; payload: any; timestampMs: number }>,
    targetTimestampMs: number
  ): { rebuildCompleted: boolean; restoredRoomsCount: number; ledgerBalanced: boolean } {
    // 1. Validate Snapshot integrity Checksum to ensure backup files are not corrupt
    const stateStr = JSON.stringify({ rooms: snapshot.roomsState, ledger: snapshot.ledgerState })
    const computedChecksum = crypto.createHash('sha256').update(stateStr).digest('hex')

    if (computedChecksum !== snapshot.checksum) {
      throw new Error('COLD_START_ERROR: Catastrophic backup corruption! Snapshot checksum mismatch.')
    }

    // 2. Restore Database state from checked checkpoint snapshot
    for (const [roomId, state] of Object.entries(snapshot.roomsState)) {
      this.liveDatabase.rooms.set(roomId, state)
    }
    for (const [accountId, balance] of Object.entries(snapshot.ledgerState)) {
      this.liveDatabase.ledgerBalances.set(accountId, balance as number)
    }

    // 3. Scan and replay continuous WAL write entries up to our target millisecond timestamp
    const activeLogs = walLogs
      .filter(log => log.timestampMs <= targetTimestampMs)
      .sort((a, b) => a.timestampMs - b.timestampMs)

    for (const log of activeLogs) {
      if (log.type === 'ROOM') {
        const currentRoom = this.liveDatabase.rooms.get(log.aggregateId) || {}
        this.liveDatabase.rooms.set(log.aggregateId, { ...currentRoom, ...log.payload })
      } else if (log.type === 'LEDGER') {
        const currentBal = this.liveDatabase.ledgerBalances.get(log.aggregateId) || 0
        this.liveDatabase.ledgerBalances.set(log.aggregateId, currentBal + log.payload.amount)
      }
    }

    // 4. Audit ledger balance constraints: Total assets (debits) must equal total liabilities/equity (credits)
    let totalAssets = this.liveDatabase.ledgerBalances.get('1010') || 0 // Cash asset account
    let totalLiabilities = this.liveDatabase.ledgerBalances.get('2200') || 0 // Prepayment liability account
    let totalRevenue = this.liveDatabase.ledgerBalances.get('4010') || 0 // Lodging revenue account

    const ledgerBalanced = Math.abs(totalAssets - (totalLiabilities + totalRevenue)) === 0

    return {
      rebuildCompleted: true,
      restoredRoomsCount: this.liveDatabase.rooms.size,
      ledgerBalanced
    }
  }

  static getLiveDatabase(): DatabaseState {
    return this.liveDatabase
  }
}

export default ColdStartRebuilder

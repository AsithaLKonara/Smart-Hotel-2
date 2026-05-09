import { eventBus } from './event-bus'

export interface InventoryHold {
  id: string
  roomId: string
  roomNumber: string
  version: number
  expiresAt: string
  actor: string
  status: 'ACTIVE' | 'RELEASED' | 'COMMITTED'
}

export class InventoryLockEngine {
  private static holds: Map<string, InventoryHold> = new Map()
  private static roomVersions: Map<string, number> = new Map()

  // Get current state version of a room to prevent race conditions (Optimistic Concurrency)
  static getVersion(roomId: string): number {
    if (!this.roomVersions.has(roomId)) {
      this.roomVersions.set(roomId, 1)
    }
    return this.roomVersions.get(roomId) || 1
  }

  // Acquire dynamic, lease-based temporary reservation holds
  static acquireHold(roomId: string, roomNumber: string, clientVersion: number, actor: string, durationSec = 600): InventoryHold {
    const currentVersion = this.getVersion(roomId)
    
    // Optimistic Concurrency Control Check
    if (clientVersion !== currentVersion) {
      throw new Error(`Inventory conflict: State version mismatch for Room ${roomNumber}. Current version is [${currentVersion}], but request holds stale version [${clientVersion}].`)
    }

    // Check for active unexpired holds on this room to prevent double allocation
    const existingHold = Array.from(this.holds.values()).find(
      h => h.roomId === roomId && h.status === 'ACTIVE' && new Date(h.expiresAt) > new Date()
    )
    if (existingHold) {
      throw new Error(`Inventory locked: Room ${roomNumber} currently has an unexpired reservation hold by ${existingHold.actor}.`)
    }

    const hold: InventoryHold = {
      id: `hold-${roomId}-${Date.now()}`,
      roomId,
      roomNumber,
      version: currentVersion,
      expiresAt: new Date(Date.now() + durationSec * 1000).toISOString(),
      actor,
      status: 'ACTIVE'
    }

    this.holds.set(hold.id, hold)

    // Emit live lock event to SRE telemetry pipeline
    eventBus.emit({
      id: `lock-acquired-${hold.id}`,
      type: 'inventory.lock_acquired',
      severity: 'INFO',
      title: `Inventory Lock Secured`,
      message: `Room ${roomNumber} locked by ${actor} until ${hold.expiresAt}.`,
      metadata: { ...hold },
      timestamp: new Date().toISOString()
    })

    return hold
  }

  // Commit a hold to database (increments room version to invalidate other concurrent bookings)
  static commitHold(holdId: string): void {
    const hold = this.holds.get(holdId)
    if (!hold) throw new Error(`Hold lease reference not found for id [${holdId}].`)
    if (hold.status !== 'ACTIVE') throw new Error(`Cannot commit: Hold ${holdId} is in status [${hold.status}].`)
    if (new Date(hold.expiresAt) < new Date()) {
      hold.status = 'RELEASED'
      throw new Error(`Cannot commit: Hold ${holdId} has expired.`)
    }

    hold.status = 'COMMITTED'
    const newVersion = hold.version + 1
    this.roomVersions.set(hold.roomId, newVersion)

    // Emit live commit success onto the Event Bus
    eventBus.emit({
      id: `lock-committed-${holdId}`,
      type: 'inventory.lock_committed',
      severity: 'INFO',
      title: `Inventory Lock Committed`,
      message: `Room ${hold.roomNumber} locked lease successfully committed. Room state advanced to version ${newVersion}.`,
      metadata: { ...hold, nextVersion: newVersion },
      timestamp: new Date().toISOString()
    })
  }

  // Rollback active lease on conflict or cancellation
  static rollbackHold(holdId: string): void {
    const hold = this.holds.get(holdId)
    if (!hold) return
    if (hold.status === 'ACTIVE') {
      hold.status = 'RELEASED'
      
      // Emit rollback telemetry onto the Event Bus
      eventBus.emit({
        id: `lock-released-${holdId}`,
        type: 'inventory.lock_released',
        severity: 'INFO',
        title: `Inventory Lock Released`,
        message: `Temporary lock lease for Room ${hold.roomNumber} has been rolled back.`,
        metadata: { ...hold },
        timestamp: new Date().toISOString()
      })
    }
  }
}
export default InventoryLockEngine;

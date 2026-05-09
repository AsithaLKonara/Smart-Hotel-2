import { eventBus } from './event-bus'

export type RoomStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'PRE_CHECKIN'
  | 'CHECKED_IN'
  | 'DO_NOT_DISTURB'
  | 'HOUSEKEEPING_PENDING'
  | 'HOUSEKEEPING_ACTIVE'
  | 'INSPECTION_PENDING'
  | 'READY_FOR_SALE'
  | 'MAINTENANCE_BLOCKED'
  | 'OUT_OF_ORDER'
  | 'LATE_CHECKOUT'
  | 'VIP_PREP'
  | 'OVERBOOKED_RISK'

// Strict finite state machine adjacency matrix mapping allowed paths
const ALLOWED_TRANSITIONS: Record<RoomStatus, RoomStatus[]> = {
  AVAILABLE: ['RESERVED', 'PRE_CHECKIN', 'MAINTENANCE_BLOCKED', 'OUT_OF_ORDER', 'VIP_PREP'],
  RESERVED: ['PRE_CHECKIN', 'CHECKED_IN', 'AVAILABLE', 'OVERBOOKED_RISK'],
  PRE_CHECKIN: ['CHECKED_IN', 'AVAILABLE', 'RESERVED', 'VIP_PREP'],
  CHECKED_IN: ['DO_NOT_DISTURB', 'LATE_CHECKOUT', 'HOUSEKEEPING_PENDING', 'MAINTENANCE_BLOCKED'],
  DO_NOT_DISTURB: ['CHECKED_IN', 'LATE_CHECKOUT', 'HOUSEKEEPING_PENDING'],
  HOUSEKEEPING_PENDING: ['HOUSEKEEPING_ACTIVE', 'MAINTENANCE_BLOCKED'],
  HOUSEKEEPING_ACTIVE: ['INSPECTION_PENDING', 'MAINTENANCE_BLOCKED'],
  INSPECTION_PENDING: ['READY_FOR_SALE', 'HOUSEKEEPING_PENDING', 'MAINTENANCE_BLOCKED'],
  READY_FOR_SALE: ['AVAILABLE', 'RESERVED', 'PRE_CHECKIN'],
  MAINTENANCE_BLOCKED: ['OUT_OF_ORDER', 'HOUSEKEEPING_PENDING', 'AVAILABLE'],
  OUT_OF_ORDER: ['MAINTENANCE_BLOCKED', 'AVAILABLE'],
  LATE_CHECKOUT: ['HOUSEKEEPING_PENDING', 'MAINTENANCE_BLOCKED'],
  VIP_PREP: ['CHECKED_IN', 'PRE_CHECKIN'],
  OVERBOOKED_RISK: ['RESERVED', 'AVAILABLE']
}

export interface TransitionLog {
  roomId: string
  roomNumber: string
  fromStatus: RoomStatus
  toStatus: RoomStatus
  actor: string
  timestamp: string
  reason?: string
}

export class RoomLifecycleEngine {
  // Validate if a transition from source status to target status is permitted
  static isValidTransition(from: RoomStatus, to: RoomStatus): boolean {
    if (from === to) return true // Self transitions are treated as idempotent
    const allowed = ALLOWED_TRANSITIONS[from]
    return allowed ? allowed.includes(to) : false
  }

  // Execute transition with SRE-level validations and event propagation
  static executeTransition(
    roomId: string,
    roomNumber: string,
    from: RoomStatus,
    to: RoomStatus,
    actor: string,
    reason?: string
  ): TransitionLog {
    if (!this.isValidTransition(from, to)) {
      throw new Error(`State machine violation: Transition from [${from}] to [${to}] is strictly prohibited for Room ${roomNumber}.`)
    }

    const log: TransitionLog = {
      roomId,
      roomNumber,
      fromStatus: from,
      toStatus: to,
      actor,
      timestamp: new Date().toISOString(),
      reason
    }

    // Emit live telemetry event onto the centralized Event Bus
    eventBus.emit({
      id: `lifecycle-${roomId}-${Date.now()}`,
      type: 'room.status_changed',
      severity: to === 'OUT_OF_ORDER' || to === 'OVERBOOKED_RISK' ? 'CRITICAL' : 'INFO',
      title: `Room ${roomNumber} Status Shift`,
      message: `Room status changed from ${from} to ${to} by ${actor}.`,
      metadata: { ...log },
      timestamp: log.timestamp
    })

    return log
  }
}
export default RoomLifecycleEngine;

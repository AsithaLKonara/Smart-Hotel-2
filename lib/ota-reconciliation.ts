import { eventBus } from './event-bus'

export interface OTAReservation {
  id: string // Channel confirmation ID (e.g. "BCOM-12345")
  guestName: string
  roomType: string
  checkIn: string // "YYYY-MM-DD"
  checkOut: string // "YYYY-MM-DD"
  totalPrice: number
  currency: string
}

export type ReconciliationStatus = 
  | 'PENDING_RECONCILIATION'
  | 'RESOLVED_AUTO'
  | 'QUARANTINED'
  | 'RESOLVED_MANUAL_ACCEPTED'
  | 'RESOLVED_MANUAL_REJECTED'

export interface ReconciliationConflict {
  field: string
  expected: any
  received: any
  severity: 'WARNING' | 'CRITICAL'
  reason: string
}

export interface ReconciliationResult {
  id: string
  reservation: OTAReservation
  status: ReconciliationStatus
  conflicts: ReconciliationConflict[]
  reconciledAt: string
  resolvedBy?: string
  resolvedAt?: string
}

export class OTAReconciliationEngine {
  private static queue: Map<string, ReconciliationResult> = new Map()

  // Clear or reset reconciliation queue (for tests)
  static clearQueue(): void {
    this.queue.clear()
  }

  // Audits and reconciles an incoming booking from an external OTA channel
  static processIncomingReservation(
    reservation: OTAReservation,
    pmsLookup: {
      isRoomTypeAvailable: (type: string, checkIn: string, checkOut: string) => boolean
      getExpectedPrice: (type: string, checkIn: string, checkOut: string) => number
      hasExistingBooking: (id: string) => boolean
    }
  ): ReconciliationResult {
    const conflicts: ReconciliationConflict[] = []

    // 1. Sanity Check: Check-In before Check-Out
    const checkInDate = new Date(reservation.checkIn)
    const checkOutDate = new Date(reservation.checkOut)
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkInDate >= checkOutDate) {
      conflicts.push({
        field: 'dates',
        expected: 'Valid Chronological Range',
        received: `${reservation.checkIn} to ${reservation.checkOut}`,
        severity: 'CRITICAL',
        reason: 'Check-out date must be strictly after check-in date.'
      })
    }

    // 2. Duplicate Check
    if (pmsLookup.hasExistingBooking(reservation.id)) {
      conflicts.push({
        field: 'id',
        expected: 'Unique Reservation ID',
        received: reservation.id,
        severity: 'CRITICAL',
        reason: 'A reservation with this channel confirmation ID already exists in the PMS.'
      })
    }

    // 3. Price / Rate Parity Check
    if (conflicts.filter(c => c.field === 'dates').length === 0) {
      const expectedPrice = pmsLookup.getExpectedPrice(reservation.roomType, reservation.checkIn, reservation.checkOut)
      const diff = Math.abs(expectedPrice - reservation.totalPrice)
      if (diff > 0.01) {
        conflicts.push({
          field: 'totalPrice',
          expected: expectedPrice,
          received: reservation.totalPrice,
          severity: 'WARNING',
          reason: `Rate parity variance: expected $${expectedPrice} but external OTA booked at $${reservation.totalPrice}.`
        })
      }
    }

    // 4. Availability / Overbooking Check
    if (conflicts.filter(c => c.field === 'dates').length === 0) {
      const available = pmsLookup.isRoomTypeAvailable(reservation.roomType, reservation.checkIn, reservation.checkOut)
      if (!available) {
        conflicts.push({
          field: 'roomType',
          expected: 'Inventory Available',
          received: reservation.roomType,
          severity: 'CRITICAL',
          reason: `Overbooking conflict: No standard available rooms of type [${reservation.roomType}] on selected dates.`
        })
      }
    }

    const hasCriticalConflict = conflicts.some(c => c.severity === 'CRITICAL')
    const hasWarnings = conflicts.some(c => c.severity === 'WARNING')
    
    let status: ReconciliationStatus = 'RESOLVED_AUTO'
    if (hasCriticalConflict || hasWarnings) {
      status = 'QUARANTINED'
    }

    const result: ReconciliationResult = {
      id: `recon-${reservation.id}-${Date.now()}`,
      reservation,
      status,
      conflicts,
      reconciledAt: new Date().toISOString()
    }

    this.queue.set(result.id, result)

    // Emit reconciliation logs onto global event bus
    eventBus.emit({
      id: `ota-recon-${result.id}`,
      type: status === 'QUARANTINED' ? 'ota.reservation_quarantined' : 'ota.reservation_auto_reconciled',
      severity: status === 'QUARANTINED' ? 'HIGH' : 'INFO',
      title: status === 'QUARANTINED' ? 'OTA Booking Quarantined' : 'OTA Booking Auto-Approved',
      message: status === 'QUARANTINED'
        ? `Reservation ${reservation.id} quarantined due to ${conflicts.length} conflict(s).`
        : `Reservation ${reservation.id} auto-balanced and approved in system databases.`,
      metadata: { ...result },
      timestamp: result.reconciledAt
    })

    return result
  }

  // Manager Force-Accept workflow overrides quarantine and creates PMS booking
  static forceAcceptQuarantine(reconId: string, actor: string): ReconciliationResult {
    const result = this.queue.get(reconId)
    if (!result) throw new Error(`Reconciliation record [${reconId}] not found in OTA queue.`)
    if (result.status !== 'QUARANTINED') {
      throw new Error(`Cannot override: Reconciliation record [${reconId}] has state ${result.status}, not QUARANTINED.`)
    }

    result.status = 'RESOLVED_MANUAL_ACCEPTED'
    result.resolvedBy = actor
    result.resolvedAt = new Date().toISOString()

    eventBus.emit({
      id: `ota-force-accept-${reconId}-${Date.now()}`,
      type: 'ota.quarantine_force_accepted',
      severity: 'HIGH',
      title: `Quarantine Overridden: ${result.reservation.id}`,
      message: `Quarantined OTA booking ${result.reservation.id} was manually approved by SRE/Manager: ${actor}.`,
      metadata: { ...result },
      timestamp: result.resolvedAt
    })

    return result
  }

  // Manager Reject workflow drops/cancels external channel reservation
  static rejectQuarantine(reconId: string, actor: string): ReconciliationResult {
    const result = this.queue.get(reconId)
    if (!result) throw new Error(`Reconciliation record [${reconId}] not found in OTA queue.`)
    if (result.status !== 'QUARANTINED') {
      throw new Error(`Cannot reject: Reconciliation record [${reconId}] has state ${result.status}, not QUARANTINED.`)
    }

    result.status = 'RESOLVED_MANUAL_REJECTED'
    result.resolvedBy = actor
    result.resolvedAt = new Date().toISOString()

    eventBus.emit({
      id: `ota-reject-${reconId}-${Date.now()}`,
      type: 'ota.quarantine_rejected',
      severity: 'INFO',
      title: `Quarantine Rejected: ${result.reservation.id}`,
      message: `Quarantined OTA booking ${result.reservation.id} was manually rejected by SRE/Manager: ${actor}.`,
      metadata: { ...result },
      timestamp: result.resolvedAt
    })

    return result
  }

  static getQueue(): ReconciliationResult[] {
    return Array.from(this.queue.values())
  }
}

export default OTAReconciliationEngine;

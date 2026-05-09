import { OTAReconciliationEngine, OTAReservation } from '../../../lib/ota-reconciliation'

describe('OTA Conflict Resolution Engine', () => {
  beforeEach(() => {
    OTAReconciliationEngine.clearQueue()
  })

  // Create simple mock lookups
  const healthyPmsLookup = {
    isRoomTypeAvailable: () => true,
    getExpectedPrice: () => 400.00,
    hasExistingBooking: () => false
  }

  test('should successfully reconcile a standard booking with zero conflicts', () => {
    const reservation: OTAReservation = {
      id: 'BCOM-11111',
      guestName: 'John Smith',
      roomType: 'Deluxe Suite',
      checkIn: '2026-06-01',
      checkOut: '2026-06-05',
      totalPrice: 400.00,
      currency: 'USD'
    }

    const result = OTAReconciliationEngine.processIncomingReservation(reservation, healthyPmsLookup)

    expect(result.status).toBe('RESOLVED_AUTO')
    expect(result.conflicts.length).toBe(0)
  })

  test('should quarantine a reservation with a rate parity variance conflict', () => {
    const reservation: OTAReservation = {
      id: 'BCOM-22222',
      guestName: 'Jane Doe',
      roomType: 'Standard Room',
      checkIn: '2026-06-01',
      checkOut: '2026-06-05',
      totalPrice: 350.00, // Expected is 400.00
      currency: 'USD'
    }

    const result = OTAReconciliationEngine.processIncomingReservation(reservation, healthyPmsLookup)

    expect(result.status).toBe('QUARANTINED')
    expect(result.conflicts.length).toBe(1)
    expect(result.conflicts[0].field).toBe('totalPrice')
    expect(result.conflicts[0].severity).toBe('WARNING')
    expect(result.conflicts[0].expected).toBe(400.00)
    expect(result.conflicts[0].received).toBe(350.00)
  })

  test('should quarantine a reservation with an overbooking / availability conflict', () => {
    const reservation: OTAReservation = {
      id: 'BCOM-33333',
      guestName: 'Will Smith',
      roomType: 'Penthouse',
      checkIn: '2026-06-01',
      checkOut: '2026-06-05',
      totalPrice: 400.00,
      currency: 'USD'
    }

    const overbookedPmsLookup = {
      isRoomTypeAvailable: () => false, // Overbooked!
      getExpectedPrice: () => 400.00,
      hasExistingBooking: () => false
    }

    const result = OTAReconciliationEngine.processIncomingReservation(reservation, overbookedPmsLookup)

    expect(result.status).toBe('QUARANTINED')
    expect(result.conflicts.length).toBe(1)
    expect(result.conflicts[0].field).toBe('roomType')
    expect(result.conflicts[0].severity).toBe('CRITICAL')
  })

  test('should quarantine a reservation with non-chronological dates', () => {
    const reservation: OTAReservation = {
      id: 'BCOM-44444',
      guestName: 'Invalid Guest',
      roomType: 'Standard Room',
      checkIn: '2026-06-10',
      checkOut: '2026-06-05', // Before Check-In!
      totalPrice: 400.00,
      currency: 'USD'
    }

    const result = OTAReconciliationEngine.processIncomingReservation(reservation, healthyPmsLookup)

    expect(result.status).toBe('QUARANTINED')
    expect(result.conflicts.some(c => c.field === 'dates')).toBe(true)
  })

  test('should quarantine a reservation with duplicate Booking ID', () => {
    const reservation: OTAReservation = {
      id: 'BCOM-55555',
      guestName: 'Duplicate Smith',
      roomType: 'Standard Room',
      checkIn: '2026-06-01',
      checkOut: '2026-06-05',
      totalPrice: 400.00,
      currency: 'USD'
    }

    const duplicatePmsLookup = {
      isRoomTypeAvailable: () => true,
      getExpectedPrice: () => 400.00,
      hasExistingBooking: (id: string) => id === 'BCOM-55555' // simulate ID exists
    }

    const result = OTAReconciliationEngine.processIncomingReservation(reservation, duplicatePmsLookup)

    expect(result.status).toBe('QUARANTINED')
    expect(result.conflicts.some(c => c.field === 'id')).toBe(true)
  })

  test('should support force-approving and rejecting quarantined bookings by a manager', () => {
    const reservation: OTAReservation = {
      id: 'BCOM-66666',
      guestName: 'Quarantined Guest',
      roomType: 'Suite',
      checkIn: '2026-06-01',
      checkOut: '2026-06-05',
      totalPrice: 300.00, // Price mismatch
      currency: 'USD'
    }

    // Process to Quarantine
    const result = OTAReconciliationEngine.processIncomingReservation(reservation, healthyPmsLookup)
    expect(result.status).toBe('QUARANTINED')

    // 1. Force Accept
    const accepted = OTAReconciliationEngine.forceAcceptQuarantine(result.id, 'admin_clerk')
    expect(accepted.status).toBe('RESOLVED_MANUAL_ACCEPTED')
    expect(accepted.resolvedBy).toBe('admin_clerk')
    expect(accepted.resolvedAt).toBeDefined()

    // Reset and process another to reject
    OTAReconciliationEngine.clearQueue()
    const result2 = OTAReconciliationEngine.processIncomingReservation(reservation, healthyPmsLookup)
    
    // 2. Reject
    const rejected = OTAReconciliationEngine.rejectQuarantine(result2.id, 'sre_manager')
    expect(rejected.status).toBe('RESOLVED_MANUAL_REJECTED')
    expect(rejected.resolvedBy).toBe('sre_manager')
  })
})

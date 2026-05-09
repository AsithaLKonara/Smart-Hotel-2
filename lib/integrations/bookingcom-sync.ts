export interface OtaInventoryUpdate {
  propertyId: string
  roomTypeId: string
  date: string
  availableRooms: number
  rateDollars: number
}

export interface QuarantineAnomalousReservation {
  reservationId: string
  propertyId: string
  roomTypeId: string
  checkIn: string
  ratePaid: number
  status: 'QUARANTINED'
  reason: string
}

export class BookingComSync {
  private static syncHistory: OtaInventoryUpdate[] = []
  private static quarantineList = new Map<string, QuarantineAnomalousReservation>()

  // Pushes inventory counts and rate structures to Booking.com APIs
  static async pushInventoryRates(update: OtaInventoryUpdate): Promise<boolean> {
    // 1. Audit rates for anomaly checks (reject rates lower than minimum floor limits of $30 to prevent system exploits)
    if (update.rateDollars < 30) {
      throw new Error(`OTA_RATE_FLOOR_BREACH: Target rate $${update.rateDollars} falls below minimum brand floor price of $30.`)
    }

    this.syncHistory.push(update)
    return true
  }

  // Processes incoming reservation Webhook ingestions, catching anomalies and routing to quarantine
  static async ingestOtaReservation(payload: {
    bookingId: string
    propertyId: string
    roomTypeId: string
    checkIn: string
    ratePaid: number
  }): Promise<{ status: 'INGESTED' | 'QUARANTINED'; id: string }> {
    // 2. Quarantine checks: If a reservation is received with rate of $0, quarantine it for reservation auditor inspection
    if (payload.ratePaid <= 0) {
      const quarantineRecord: QuarantineAnomalousReservation = {
        reservationId: payload.bookingId,
        propertyId: payload.propertyId,
        roomTypeId: payload.roomTypeId,
        checkIn: payload.checkIn,
        ratePaid: payload.ratePaid,
        status: 'QUARANTINED',
        reason: 'RESERVATION_RATE_ANOMALY: Rate paid of $0 detected.'
      }

      this.quarantineList.set(payload.bookingId, quarantineRecord)
      return { status: 'QUARANTINED', id: payload.bookingId }
    }

    return { status: 'INGESTED', id: payload.bookingId }
  }

  static getQuarantined(id: string): QuarantineAnomalousReservation | undefined {
    return this.quarantineList.get(id)
  }

  static clearAll(): void {
    this.syncHistory = []
    this.quarantineList.clear()
  }
}

export default BookingComSync

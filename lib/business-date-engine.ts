import { eventBus } from './event-bus'

export class BusinessDateEngine {
  private static currentOperationalDate: string = '2026-05-08'
  private static isDayClosed: boolean = false
  private static lockedDates: Set<string> = new Set()

  // Reset/Initialize business date
  static initialize(initialDate = '2026-05-08'): void {
    this.currentOperationalDate = initialDate
    this.isDayClosed = false
    this.lockedDates.clear()
    
    // Previous dates are locked by default in a production-ready system
    const prevDate = new Date(initialDate)
    prevDate.setDate(prevDate.getDate() - 1)
    this.lockedDates.add(prevDate.toISOString().split('T')[0])
  }

  static getBusinessDate(): string {
    return this.currentOperationalDate
  }

  static isDateLocked(dateStr: string): boolean {
    return this.lockedDates.has(dateStr)
  }

  static lockDate(dateStr: string): void {
    this.lockedDates.add(dateStr)
    eventBus.emit({
      id: `date-lock-${dateStr}-${Date.now()}`,
      type: 'business_date.date_locked',
      severity: 'HIGH',
      title: `Operational Day Locked: ${dateStr}`,
      message: `The operational day ${dateStr} has been locked and frozen. No further entries permitted.`,
      metadata: { lockedDate: dateStr },
      timestamp: new Date().toISOString()
    })
  }

  // SRE-safe Business Day Rollover
  static performDayRollover(actor: string, postNightAuditCharges: () => void): string {
    if (this.isDayClosed) {
      throw new Error(`Operational day ${this.currentOperationalDate} is already closed. Rollover already executed.`)
    }

    const closedDate = this.currentOperationalDate

    // 1. Post nightly recurring charges (e.g., Room rent, taxes) before closing
    postNightAuditCharges()

    // 2. Lock the day being closed
    this.lockDate(closedDate)
    this.isDayClosed = true

    // 3. Roll calendar operational day to next date
    const currentDate = new Date(closedDate)
    currentDate.setDate(currentDate.getDate() + 1)
    const nextDate = currentDate.toISOString().split('T')[0]
    
    this.currentOperationalDate = nextDate
    this.isDayClosed = false

    eventBus.emit({
      id: `day-rollover-${closedDate}-${Date.now()}`,
      type: 'business_date.day_rolled_over',
      severity: 'HIGH',
      title: `Business Date Rolled: ${closedDate} ➔ ${nextDate}`,
      message: `Operational business day successfully rolled over. Current active day is now ${nextDate}. executed by ${actor}.`,
      metadata: { closedDate, nextDate, actor },
      timestamp: new Date().toISOString()
    })

    return nextDate
  }

  static getStatus() {
    return {
      currentOperationalDate: this.currentOperationalDate,
      isDayClosed: this.isDayClosed,
      lockedDates: Array.from(this.lockedDates)
    }
  }
}

// Initialize the business date engine default state
BusinessDateEngine.initialize()
export default BusinessDateEngine;

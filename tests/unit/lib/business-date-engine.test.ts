import { BusinessDateEngine } from '../../../lib/business-date-engine'

describe('True Business-Date Engine', () => {
  beforeEach(() => {
    BusinessDateEngine.initialize('2026-05-08')
  })

  test('should initialize with correct business date and lock previous days', () => {
    expect(BusinessDateEngine.getBusinessDate()).toBe('2026-05-08')
    expect(BusinessDateEngine.isDateLocked('2026-05-07')).toBe(true)
    expect(BusinessDateEngine.isDateLocked('2026-05-08')).toBe(false)
  })

  test('should successfully perform day rollover and advance current business date', () => {
    let mockChargePosted = false
    const postNightCharges = () => {
      mockChargePosted = true
    }

    const nextDate = BusinessDateEngine.performDayRollover('night_auditor_bot', postNightCharges)

    expect(nextDate).toBe('2026-05-09')
    expect(BusinessDateEngine.getBusinessDate()).toBe('2026-05-09')
    expect(mockChargePosted).toBe(true)
    expect(BusinessDateEngine.isDateLocked('2026-05-08')).toBe(true) // May 8 is now locked
  })

  test('should retrieve current operational state matching audit configurations', () => {
    const status = BusinessDateEngine.getStatus()
    expect(status.currentOperationalDate).toBe('2026-05-08')
    expect(status.isDayClosed).toBe(false)
    expect(status.lockedDates).toContain('2026-05-07')
  })
})

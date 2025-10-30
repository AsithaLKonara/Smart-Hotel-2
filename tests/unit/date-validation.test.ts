import { 
  isValidDateRange, 
  isDateInFuture, 
  isDateInPast, 
  getDaysBetween, 
  formatDateForDisplay,
  parseBookingDates,
  validateBookingDates
} from '@/lib/date-validation'

describe('Date Validation', () => {
  const today = new Date()
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  // Use future dates for validation tests
  const futureDate1 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  const futureDate2 = new Date(today.getTime() + 33 * 24 * 60 * 60 * 1000) // 33 days from now

  describe('isValidDateRange', () => {
    test('should return true for valid date range', () => {
      expect(isValidDateRange(tomorrow, nextWeek)).toBe(true)
    })

    test('should return false when start date is after end date', () => {
      expect(isValidDateRange(nextWeek, tomorrow)).toBe(false)
    })

    test('should return false when dates are the same', () => {
      expect(isValidDateRange(tomorrow, tomorrow)).toBe(false)
    })

    test('should handle invalid dates', () => {
      const invalidDate = new Date('invalid')
      expect(isValidDateRange(invalidDate, tomorrow)).toBe(false)
      expect(isValidDateRange(tomorrow, invalidDate)).toBe(false)
    })
  })

  describe('isDateInFuture', () => {
    test('should return true for future dates', () => {
      expect(isDateInFuture(tomorrow)).toBe(true)
      expect(isDateInFuture(nextWeek)).toBe(true)
    })

    test('should return false for past dates', () => {
      expect(isDateInFuture(yesterday)).toBe(false)
      expect(isDateInFuture(lastWeek)).toBe(false)
    })

    test('should return false for today', () => {
      expect(isDateInFuture(today)).toBe(false)
    })

    test('should handle invalid dates', () => {
      const invalidDate = new Date('invalid')
      expect(isDateInFuture(invalidDate)).toBe(false)
    })
  })

  describe('isDateInPast', () => {
    test('should return true for past dates', () => {
      expect(isDateInPast(yesterday)).toBe(true)
      expect(isDateInPast(lastWeek)).toBe(true)
    })

    test('should return false for future dates', () => {
      expect(isDateInPast(tomorrow)).toBe(false)
      expect(isDateInPast(nextWeek)).toBe(false)
    })

    test('should return false for today', () => {
      expect(isDateInPast(today)).toBe(false)
    })

    test('should handle invalid dates', () => {
      const invalidDate = new Date('invalid')
      expect(isDateInPast(invalidDate)).toBe(false)
    })
  })

  describe('getDaysBetween', () => {
    test('should calculate correct number of days', () => {
      expect(getDaysBetween(tomorrow, nextWeek)).toBe(6)
    })

    test('should return 0 for same dates', () => {
      expect(getDaysBetween(tomorrow, tomorrow)).toBe(0)
    })

    test('should return negative for reversed dates', () => {
      expect(getDaysBetween(nextWeek, tomorrow)).toBe(-6)
    })

    test('should handle single day difference', () => {
      const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
      expect(getDaysBetween(tomorrow, dayAfterTomorrow)).toBe(1)
    })
  })

  describe('formatDateForDisplay', () => {
    test('should format date correctly', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDateForDisplay(date)
      
      expect(formatted).toMatch(/January 15, 2024/)
    })

    test('should handle different date formats', () => {
      const date = new Date('2024-12-25')
      const formatted = formatDateForDisplay(date)
      
      expect(formatted).toMatch(/December 25, 2024/)
    })

    test('should handle invalid dates', () => {
      const invalidDate = new Date('invalid')
      const formatted = formatDateForDisplay(invalidDate)
      
      expect(formatted).toBe('Invalid Date')
    })
  })

  describe('parseBookingDates', () => {
    test('should parse valid date strings', () => {
      const result = parseBookingDates('2024-01-15', '2024-01-18')
      
      expect(result.checkIn).toBeInstanceOf(Date)
      expect(result.checkOut).toBeInstanceOf(Date)
      expect(result.checkIn.getFullYear()).toBe(2024)
      expect(result.checkIn.getMonth()).toBe(0) // January
      expect(result.checkIn.getDate()).toBe(15)
    })

    test('should handle invalid date strings', () => {
      expect(() => parseBookingDates('invalid', '2024-01-18')).toThrow()
      expect(() => parseBookingDates('2024-01-15', 'invalid')).toThrow()
    })

    test('should handle empty strings', () => {
      expect(() => parseBookingDates('', '2024-01-18')).toThrow()
      expect(() => parseBookingDates('2024-01-15', '')).toThrow()
    })
  })

  describe('validateBookingDates', () => {
    test('should validate correct booking dates', () => {
      const result = validateBookingDates(futureDate1.toISOString().split('T')[0], futureDate2.toISOString().split('T')[0])
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should reject past check-in dates', () => {
      const pastDate = yesterday.toISOString().split('T')[0]
      const futureDate = nextWeek.toISOString().split('T')[0]
      
      const result = validateBookingDates(pastDate, futureDate)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Check-in date cannot be in the past')
    })

    test('should reject check-out before check-in', () => {
      const result = validateBookingDates('2024-01-18', '2024-01-15')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Check-out date must be after check-in date')
    })

    test('should reject same check-in and check-out dates', () => {
      const result = validateBookingDates('2024-01-15', '2024-01-15')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Check-out date must be after check-in date')
    })

    test('should reject bookings too far in advance', () => {
      const farFuture = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)
      const farFutureStr = farFuture.toISOString().split('T')[0]
      const result = validateBookingDates(farFutureStr, farFutureStr)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Bookings cannot be made more than 12 months in advance')
    })

    test('should reject bookings too far in the past', () => {
      const farPast = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)
      const farPastStr = farPast.toISOString().split('T')[0]
      const result = validateBookingDates(farPastStr, farPastStr)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Check-in date cannot be in the past')
    })

    test('should reject invalid date formats', () => {
      const result = validateBookingDates('invalid', '2024-01-18')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid date format')
    })

    test('should handle multiple validation errors', () => {
      const result = validateBookingDates('invalid', 'invalid')
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('Edge Cases', () => {
    test('should handle leap year dates', () => {
      const leapYearDate = new Date('2025-02-28') // Use future leap year date
      const nextDay = new Date('2025-03-01')
      const result = validateBookingDates(leapYearDate.toISOString().split('T')[0], nextDay.toISOString().split('T')[0])
      
      expect(result.isValid).toBe(true)
    })

    test('should handle year boundary', () => {
      const yearEnd = new Date('2024-12-30') // Use future dates
      const yearStart = new Date('2025-01-01')
      const result = validateBookingDates(yearEnd.toISOString().split('T')[0], yearStart.toISOString().split('T')[0])
      
      expect(result.isValid).toBe(true)
    })

    test('should handle timezone differences', () => {
      const utcDate = '2024-01-15T00:00:00.000Z'
      const localDate = '2024-01-15'
      
      const utcResult = parseBookingDates(utcDate.split('T')[0], '2024-01-18')
      const localResult = parseBookingDates(localDate, '2024-01-18')
      
      expect(utcResult.checkIn.getDate()).toBe(localResult.checkIn.getDate())
    })

    test('should handle very short stays', () => {
      const shortStayStart = futureDate1.toISOString().split('T')[0]
      const shortStayEnd = new Date(futureDate1.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const result = validateBookingDates(shortStayStart, shortStayEnd)
      
      expect(result.isValid).toBe(true)
    })

    test('should handle very long stays', () => {
      const longStayStart = futureDate1.toISOString().split('T')[0]
      const longStayEnd = new Date(futureDate1.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const result = validateBookingDates(longStayStart, longStayEnd)
      
      expect(result.isValid).toBe(true)
    })
  })
})


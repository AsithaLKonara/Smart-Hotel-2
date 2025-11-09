// Date validation utilities for hotel bookings

export interface DateValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Check if a date range is valid (start date before end date)
 */
export function isValidDateRange(startDate: Date, endDate: Date): boolean {
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return false
  }
  
  return startDate < endDate
}

/**
 * Check if a date is in the future
 */
export function isDateInFuture(date: Date): boolean {
  if (!date || isNaN(date.getTime())) {
    return false
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  return normalizedDate > today
}

/**
 * Check if a date is in the past
 */
export function isDateInPast(date: Date): boolean {
  if (!date || isNaN(date.getTime())) {
    return false
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  return normalizedDate < today
}

/**
 * Calculate the number of days between two dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0
  }
  
  const MS_PER_DAY = 1000 * 60 * 60 * 24

  const startUTC = Date.UTC(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  )
  const endUTC = Date.UTC(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  )

  const diff = (endUTC - startUTC) / MS_PER_DAY

  return Math.round(diff)
}

/**
 * Format a date for display
 */
export function formatDateForDisplay(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date'
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Parse booking date strings into Date objects
 */
export function parseBookingDates(checkInStr: string, checkOutStr: string): { checkIn: Date; checkOut: Date } {
  if (!checkInStr || !checkOutStr) {
    throw new Error('Check-in and check-out dates are required')
  }
  
  const checkIn = new Date(checkInStr)
  const checkOut = new Date(checkOutStr)
  
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    throw new Error('Invalid date format')
  }
  
  return { checkIn, checkOut }
}

/**
 * Validate booking dates with comprehensive checks
 */
export function validateBookingDates(checkInStr: string, checkOutStr: string): DateValidationResult {
  const errors: string[] = []
  
  // Check if dates are provided
  if (!checkInStr || !checkOutStr) {
    errors.push('Check-in and check-out dates are required')
    return { isValid: false, errors }
  }
  
  const checkIn = new Date(checkInStr)
  const checkOut = new Date(checkOutStr)

  if (isNaN(checkIn.getTime())) {
    errors.push('Invalid date format')
  }

  if (isNaN(checkOut.getTime())) {
    errors.push('Invalid date format')
  }

  if (errors.length) {
    return {
      isValid: false,
      errors
    }
  }

  const normalizedCheckIn = new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate())
  const normalizedCheckOut = new Date(checkOut.getFullYear(), checkOut.getMonth(), checkOut.getDate())
  const today = new Date()
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  if (normalizedCheckIn < normalizedToday) {
    errors.push('Check-in date cannot be in the past')
  }

  if (!isValidDateRange(normalizedCheckIn, normalizedCheckOut)) {
    errors.push('Check-out date must be after check-in date')
  }

  const nights = getDaysBetween(normalizedCheckIn, normalizedCheckOut)

  if (nights < 1) {
    errors.push('Minimum stay is 1 night')
  }

  if (nights > 30) {
    errors.push('Maximum stay is 30 nights')
  }

  const maxAdvanceDate = new Date(normalizedToday)
  maxAdvanceDate.setFullYear(maxAdvanceDate.getFullYear() + 1)

  if (normalizedCheckIn >= maxAdvanceDate) {
    errors.push('Bookings cannot be made more than 12 months in advance')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Check if a date falls on a weekend
 */
export function isWeekend(date: Date): boolean {
  if (!date || isNaN(date.getTime())) {
    return false
  }
  
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday
}

/**
 * Check if a date is a holiday
 */
export function isHoliday(date: Date): boolean {
  if (!date || isNaN(date.getTime())) {
    return false
  }
  
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  // Major US holidays
  const holidays = [
    { month: 1, day: 1 },   // New Year's Day
    { month: 7, day: 4 },   // Independence Day
    { month: 12, day: 25 },  // Christmas Day
    { month: 12, day: 31 }   // New Year's Eve
  ]
  
  return holidays.some(holiday => holiday.month === month && holiday.day === day)
}

/**
 * Get the next business day (skip weekends and holidays)
 */
export function getNextBusinessDay(date: Date): Date {
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)
  
  while (isWeekend(nextDay) || isHoliday(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1)
  }
  
  return nextDay
}

/**
 * Check if a date range includes weekends
 */
export function includesWeekend(startDate: Date, endDate: Date): boolean {
  const current = new Date(startDate)
  
  while (current < endDate) {
    if (isWeekend(current)) {
      return true
    }
    current.setDate(current.getDate() + 1)
  }
  
  return false
}

/**
 * Check if a date range includes holidays
 */
export function includesHoliday(startDate: Date, endDate: Date): boolean {
  const current = new Date(startDate)
  
  while (current < endDate) {
    if (isHoliday(current)) {
      return true
    }
    current.setDate(current.getDate() + 1)
  }
  
  return false
}

/**
 * Get the season for a given date
 */
export function getSeason(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return 'unknown'
  }
  
  const month = date.getMonth() + 1
  
  if (month >= 3 && month <= 5) {
    return 'spring'
  } else if (month >= 6 && month <= 8) {
    return 'summer'
  } else if (month >= 9 && month <= 11) {
    return 'autumn'
  } else {
    return 'winter'
  }
}

/**
 * Check if a date is in peak season
 */
export function isPeakSeason(date: Date): boolean {
  const season = getSeason(date)
  const month = date.getMonth() + 1
  
  // Summer months (June-August) and December are peak season
  return season === 'summer' || month === 12
}


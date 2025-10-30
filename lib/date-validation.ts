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
  today.setHours(0, 0, 0, 0) // Reset time to start of day
  
  return date > today
}

/**
 * Check if a date is in the past
 */
export function isDateInPast(date: Date): boolean {
  if (!date || isNaN(date.getTime())) {
    return false
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day
  
  return date < today
}

/**
 * Calculate the number of days between two dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0
  }
  
  const timeDiff = endDate.getTime() - startDate.getTime()
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
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
  
  try {
    const { checkIn, checkOut } = parseBookingDates(checkInStr, checkOutStr)
    
    // Check if check-in is in the future
    if (!isDateInFuture(checkIn)) {
      errors.push('Check-in date cannot be in the past')
    }
    
    // Check if check-out is after check-in
    if (!isValidDateRange(checkIn, checkOut)) {
      errors.push('Check-out date must be after check-in date')
    }
    
    // Check if booking is too far in advance (12 months)
    const maxAdvanceDate = new Date()
    maxAdvanceDate.setFullYear(maxAdvanceDate.getFullYear() + 1)
    if (checkIn > maxAdvanceDate) {
      errors.push('Bookings cannot be made more than 12 months in advance')
    }
    
    // Check if booking is too far in the past
    const minDate = new Date()
    minDate.setDate(minDate.getDate() - 1) // Allow yesterday for same-day bookings
    if (checkIn < minDate) {
      errors.push('Check-in date cannot be in the past')
    }
    
    // Check minimum stay duration (1 night)
    const nights = getDaysBetween(checkIn, checkOut)
    if (nights < 1) {
      errors.push('Minimum stay is 1 night')
    }
    
    // Check maximum stay duration (30 nights)
    if (nights > 30) {
      errors.push('Maximum stay is 30 nights')
    }
    
  } catch (error) {
    errors.push('Invalid date format')
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


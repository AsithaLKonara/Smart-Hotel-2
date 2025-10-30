// Price calculation utilities for hotel bookings

export interface Room {
  type: string
  price: number
  maxOccupancy: number
}

export interface Booking {
  checkIn: string
  checkOut: string
  guests: number
  roomType: string
}

export interface Discount {
  type: 'percentage' | 'fixed'
  value: number
}

/**
 * Calculate the base price for a booking based on room price and number of nights
 */
export function calculateBookingPrice(room: Room, booking: Booking): number {
  const checkInDate = new Date(booking.checkIn)
  const checkOutDate = new Date(booking.checkOut)
  
  if (checkOutDate <= checkInDate) {
    throw new Error('Check-out date must be after check-in date')
  }
  
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
  const basePrice = room.price * nights
  
  return Math.round(basePrice * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate the total price including discounts and taxes
 */
export function calculateTotalPrice(basePrice: number, discount: number, tax: number): number {
  const discountedPrice = basePrice - discount
  const totalPrice = discountedPrice + tax
  
  return Math.round(totalPrice * 100) / 100 // Round to 2 decimal places
}

/**
 * Apply a discount to a price
 */
export function applyDiscount(price: number, discount: Discount): number {
  if (discount.type === 'percentage') {
    if (discount.value < 0 || discount.value > 100) {
      throw new Error('Percentage discount must be between 0 and 100')
    }
    return Math.round((price * discount.value / 100) * 100) / 100
  } else if (discount.type === 'fixed') {
    if (discount.value < 0) {
      throw new Error('Fixed discount cannot be negative')
    }
    return Math.min(discount.value, price) // Discount cannot exceed total price
  } else {
    throw new Error('Invalid discount type')
  }
}

/**
 * Calculate tax on a given amount
 */
export function calculateTax(amount: number, taxRate: number): number {
  return Math.round((amount * taxRate / 100) * 100) / 100
}

/**
 * Calculate the number of nights between two dates
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  
  if (checkOutDate <= checkInDate) {
    return 0
  }
  
  return Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Calculate seasonal pricing multiplier
 */
export function getSeasonalMultiplier(date: string): number {
  const bookingDate = new Date(date)
  const month = bookingDate.getMonth() + 1 // 1-12
  
  // Peak season: June-August (summer)
  if (month >= 6 && month <= 8) {
    return 1.3
  }
  
  // Holiday season: December
  if (month === 12) {
    return 1.5
  }
  
  // Shoulder season: April-May, September-November
  if ((month >= 4 && month <= 5) || (month >= 9 && month <= 11)) {
    return 1.1
  }
  
  // Low season: January-March
  return 1.0
}

/**
 * Calculate loyalty member discount based on tier
 */
export function getLoyaltyDiscount(membershipTier: string): Discount {
  switch (membershipTier.toLowerCase()) {
    case 'bronze':
      return { type: 'percentage', value: 5 }
    case 'silver':
      return { type: 'percentage', value: 10 }
    case 'gold':
      return { type: 'percentage', value: 15 }
    case 'platinum':
      return { type: 'percentage', value: 20 }
    default:
      return { type: 'percentage', value: 0 }
  }
}

/**
 * Calculate early booking discount
 */
export function getEarlyBookingDiscount(checkIn: string): Discount {
  const checkInDate = new Date(checkIn)
  const today = new Date()
  const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntilCheckIn >= 30) {
    return { type: 'percentage', value: 15 }
  } else if (daysUntilCheckIn >= 14) {
    return { type: 'percentage', value: 10 }
  } else if (daysUntilCheckIn >= 7) {
    return { type: 'percentage', value: 5 }
  }
  
  return { type: 'percentage', value: 0 }
}

/**
 * Calculate group discount based on number of rooms
 */
export function getGroupDiscount(roomCount: number): Discount {
  if (roomCount >= 10) {
    return { type: 'percentage', value: 20 }
  } else if (roomCount >= 5) {
    return { type: 'percentage', value: 15 }
  } else if (roomCount >= 3) {
    return { type: 'percentage', value: 10 }
  }
  
  return { type: 'percentage', value: 0 }
}

/**
 * Calculate extended stay discount
 */
export function getExtendedStayDiscount(nights: number): Discount {
  if (nights >= 14) {
    return { type: 'percentage', value: 25 }
  } else if (nights >= 7) {
    return { type: 'percentage', value: 15 }
  } else if (nights >= 3) {
    return { type: 'percentage', value: 5 }
  }
  
  return { type: 'percentage', value: 0 }
}


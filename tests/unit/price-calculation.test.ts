import {
  calculateBookingPrice,
  calculateTotalPrice,
  applyDiscount,
  calculateTax,
  calculateNights,
  getSeasonalMultiplier,
  getLoyaltyDiscount,
  getEarlyBookingDiscount,
  getGroupDiscount,
  getExtendedStayDiscount,
  Room,
  Booking
} from '../../lib/price-calculation'

describe('Price Calculation Logic', () => {
  describe('calculateNights', () => {
    it('should calculate the correct number of nights for a valid stay', () => {
      const nights = calculateNights('2026-06-15', '2026-06-20')
      expect(nights).toBe(5)
    })

    it('should default to 1 night if check-out is the same day', () => {
      const nights = calculateNights('2026-06-15', '2026-06-15')
      expect(nights).toBe(1)
    })

    it('should return 0 for invalid dates', () => {
      const nights = calculateNights('invalid', 'dates')
      expect(nights).toBe(0)
    })

    it('should return 0 if checkout is before checkin', () => {
      const nights = calculateNights('2026-06-20', '2026-06-15')
      expect(nights).toBe(0)
    })
  })

  describe('calculateBookingPrice', () => {
    const mockRoom: Room = {
      type: 'DELUXE',
      price: 150.00,
      maxOccupancy: 2
    }

    it('should calculate correct base price', () => {
      const mockBooking: Booking = {
        checkIn: '2026-06-01',
        checkOut: '2026-06-05',
        guests: 2,
        roomType: 'DELUXE'
      }
      const price = calculateBookingPrice(mockRoom, mockBooking)
      // 4 nights * 150 = 600
      expect(price).toBe(600)
    })

    it('should throw an error for invalid dates', () => {
      const invalidBooking: Booking = {
        checkIn: 'invalid',
        checkOut: '2026-06-05',
        guests: 2,
        roomType: 'DELUXE'
      }
      expect(() => calculateBookingPrice(mockRoom, invalidBooking)).toThrow('Invalid booking dates')
    })
  })

  describe('applyDiscount', () => {
    it('should apply percentage discount correctly', () => {
      const discounted = applyDiscount(100, { type: 'percentage', value: 15 })
      expect(discounted).toBe(15) // Wait, logic says `(price * discount.value / 100)` -> 100 * 15 / 100 = 15. The function returns the DISCOUNT AMOUNT, wait no it returns `15`. Wait.
      // Ah let's check `applyDiscount` code:
      // Math.round((price * discount.value / 100) * 100) / 100
      // Yes it returns the discount amount itself.
    })

    it('should apply fixed discount correctly', () => {
      const discounted = applyDiscount(100, { type: 'fixed', value: 25 })
      expect(discounted).toBe(25)
    })

    it('should cap fixed discount to total price', () => {
      const discounted = applyDiscount(50, { type: 'fixed', value: 100 })
      expect(discounted).toBe(50)
    })
  })

  describe('calculateTotalPrice', () => {
    it('should calculate final price correctly', () => {
      const base = 100
      const discount = 20
      const tax = 8
      expect(calculateTotalPrice(base, discount, tax)).toBe(88) // 100 - 20 + 8
    })
  })

  describe('getLoyaltyDiscount', () => {
    it('should return correct discount based on tier', () => {
      expect(getLoyaltyDiscount('gold')).toEqual({ type: 'percentage', value: 15 })
      expect(getLoyaltyDiscount('UNKNOWN')).toEqual({ type: 'percentage', value: 0 })
    })
  })

  describe('calculateTax', () => {
    it('should calculate tax correctly based on rate', () => {
      expect(calculateTax(100, 8.5)).toBe(8.5)
      expect(calculateTax(150, 10)).toBe(15)
    })
  })

  describe('getSeasonalMultiplier', () => {
    it('should return summer peak season multiplier', () => {
      expect(getSeasonalMultiplier('2026-07-15')).toBe(1.3)
    })

    it('should return holiday peak season multiplier', () => {
      expect(getSeasonalMultiplier('2026-12-25')).toBe(1.5)
    })

    it('should return shoulder season multiplier', () => {
      expect(getSeasonalMultiplier('2026-05-15')).toBe(1.1)
    })

    it('should return low season multiplier', () => {
      expect(getSeasonalMultiplier('2026-02-15')).toBe(1.0)
    })
  })

  describe('getEarlyBookingDiscount', () => {
    it('should return appropriate discount based on lead time', () => {
      const thirtyDaysAhead = new Date()
      thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 32)
      expect(getEarlyBookingDiscount(thirtyDaysAhead.toISOString())).toEqual({ type: 'percentage', value: 15 })

      const fourteenDaysAhead = new Date()
      fourteenDaysAhead.setDate(fourteenDaysAhead.getDate() + 15)
      expect(getEarlyBookingDiscount(fourteenDaysAhead.toISOString())).toEqual({ type: 'percentage', value: 10 })

      const sevenDaysAhead = new Date()
      sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 8)
      expect(getEarlyBookingDiscount(sevenDaysAhead.toISOString())).toEqual({ type: 'percentage', value: 5 })

      const twoDaysAhead = new Date()
      twoDaysAhead.setDate(twoDaysAhead.getDate() + 2)
      expect(getEarlyBookingDiscount(twoDaysAhead.toISOString())).toEqual({ type: 'percentage', value: 0 })
    })
  })

  describe('getGroupDiscount', () => {
    it('should return discount based on room count', () => {
      expect(getGroupDiscount(12)).toEqual({ type: 'percentage', value: 20 })
      expect(getGroupDiscount(6)).toEqual({ type: 'percentage', value: 15 })
      expect(getGroupDiscount(4)).toEqual({ type: 'percentage', value: 10 })
      expect(getGroupDiscount(2)).toEqual({ type: 'percentage', value: 0 })
    })
  })

  describe('getExtendedStayDiscount', () => {
    it('should return discount based on number of nights', () => {
      expect(getExtendedStayDiscount(15)).toEqual({ type: 'percentage', value: 25 })
      expect(getExtendedStayDiscount(8)).toEqual({ type: 'percentage', value: 15 })
      expect(getExtendedStayDiscount(4)).toEqual({ type: 'percentage', value: 5 })
      expect(getExtendedStayDiscount(2)).toEqual({ type: 'percentage', value: 0 })
    })
  })
})

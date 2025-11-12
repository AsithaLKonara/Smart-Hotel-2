import { jest } from '@jest/globals'
import {
  applyDiscount,
  calculateBookingPrice,
  calculateNights,
  calculateTax,
  calculateTotalPrice,
  getEarlyBookingDiscount,
  getExtendedStayDiscount,
  getGroupDiscount,
  getLoyaltyDiscount,
  getSeasonalMultiplier,
} from '@/lib/price-calculation'

describe('lib/price-calculation', () => {
  const room = {
    type: 'Deluxe',
    price: 250,
    maxOccupancy: 3,
  }

  describe('calculateBookingPrice', () => {
    it('computes price based on room rate and length of stay', () => {
      const total = calculateBookingPrice(room, {
        roomType: 'Deluxe',
        guests: 2,
        checkIn: '2025-03-01',
        checkOut: '2025-03-04',
      })

      expect(total).toBeCloseTo(750)
    })

    it('charges at least one night when check-in equals check-out', () => {
      const total = calculateBookingPrice(room, {
        roomType: 'Deluxe',
        guests: 2,
        checkIn: '2025-03-01',
        checkOut: '2025-03-01',
      })

      expect(total).toBeCloseTo(250)
    })

    it('throws when dates are invalid', () => {
      expect(() =>
        calculateBookingPrice(room, {
          roomType: 'Deluxe',
          guests: 2,
          checkIn: 'invalid',
          checkOut: '2025-03-02',
        }),
      ).toThrow('Invalid booking dates')
    })

    it('throws when checkout precedes checkin', () => {
      expect(() =>
        calculateBookingPrice(room, {
          roomType: 'Deluxe',
          guests: 2,
          checkIn: '2025-03-10',
          checkOut: '2025-03-08',
        }),
      ).toThrow('Check-out date must be after check-in date')
    })
  })

  describe('calculateTotalPrice', () => {
    it('applies discount and tax rounding to two decimals', () => {
      expect(calculateTotalPrice(1000, 200, 123.456)).toBe(923.46)
    })
  })

  describe('applyDiscount', () => {
    it('handles percentage discounts', () => {
      expect(applyDiscount(800, { type: 'percentage', value: 12.5 })).toBe(100)
    })

    it('rejects invalid percentage values', () => {
      expect(() => applyDiscount(800, { type: 'percentage', value: 150 })).toThrow(
        'Percentage discount must be between 0 and 100',
      )
      expect(() => applyDiscount(800, { type: 'percentage', value: -10 })).toThrow(
        'Percentage discount must be between 0 and 100',
      )
    })

    it('applies fixed discounts capped to price', () => {
      expect(applyDiscount(500, { type: 'fixed', value: 50 })).toBe(50)
      expect(applyDiscount(500, { type: 'fixed', value: 800 })).toBe(500)
    })

    it('rejects negative fixed discounts', () => {
      expect(() => applyDiscount(400, { type: 'fixed', value: -5 })).toThrow('Fixed discount cannot be negative')
    })

    it('throws for unsupported discount types', () => {
      expect(() => applyDiscount(400, { type: 'bogus' as any, value: 10 })).toThrow('Invalid discount type')
    })
  })

  describe('calculateTax', () => {
    it('rounds tax to two decimals', () => {
      expect(calculateTax(1234.56, 12.5)).toBe(154.32)
    })
  })

  describe('calculateNights', () => {
    it('returns number of nights between two dates', () => {
      expect(calculateNights('2025-05-01', '2025-05-05')).toBe(4)
    })

    it('returns 1 night minimum when dates are the same', () => {
      expect(calculateNights('2025-05-01', '2025-05-01')).toBe(1)
    })

    it('returns 0 when dates are invalid or inverted', () => {
      expect(calculateNights('invalid', '2025-05-05')).toBe(0)
      expect(calculateNights('2025-05-10', '2025-05-05')).toBe(0)
    })
  })

  describe('getSeasonalMultiplier', () => {
    it.each([
      ['2025-01-15', 1.0],
      ['2025-04-10', 1.1],
      ['2025-10-05', 1.1],
      ['2025-07-22', 1.3],
      ['2025-12-05', 1.5],
    ])('returns %d multiplier for %s', (date, multiplier) => {
      expect(getSeasonalMultiplier(date)).toBe(multiplier)
    })
  })

  describe('getLoyaltyDiscount', () => {
    it.each([
      ['bronze', 5],
      ['silver', 10],
      ['gold', 15],
      ['platinum', 20],
      ['guest', 0],
    ])('returns %i%% for %s members', (tier, expected) => {
      expect(getLoyaltyDiscount(tier)).toEqual({ type: 'percentage', value: expected })
    })
  })

  describe('getEarlyBookingDiscount', () => {
    const fixedNow = new Date('2025-01-01T00:00:00.000Z')

    beforeAll(() => {
      jest.useFakeTimers()
      jest.setSystemTime(fixedNow)
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    it.each([
      [35, 15],
      [20, 10],
      [10, 5],
      [2, 0],
    ])('returns %i%% when check-in is %i days away', (daysOut, expected) => {
      const checkIn = new Date(fixedNow.getTime() + daysOut * 24 * 60 * 60 * 1000)
      expect(getEarlyBookingDiscount(checkIn.toISOString())).toEqual({ type: 'percentage', value: expected })
    })
  })

  describe('getGroupDiscount', () => {
    it.each([
      [1, 0],
      [3, 10],
      [5, 15],
      [10, 20],
    ])('returns %i%% for %i rooms', (rooms, expected) => {
      expect(getGroupDiscount(rooms)).toEqual({ type: 'percentage', value: expected })
    })
  })

  describe('getExtendedStayDiscount', () => {
    it.each([
      [1, 0],
      [3, 5],
      [7, 15],
      [14, 25],
    ])('returns %i%% for %i nights', (nights, expected) => {
      expect(getExtendedStayDiscount(nights)).toEqual({ type: 'percentage', value: expected })
    })
  })
})


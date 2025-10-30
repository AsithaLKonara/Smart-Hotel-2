import { calculateBookingPrice, calculateTotalPrice, applyDiscount, calculateTax } from '@/lib/price-calculation'

describe('Price Calculation', () => {
  const mockRoom = {
    type: 'Deluxe King',
    price: 299,
    maxOccupancy: 2
  }

  const mockBooking = {
    checkIn: '2024-01-15',
    checkOut: '2024-01-18',
    guests: 2,
    roomType: 'Deluxe King'
  }

  describe('calculateBookingPrice', () => {
    test('should calculate correct price for 3 nights', () => {
      const price = calculateBookingPrice(mockRoom, mockBooking)
      
      expect(price).toBe(897) // 299 * 3 nights
    })

    test('should calculate correct price for 1 night', () => {
      const oneNightBooking = {
        ...mockBooking,
        checkOut: '2024-01-16'
      }
      
      const price = calculateBookingPrice(mockRoom, oneNightBooking)
      
      expect(price).toBe(299)
    })

    test('should calculate correct price for 7 nights', () => {
      const weekBooking = {
        ...mockBooking,
        checkOut: '2024-01-22'
      }
      
      const price = calculateBookingPrice(mockRoom, weekBooking)
      
      expect(price).toBe(2093) // 299 * 7 nights
    })

    test('should handle invalid dates', () => {
      const invalidBooking = {
        ...mockBooking,
        checkIn: '2024-01-18',
        checkOut: '2024-01-15' // Check-out before check-in
      }
      
      expect(() => calculateBookingPrice(mockRoom, invalidBooking)).toThrow()
    })

    test('should handle same day check-in/out', () => {
      const sameDayBooking = {
        ...mockBooking,
        checkOut: '2024-01-15'
      }
      
      const price = calculateBookingPrice(mockRoom, sameDayBooking)
      
      expect(price).toBe(299) // Minimum 1 night
    })
  })

  describe('calculateTotalPrice', () => {
    test('should calculate total with base price only', () => {
      const total = calculateTotalPrice(897, 0, 0)
      
      expect(total).toBe(897)
    })

    test('should calculate total with taxes', () => {
      const total = calculateTotalPrice(897, 0, 89.7) // 10% tax
      
      expect(total).toBe(986.7)
    })

    test('should calculate total with discounts', () => {
      const total = calculateTotalPrice(897, 89.7, 0) // 10% discount
      
      expect(total).toBe(807.3)
    })

    test('should calculate total with both discount and tax', () => {
      const total = calculateTotalPrice(897, 89.7, 80.73) // 10% discount, 10% tax on discounted amount
      
      expect(total).toBe(888.03)
    })

    test('should handle negative values', () => {
      const total = calculateTotalPrice(897, -50, 0)
      
      expect(total).toBe(947) // Negative discount becomes additional charge
    })
  })

  describe('applyDiscount', () => {
    test('should apply percentage discount', () => {
      const discount = applyDiscount(897, { type: 'percentage', value: 10 })
      
      expect(discount).toBe(89.7)
    })

    test('should apply fixed amount discount', () => {
      const discount = applyDiscount(897, { type: 'fixed', value: 100 })
      
      expect(discount).toBe(100)
    })

    test('should not exceed total price for fixed discount', () => {
      const discount = applyDiscount(897, { type: 'fixed', value: 1000 })
      
      expect(discount).toBe(897) // Discount cannot exceed total price
    })

    test('should handle zero discount', () => {
      const discount = applyDiscount(897, { type: 'percentage', value: 0 })
      
      expect(discount).toBe(0)
    })

    test('should handle 100% discount', () => {
      const discount = applyDiscount(897, { type: 'percentage', value: 100 })
      
      expect(discount).toBe(897)
    })

    test('should handle invalid discount type', () => {
      expect(() => applyDiscount(897, { type: 'invalid' as any, value: 10 })).toThrow()
    })
  })

  describe('calculateTax', () => {
    test('should calculate tax correctly', () => {
      const tax = calculateTax(897, 10) // 10% tax rate
      
      expect(tax).toBe(89.7)
    })

    test('should handle zero tax rate', () => {
      const tax = calculateTax(897, 0)
      
      expect(tax).toBe(0)
    })

    test('should handle high tax rate', () => {
      const tax = calculateTax(897, 25) // 25% tax rate
      
      expect(tax).toBe(224.25)
    })

    test('should round tax to 2 decimal places', () => {
      const tax = calculateTax(100, 8.25) // 8.25% tax rate
      
      expect(tax).toBe(8.25)
    })

    test('should handle negative tax rate', () => {
      const tax = calculateTax(897, -5) // Negative tax rate (refund)
      
      expect(tax).toBe(-44.85)
    })
  })

  describe('Edge Cases', () => {
    test('should handle very small amounts', () => {
      const price = calculateBookingPrice({ ...mockRoom, price: 0.01 }, mockBooking)
      
      expect(price).toBe(0.03) // 0.01 * 3 nights
    })

    test('should handle very large amounts', () => {
      const price = calculateBookingPrice({ ...mockRoom, price: 9999.99 }, mockBooking)
      
      expect(price).toBe(29999.97) // 9999.99 * 3 nights
    })

    test('should handle decimal room prices', () => {
      const price = calculateBookingPrice({ ...mockRoom, price: 299.99 }, mockBooking)
      
      expect(price).toBe(899.97) // 299.99 * 3 nights
    })

    test('should handle fractional tax rates', () => {
      const tax = calculateTax(100, 8.75) // 8.75% tax rate
      
      expect(tax).toBe(8.75)
    })
  })

  describe('Integration Tests', () => {
    test('should calculate complete booking total', () => {
      const basePrice = calculateBookingPrice(mockRoom, mockBooking)
      const discount = applyDiscount(basePrice, { type: 'percentage', value: 5 })
      const tax = calculateTax(basePrice - discount, 10)
      const total = calculateTotalPrice(basePrice, discount, tax)
      
      expect(basePrice).toBe(897)
      expect(discount).toBe(44.85)
      expect(tax).toBe(85.22)
      expect(total).toBe(937.365)
    })

    test('should handle loyalty member discount', () => {
      const basePrice = calculateBookingPrice(mockRoom, mockBooking)
      const loyaltyDiscount = applyDiscount(basePrice, { type: 'percentage', value: 15 })
      const tax = calculateTax(basePrice - loyaltyDiscount, 10)
      const total = calculateTotalPrice(basePrice, loyaltyDiscount, tax)
      
      expect(loyaltyDiscount).toBe(134.55)
      expect(total).toBe(838.7)
    })

    test('should handle promotional pricing', () => {
      const promotionalRoom = { ...mockRoom, price: 199 } // Promotional rate
      const basePrice = calculateBookingPrice(promotionalRoom, mockBooking)
      const tax = calculateTax(basePrice, 10)
      const total = calculateTotalPrice(basePrice, 0, tax)
      
      expect(basePrice).toBe(597)
      expect(tax).toBe(59.7)
      expect(total).toBe(656.7)
    })
  })
})


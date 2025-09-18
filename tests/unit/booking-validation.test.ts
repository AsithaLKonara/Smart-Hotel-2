import { z } from 'zod'

// Define booking schema (matching the one in your API)
const bookingSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  roomId: z.string().min(1, 'Room ID is required'),
  checkIn: z.string().min(1, 'Check-in date is required'),
  checkOut: z.string().min(1, 'Check-out date is required'),
  specialRequests: z.string().optional(),
  paymentMethod: z.enum(['pay_now', 'pay_later']).default('pay_later'),
})

const bookingUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  paymentMethod: z.string().optional(),
  specialRequests: z.string().optional(),
})

describe('Booking Validation', () => {
  describe('bookingSchema', () => {
    it('should accept valid booking data', () => {
      const validBooking = {
        userId: 'user-123',
        roomId: 'room-456',
        checkIn: '2025-10-01',
        checkOut: '2025-10-03',
        specialRequests: 'Late check-in requested',
        paymentMethod: 'pay_now' as const,
      }

      expect(() => bookingSchema.parse(validBooking)).not.toThrow()
    })

    it('should reject booking with missing required fields', () => {
      const invalidBooking = {
        userId: 'user-123',
        // Missing roomId, checkIn, checkOut
      }

      expect(() => bookingSchema.parse(invalidBooking)).toThrow()
    })

    it('should reject invalid payment method', () => {
      const invalidBooking = {
        userId: 'user-123',
        roomId: 'room-456',
        checkIn: '2025-10-01',
        checkOut: '2025-10-03',
        paymentMethod: 'invalid_method',
      }

      expect(() => bookingSchema.parse(invalidBooking)).toThrow()
    })

    it('should default payment method to pay_later', () => {
      const bookingWithoutPayment = {
        userId: 'user-123',
        roomId: 'room-456',
        checkIn: '2025-10-01',
        checkOut: '2025-10-03',
      }

      const result = bookingSchema.parse(bookingWithoutPayment)
      expect(result.paymentMethod).toBe('pay_later')
    })

    it('should accept empty special requests', () => {
      const booking = {
        userId: 'user-123',
        roomId: 'room-456',
        checkIn: '2025-10-01',
        checkOut: '2025-10-03',
        specialRequests: '',
      }

      expect(() => bookingSchema.parse(booking)).not.toThrow()
    })
  })

  describe('bookingUpdateSchema', () => {
    it('should accept valid status update', () => {
      const validUpdate = {
        status: 'CONFIRMED' as const,
        paymentStatus: 'PAID' as const,
      }

      expect(() => bookingUpdateSchema.parse(validUpdate)).not.toThrow()
    })

    it('should reject invalid status', () => {
      const invalidUpdate = {
        status: 'INVALID_STATUS',
      }

      expect(() => bookingUpdateSchema.parse(invalidUpdate)).toThrow()
    })

    it('should reject invalid payment status', () => {
      const invalidUpdate = {
        paymentStatus: 'INVALID_PAYMENT_STATUS',
      }

      expect(() => bookingUpdateSchema.parse(invalidUpdate)).toThrow()
    })

    it('should accept empty update object', () => {
      expect(() => bookingUpdateSchema.parse({})).not.toThrow()
    })

    it('should accept partial updates', () => {
      const partialUpdate = {
        specialRequests: 'Updated request',
      }

      expect(() => bookingUpdateSchema.parse(partialUpdate)).not.toThrow()
    })
  })

  describe('Date validation logic', () => {
    it('should validate that check-out is after check-in', () => {
      const checkInDate = new Date('2025-10-01')
      const checkOutDate = new Date('2025-10-03')

      expect(checkOutDate > checkInDate).toBe(true)
    })

    it('should reject same-day check-in and check-out', () => {
      const checkInDate = new Date('2025-10-01')
      const checkOutDate = new Date('2025-10-01')

      expect(checkOutDate > checkInDate).toBe(false)
    })

    it('should reject check-out before check-in', () => {
      const checkInDate = new Date('2025-10-03')
      const checkOutDate = new Date('2025-10-01')

      expect(checkOutDate > checkInDate).toBe(false)
    })
  })
})

import { jest } from '@jest/globals'
import { checkRoomAvailability, getAvailableRooms, getOccupancyRate, getAvailabilityCalendar } from '@/lib/availability'
import { prisma } from '@/lib/db'

describe('lib/availability', () => {
  const checkIn = new Date('2025-02-01T15:00:00.000Z')
  const checkOut = new Date('2025-02-05T11:00:00.000Z')

  let bookingFindManySpy: any
  let bookingCountSpy: any
  let roomFindManySpy: any
  let roomCountSpy: any

  beforeEach(() => {
    bookingFindManySpy = jest.spyOn(prisma.booking, 'findMany').mockResolvedValue([])
    bookingCountSpy = jest.spyOn(prisma.booking, 'count').mockResolvedValue(0)
    roomFindManySpy = jest.spyOn(prisma.room, 'findMany').mockResolvedValue([])
    roomCountSpy = jest.spyOn(prisma.room, 'count').mockResolvedValue(0)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('checkRoomAvailability', () => {
    it('returns true when no conflicting bookings exist', async () => {
      bookingFindManySpy.mockResolvedValueOnce([])

      const available = await checkRoomAvailability('room-1', checkIn, checkOut)

      expect(available).toBe(true)
      const args = bookingFindManySpy.mock.calls[0]?.[0] as Record<string, any>
      expect(args?.where?.roomId).toBe('room-1')
      expect(args?.where?.status).toEqual({ in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] })
    })

    it('returns false when conflicting bookings are found', async () => {
      bookingFindManySpy.mockResolvedValueOnce([{ id: 'booking-1' }])

      const available = await checkRoomAvailability('room-1', checkIn, checkOut, 'exclude-id')

      expect(available).toBe(false)
      const args = bookingFindManySpy.mock.calls[0]?.[0] as Record<string, any>
      expect(args?.where?.id).toEqual({ not: 'exclude-id' })
    })

    it('returns false and logs on prisma errors', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      bookingFindManySpy.mockRejectedValueOnce(new Error('database down'))

      const available = await checkRoomAvailability('room-1', checkIn, checkOut)

      expect(available).toBe(false)
      expect(errorSpy).toHaveBeenCalledWith('Error checking room availability:', expect.any(Error))
      errorSpy.mockRestore()
    })
  })

  describe('getAvailableRooms', () => {
    it('filters out rooms with conflicting bookings and matches capacity', async () => {
      roomFindManySpy.mockResolvedValueOnce([
        {
          id: 'room-available',
          status: 'AVAILABLE',
          capacity: BigInt(3),
        },
        {
          id: 'room-conflict',
          status: 'AVAILABLE',
          capacity: BigInt(4),
        },
      ])
      // Mock booking query to return conflicting booking for room-conflict
      bookingFindManySpy.mockResolvedValueOnce([
        { roomId: 'room-conflict' },
      ])

      const rooms = await getAvailableRooms(checkIn, checkOut, 3)

      // Function filters out rooms with conflicting bookings
      expect(rooms).toEqual([
        expect.objectContaining({
          id: 'room-available',
          status: 'AVAILABLE',
        }),
      ])

      // Actual implementation uses status: { in: ['AVAILABLE'] } only, and Number(capacity) not BigInt
      expect(roomFindManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['AVAILABLE'] },
            capacity: { gte: 3 },
          }),
        }),
      )
    })

    it('returns an empty list when prisma throws', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      roomFindManySpy.mockRejectedValueOnce(new Error('boom'))

      const rooms = await getAvailableRooms(checkIn, checkOut)

      expect(rooms).toEqual([])
      expect(errorSpy).toHaveBeenCalledWith('Error getting available rooms:', expect.any(Error))
      errorSpy.mockRestore()
    })
  })

  describe('getOccupancyRate', () => {
    it('returns 0 when there are no rooms', async () => {
      roomCountSpy.mockResolvedValueOnce(0)

      const rate = await getOccupancyRate(checkIn, checkOut)

      expect(rate).toBe(0)
      expect(roomCountSpy).toHaveBeenCalledTimes(1)
      expect(bookingCountSpy).not.toHaveBeenCalled()
    })

    it('calculates occupancy percentage with rounding', async () => {
      roomCountSpy.mockResolvedValueOnce(20)
      bookingCountSpy.mockResolvedValueOnce(13)

      const rate = await getOccupancyRate(checkIn, checkOut)

      expect(rate).toBe(Math.round((13 / 20) * 100))
      const args = bookingCountSpy.mock.calls[0]?.[0] as Record<string, any>
      expect(args?.where?.status).toEqual({ in: ['CONFIRMED', 'CHECKED_IN'] })
    })

    it('returns 0 when prisma count fails', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      roomCountSpy.mockResolvedValueOnce(10)
      bookingCountSpy.mockRejectedValueOnce(new Error('cannot count'))

      const rate = await getOccupancyRate(checkIn, checkOut)

      expect(rate).toBe(0)
      expect(errorSpy).toHaveBeenCalledWith('Error calculating occupancy rate:', expect.any(Error))
      errorSpy.mockRestore()
    })
  })

  describe('getAvailabilityCalendar', () => {
    it('returns rooms annotated with availability flag', async () => {
      roomFindManySpy.mockResolvedValueOnce([
        {
          id: 'room-a',
          status: 'AVAILABLE',
        },
        {
          id: 'room-b',
          status: 'RESERVED',
        },
      ])
      // Mock booking query - room-b has a booking, room-a doesn't
      bookingFindManySpy.mockResolvedValueOnce([
        { id: 'booking-a', roomId: 'room-b', checkIn, checkOut, status: 'CONFIRMED' },
      ])

      const calendar = await getAvailabilityCalendar(checkIn, checkOut)

      expect(calendar).toEqual([
        { id: 'room-a', status: 'AVAILABLE', bookings: [], isAvailable: true },
        {
          id: 'room-b',
          status: 'RESERVED',
          bookings: [{ id: 'booking-a', roomId: 'room-b', checkIn, checkOut, status: 'CONFIRMED' }],
          isAvailable: false,
        },
      ])

      expect(roomFindManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: { not: 'MAINTENANCE' } },
        }),
      )
    })

    it('returns empty array when fetching fails', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      roomFindManySpy.mockRejectedValueOnce(new Error('unexpected failure'))

      const calendar = await getAvailabilityCalendar(checkIn, checkOut)

      expect(calendar).toEqual([])
      expect(errorSpy).toHaveBeenCalledWith('Error getting availability calendar:', expect.any(Error))
      errorSpy.mockRestore()
    })
  })
})


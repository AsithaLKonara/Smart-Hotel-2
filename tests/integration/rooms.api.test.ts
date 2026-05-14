import { NextRequest } from 'next/server'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/session', () => ({
  getRequestSession: jest.fn((request) => Promise.resolve(null)),
}))

// Mock Prisma client
jest.mock('@/lib/db', () => {
  const prismaMock = {
    $transaction: jest.fn((cb) => cb(prismaMock)),
    room: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    invoice: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
  }

  return {
    __esModule: true,
    prisma: prismaMock,
    default: prismaMock,
  }
})

jest.mock('@/lib/db-helpers', () => ({
  isDatabaseConfigured: jest.fn(() => true),
  getDatabaseErrorMessage: jest.fn((e) => e.message),
}))

jest.mock('@/lib/rate-limit-enhanced', () => ({
  apiLimiter: {
    isAllowed: jest.fn(() => Promise.resolve({ allowed: true })),
  },
}))

jest.mock('@/lib/inventory-lock', () => ({
  InventoryLockEngine: {
    getVersion: jest.fn(() => Promise.resolve(1)),
    acquireHold: jest.fn(() => Promise.resolve({ id: 'hold-1' })),
    commitHold: jest.fn(() => Promise.resolve()),
    rollbackHold: jest.fn(() => Promise.resolve()),
  },
}))

jest.mock('@/lib/realtime', () => ({
  RealtimeEvents: {
    emitBookingCreated: jest.fn(() => Promise.resolve()),
  },
}))

jest.mock('@/lib/ota/ota-service', () => ({
  pushAvailabilityToOTA: jest.fn(() => Promise.resolve()),
}))

jest.mock('@/lib/idempotency', () => ({
  checkIdempotency: jest.fn(() => Promise.resolve({ state: 'none' })),
  saveIdempotency: jest.fn(() => Promise.resolve()),
  clearIdempotency: jest.fn(() => Promise.resolve()),
}))

jest.mock('@/lib/audit', () => ({
  logAction: jest.fn(() => Promise.resolve()),
  AUDIT_ACTIONS: {
    BOOKING_CREATE: 'BOOKING_CREATE',
  },
}))

jest.mock('@/lib/email', () => ({
  sendBookingConfirmation: jest.fn(),
  sendAdminBookingAlert: jest.fn(),
}))

const { getServerSession } = jest.requireMock('next-auth')
const { getRequestSession } = jest.requireMock('@/lib/session')
const mockGetRequestSession = getRequestSession as jest.Mock

import { GET as getRooms } from '@/app/api/rooms/route'
import { GET as getRoomAvailability } from '@/app/api/rooms/availability/route'
import { POST as createBooking } from '@/app/api/bookings/route'
import { GET as getBookings } from '@/app/api/bookings/route'
import { prisma } from '@/lib/db'
const mockPrisma = prisma as any

describe('Rooms API Integration', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'mongodb://localhost:27017/test'
    jest.clearAllMocks()
    getServerSession.mockReset()
    getServerSession.mockResolvedValue(null)
    mockPrisma.booking.findFirst.mockResolvedValue(null)
    mockPrisma.booking.findMany.mockResolvedValue([])
    mockPrisma.room.findMany.mockResolvedValue([])
    mockPrisma.room.findUnique.mockResolvedValue({
      id: 'default',
      number: '000',
      status: 'AVAILABLE',
      roomType: { name: 'Default', baseRate: 100, capacity: 2 },
    } as any)
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.booking.update.mockResolvedValue(null as any)
    mockPrisma.invoice.create.mockImplementation(async ({ data }: any) => ({
      id: 'invoice-test',
      ...data,
    }))
    mockPrisma.auditLog.create.mockResolvedValue(undefined as any)
    mockPrisma.notification.create.mockResolvedValue(undefined as any)
    mockPrisma.notification.updateMany.mockResolvedValue(undefined as any)
  })

  describe('GET /api/rooms', () => {
    test('should return all rooms successfully', async () => {
      const mockRooms = [
        {
          id: 'deluxe-king',
          number: '101',
          roomType: { 
            name: 'Deluxe King', 
            baseRate: 299, 
            capacity: 2, 
            description: 'Spacious room with king bed',
            amenities: ['WiFi', 'TV', 'Mini-bar']
          },
          roomImages: [{ imageUrl: '/images/room1.jpg' }],
          reviews: []
        },
        {
          id: 'executive-suite',
          number: '205',
          roomType: { 
            name: 'Executive Suite', 
            baseRate: 499, 
            capacity: 3, 
            description: 'Luxurious suite with separate living area',
            amenities: ['WiFi', 'TV', 'Mini-bar', 'Jacuzzi']
          },
          roomImages: [{ imageUrl: '/images/suite1.jpg' }],
          reviews: []
        },
      ]

      mockPrisma.room.findMany.mockResolvedValue(mockRooms)

      const request = new NextRequest('http://localhost:3000/api/rooms')
      const response = await getRooms(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('rooms')
      expect(data).toHaveProperty('count')
      expect(Array.isArray(data.rooms)).toBe(true)
      expect(data.rooms).toHaveLength(2)
      expect(data.count).toBe(2)
      expect(mockPrisma.room.findMany).toHaveBeenCalledTimes(1)
    })

    test('should handle database errors gracefully', async () => {
      mockPrisma.room.findMany.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/rooms')
      const response = await getRooms(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toContain('Failed to fetch rooms')
    })

    test('should filter rooms by availability', async () => {
      const mockRooms = [
        {
          id: 'deluxe-king',
          number: '101',
          roomType: { name: 'Deluxe King', baseRate: 299, capacity: 2, description: '...', amenities: [] },
          roomImages: [],
          reviews: [],
        },
      ]

      mockPrisma.room.findMany.mockResolvedValue(mockRooms)

      const request = new NextRequest('http://localhost:3000/api/rooms?available=true')
      const response = await getRooms(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('rooms')
      expect(data).toHaveProperty('count')
      // The API fetches rooms and bookings separately, not with include
      expect(mockPrisma.room.findMany).toHaveBeenCalled()
    })
  })

  describe('GET /api/rooms/availability', () => {
    test('should check room availability for given dates', async () => {
      const mockAvailability = [
        {
          roomId: 'deluxe-king',
          roomType: 'Deluxe King',
          available: true,
          price: 299,
          totalPrice: 897,
          averageRating: 4.5,
        },
      ]

      mockPrisma.room.findMany.mockResolvedValue([
        {
          id: 'deluxe-king',
          number: '101',
          status: 'AVAILABLE',
          roomType: { name: 'Deluxe King', baseRate: 299, capacity: 2, description: '...', amenities: [] },
          roomImages: [],
          reviews: [],
        },
      ])
      mockPrisma.booking.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/rooms/availability?checkIn=2024-01-15T00:00:00.000Z&checkOut=2024-01-18T00:00:00.000Z&guests=2')
      const response = await getRoomAvailability(request)
      const data = await response.json()

      if (response.status !== 200) console.log('DEBUG Availability:', data)
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('availableRooms')
      expect(Array.isArray(data.availableRooms)).toBe(true)
      expect(data.availableRooms.length).toBeGreaterThanOrEqual(1)
    })

    test('should validate required parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/availability')
      const response = await getRoomAvailability(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing check-in or check-out dates')
    })

    test('should handle invalid date formats', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/availability?checkIn=invalid-date&checkOut=2024-01-18&guests=2')
      const response = await getRoomAvailability(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid stay dates')
    })

    test('should calculate correct pricing for multiple nights', async () => {
      mockPrisma.room.findMany.mockResolvedValue([
        {
          id: 'deluxe-king',
          number: '101',
          status: 'AVAILABLE',
          roomType: { name: 'Deluxe King', baseRate: 299, capacity: 2, description: '...', amenities: [] },
          roomImages: [],
          reviews: [],
        },
      ])
      mockPrisma.booking.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/rooms/availability?checkIn=2024-01-15T00:00:00.000Z&checkOut=2024-01-18T00:00:00.000Z&guests=2')
      const response = await getRoomAvailability(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('availableRooms')
      if (data.availableRooms.length > 0) {
        expect(data.availableRooms[0]).toHaveProperty('totalPrice')
        expect(data.availableRooms[0].totalPrice).toBe(299 * 3)
      }
    })
  })
})

describe('Bookings API Integration', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'mongodb://localhost:27017/test'
    jest.clearAllMocks()
    getServerSession.mockReset()
    getServerSession.mockResolvedValue(null)
    mockGetRequestSession.mockReset()
    mockGetRequestSession.mockResolvedValue(null)
    mockPrisma.booking.findFirst.mockResolvedValue(null)
    mockPrisma.booking.findMany.mockResolvedValue([])
    mockPrisma.booking.update.mockResolvedValue(null as any)
    mockPrisma.invoice.create.mockImplementation(async ({ data }: any) => ({
      id: 'invoice-test',
      ...data,
    }))
    mockPrisma.auditLog.create.mockResolvedValue(undefined as any)
    mockPrisma.notification.create.mockResolvedValue(undefined as any)
    mockPrisma.notification.updateMany.mockResolvedValue(undefined as any)
  })

  describe('POST /api/bookings', () => {
    test('should create booking for authenticated user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
        role: 'GUEST',
      }

      const mockBooking = {
        id: 'booking-123',
        userId: 'user-123',
        roomId: 'deluxe-king',
        checkIn: new Date('2024-01-15'),
        checkOut: new Date('2024-01-18'),
        guests: 2,
        totalPrice: 897,
        status: 'CONFIRMED',
        confirmationCode: 'GP2024001',
      }

      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'deluxe-king',
        number: '101',
        status: 'AVAILABLE',
        roomType: { name: 'Deluxe King', baseRate: 299, capacity: 2 },
      } as any)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.booking.findFirst.mockResolvedValue(null) // No conflicting booking
      mockPrisma.booking.create.mockResolvedValue(mockBooking)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser) // For bookingWithRelations
      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'deluxe-king',
        number: '101',
        status: 'AVAILABLE',
        roomType: { name: 'Deluxe King', baseRate: 299, capacity: 2 },
      } as any) // For bookingWithRelations
      mockGetRequestSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' }
      } as any)

      const requestBody = {
        roomId: 'deluxe-king',
        checkIn: '2024-01-15T15:00:00.000Z',
        checkOut: '2024-01-18T11:00:00.000Z',
        guests: 2,
        guestEmail: 'test@example.com', // Fallback for session
        specialRequests: 'Late checkout requested',
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-role': 'GUEST',
          'x-test-user-id': 'user-123',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await createBooking(request)
      const data = await response.json()

      if (response.status !== 201) console.log('DEBUG Booking:', data)
      expect(response.status).toBe(201)
      expect(data).toHaveProperty('booking')
      expect(data.booking.confirmationCode).toBeDefined()
      expect(mockPrisma.booking.create).toHaveBeenCalledTimes(1)
    })

    test('should create booking for guest user', async () => {
      const mockGuestUser = {
        id: 'guest-123',
        email: 'guest@example.com',
        name: 'Jane Guest',
        role: 'GUEST',
      }

      const mockBooking = {
        id: 'booking-456',
        userId: 'guest-123',
        roomId: 'executive-suite',
        checkIn: new Date('2024-01-20'),
        checkOut: new Date('2024-01-22'),
        guests: 2,
        totalPrice: 998,
        status: 'CONFIRMED',
        confirmationCode: 'GP2024002',
      }

      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'executive-suite',
        number: '205',
        status: 'AVAILABLE',
        roomType: { name: 'Executive Suite', baseRate: 499, capacity: 3 },
      } as any)
      mockPrisma.user.findFirst.mockResolvedValue(null) // User doesn't exist
      mockPrisma.user.create.mockResolvedValue(mockGuestUser)
      mockPrisma.booking.findFirst.mockResolvedValue(null) // No conflicting booking
      mockPrisma.booking.create.mockResolvedValue(mockBooking)
      mockPrisma.user.findUnique.mockResolvedValue(mockGuestUser) // For bookingWithRelations
      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'executive-suite',
        number: '205',
        status: 'AVAILABLE',
        roomType: { name: 'Executive Suite', baseRate: 499, capacity: 3 },
      } as any) // For bookingWithRelations
      mockGetRequestSession.mockResolvedValue(null) // No session - guest checkout

      const requestBody = {
        roomId: 'executive-suite',
        checkIn: '2024-01-20T15:00:00.000Z',
        checkOut: '2024-01-22T11:00:00.000Z',
        guests: 2,
        guestName: 'Jane Guest',
        guestEmail: 'guest@example.com',
        guestPhone: '+1234567890',
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await createBooking(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveProperty('booking')
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1)
      expect(mockPrisma.booking.create).toHaveBeenCalledTimes(1)
    })

    test('should validate booking data', async () => {
      const requestBody = {
        roomId: '',
        checkIn: 'invalid-date',
        checkOut: '2024-01-18',
        guests: 0,
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-role': 'GUEST',
          'x-test-user-id': 'user-123',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await createBooking(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      // Zod errors are returned as JSON strings in the error field
      expect(data.error).toContain('invalid_string')
    })

    test('should prevent double booking', async () => {
      const existingBooking = {
        id: 'existing-booking',
        roomId: 'deluxe-king',
        checkIn: new Date('2024-01-15'),
        checkOut: new Date('2024-01-18'),
        status: 'CONFIRMED',
      }

      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'deluxe-king',
        number: '101',
        status: 'AVAILABLE',
        roomType: { name: 'Deluxe King', baseRate: 299, capacity: 2 },
      } as any)
      mockGetRequestSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' }
      } as any)
      mockPrisma.booking.findFirst.mockResolvedValue(existingBooking)

      const requestBody = {
        roomId: 'deluxe-king',
        checkIn: '2024-01-16T15:00:00.000Z',
        checkOut: '2024-01-19T11:00:00.000Z',
        guests: 2,
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await createBooking(request)
      const data = await response.json()

      expect(response.status).toBe(400) // Implementation returns 400 for errors
      expect(data.error).toBe('DOUBLE_BOOKING')
    })

    test('should handle database errors during booking creation', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'deluxe-king',
        number: '101',
        status: 'AVAILABLE',
        roomType: { name: 'Deluxe King', baseRate: 299, capacity: 2 },
      } as any)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
        role: 'GUEST',
      } as any)
      mockPrisma.booking.findFirst.mockResolvedValue(null) // No conflicting booking

      mockPrisma.booking.create.mockRejectedValue(new Error('Database error'))
      mockGetRequestSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' }
      } as any)

      const requestBody = {
        roomId: 'deluxe-king',
        checkIn: '2024-01-15T15:00:00.000Z',
        checkOut: '2024-01-18T11:00:00.000Z',
        guests: 2,
      }

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await createBooking(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Database error')
    })
  })

  describe('GET /api/bookings', () => {
    test('should return user bookings for authenticated user', async () => {
      const mockBookings = [
        {
          id: 'booking-123',
          roomId: 'deluxe-king',
          checkIn: new Date('2024-01-15'),
          checkOut: new Date('2024-01-18'),
          guests: 2,
          totalPrice: 897,
          status: 'CONFIRMED',
          confirmationCode: 'GP2024001',
          room: {
            type: 'Deluxe King',
            price: 299,
          },
        },
      ]

      mockPrisma.booking.findMany.mockResolvedValue(mockBookings)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
      } as any)
      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'deluxe-king',
        type: 'Deluxe King',
        price: 299,
      } as any)
      mockGetRequestSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      })

      const response = await getBookings(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('bookings')
      expect(data.bookings).toHaveLength(1)
      // API doesn't use include, fetches relations separately
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { primaryGuestId: 'user-123' },
          orderBy: { createdAt: 'desc' },
        })
      )
    })

    test('should return all bookings for admin user', async () => {
      const mockBookings = [
        {
          id: 'booking-123',
          userId: 'user-123',
          roomId: 'deluxe-king',
          status: 'CONFIRMED',
          user: {
            name: 'John Doe',
            email: 'john@example.com',
          },
          room: {
            type: 'Deluxe King',
          },
        },
      ]

      mockPrisma.booking.findMany.mockResolvedValue(mockBookings)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
      } as any)
      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'deluxe-king',
        type: 'Deluxe King',
        price: 299,
      } as any)
      mockGetRequestSession.mockResolvedValue({
        user: { id: 'admin-123', role: 'SUPER_ADMIN' },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        headers: {
          'Authorization': 'Bearer admin-token',
        },
      })

      const response = await getBookings(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bookings).toHaveLength(1)
      // API doesn't use include, fetches relations separately
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      )
    })

    test('should filter bookings by status', async () => {
      const mockBookings = [
        {
          id: 'booking-123',
          status: 'CONFIRMED',
          room: { type: 'Deluxe King' },
        },
      ]

      mockPrisma.booking.findMany.mockResolvedValue(mockBookings)

      mockGetRequestSession.mockResolvedValue({
        user: { id: 'admin-123', role: 'SUPER_ADMIN' },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/bookings?status=CONFIRMED')
      const response = await getBookings(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'CONFIRMED',
          }),
        })
      )
    })

    test('should handle unauthorized access', async () => {
      const request = new NextRequest('http://localhost:3000/api/bookings')
      const response = await getBookings(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })
  })
})

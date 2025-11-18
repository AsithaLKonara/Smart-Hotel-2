jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

const { getServerSession } = jest.requireMock('next-auth') as {
  getServerSession: jest.Mock
}
import { NextRequest } from 'next/server'
import { GET as getRooms } from '@/app/api/rooms/route'
import { GET as getRoomAvailability } from '@/app/api/rooms/availability/route'
import { POST as createBooking } from '@/app/api/bookings/route'
import { GET as getBookings } from '@/app/api/bookings/route'

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

// Mock Prisma client
jest.mock('@/lib/db', () => {
  const prismaMock = {
    room: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
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
  }

  return {
    __esModule: true,
    prisma: prismaMock,
    default: prismaMock,
  }
})

afterAll(() => {
  consoleErrorSpy.mockRestore()
  consoleLogSpy.mockRestore()
})

jest.mock('@/lib/email', () => ({
  sendBookingConfirmation: jest.fn(),
  sendAdminBookingAlert: jest.fn(),
}))

import { prisma } from '@/lib/db'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Rooms API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getServerSession.mockReset()
    getServerSession.mockResolvedValue(null)
    mockPrisma.booking.findFirst.mockResolvedValue(null)
    mockPrisma.booking.findMany.mockResolvedValue([])
    mockPrisma.room.findMany.mockResolvedValue([])
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
          type: 'Deluxe King',
          description: 'Spacious room with king bed',
          size: 450,
          capacity: 2,
          price: 299,
          amenities: ['WiFi', 'TV', 'Mini-bar'],
          images: ['/images/room1.jpg'],
        },
        {
          id: 'executive-suite',
          type: 'Executive Suite',
          description: 'Luxurious suite with separate living area',
          size: 650,
          capacity: 3,
          price: 499,
          amenities: ['WiFi', 'TV', 'Mini-bar', 'Jacuzzi'],
          images: ['/images/suite1.jpg'],
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

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to fetch rooms')
    })

    test('should filter rooms by availability', async () => {
      const mockRooms = [
        {
          id: 'deluxe-king',
          type: 'Deluxe King',
          price: 299,
          bookings: [],
        },
      ]

      mockPrisma.room.findMany.mockResolvedValue(mockRooms)

      const request = new NextRequest('http://localhost:3000/api/rooms?available=true')
      const response = await getRooms(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockPrisma.room.findMany).toHaveBeenCalledWith({
        include: {
          bookings: {
            where: {
              status: {
                in: ['CONFIRMED', 'CHECKED_IN'],
              },
            },
          },
        },
      })
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
          type: 'Deluxe King',
          price: 299,
          status: 'AVAILABLE',
          bookings: [],
          roomImages: [],
          reviews: [],
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/rooms/availability?checkIn=2024-01-15&checkOut=2024-01-18&guests=2')
      const response = await getRoomAvailability(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('availability')
      expect(data.availability).toHaveLength(1)
    })

    test('should validate required parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/availability')
      const response = await getRoomAvailability(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required parameters')
    })

    test('should handle invalid date formats', async () => {
      const request = new NextRequest('http://localhost:3000/api/rooms/availability?checkIn=invalid-date&checkOut=2024-01-18&guests=2')
      const response = await getRoomAvailability(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid date format')
    })

    test('should calculate correct pricing for multiple nights', async () => {
      mockPrisma.room.findMany.mockResolvedValue([
        {
          id: 'deluxe-king',
          type: 'Deluxe King',
          price: 299,
          status: 'AVAILABLE',
          bookings: [],
          roomImages: [],
          reviews: [],
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/rooms/availability?checkIn=2024-01-15&checkOut=2024-01-18&guests=2')
      const response = await getRoomAvailability(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.availability[0].totalPrice).toBe(897) // 299 * 3 nights
    })
  })
})

describe('Bookings API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getServerSession.mockReset()
    getServerSession.mockResolvedValue(null)
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
        price: 299,
        status: 'AVAILABLE',
      })
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.booking.create.mockResolvedValue(mockBooking)
      getServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' }
      })

      const requestBody = {
        roomId: 'deluxe-king',
        checkIn: '2024-01-15',
        checkOut: '2024-01-18',
        guests: 2,
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
        price: 499,
        status: 'AVAILABLE',
      })
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.create.mockResolvedValue(mockGuestUser)
      mockPrisma.booking.create.mockResolvedValue(mockBooking)
      getServerSession.mockResolvedValue(null)

      const requestBody = {
        roomId: 'executive-suite',
        checkIn: '2024-01-20',
        checkOut: '2024-01-22',
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
      expect(data.error).toContain('Invalid booking data')
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
        price: 299,
        status: 'AVAILABLE',
      })
      getServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' }
      })
      mockPrisma.booking.findFirst.mockResolvedValue(existingBooking)

      const requestBody = {
        roomId: 'deluxe-king',
        checkIn: '2024-01-16',
        checkOut: '2024-01-19',
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

      expect(response.status).toBe(409)
      expect(data.error).toContain('Room not available')
    })

    test('should handle database errors during booking creation', async () => {
      mockPrisma.room.findUnique.mockResolvedValue({
        id: 'deluxe-king',
        price: 299,
        status: 'AVAILABLE',
      })
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
        role: 'GUEST',
      })

      mockPrisma.booking.create.mockRejectedValue(new Error('Database error'))
      getServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' }
      })

      const requestBody = {
        roomId: 'deluxe-king',
        checkIn: '2024-01-15',
        checkOut: '2024-01-18',
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

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to create booking')
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
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
          include: expect.objectContaining({ room: true }),
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

      const request = new NextRequest('http://localhost:3000/api/bookings', {
        headers: {
          'Authorization': 'Bearer admin-token',
        },
      })

      const response = await getBookings(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bookings).toHaveLength(1)
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            user: expect.anything(),
            room: expect.anything(),
          }),
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

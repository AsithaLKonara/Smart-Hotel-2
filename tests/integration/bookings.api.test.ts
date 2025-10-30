import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { seedTestData, cleanupTestData } from '../fixtures/seed'

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Note: This test uses a real in-memory MongoDB database, so we don't mock @/lib/db

describe('Bookings API Integration Tests', () => {
  let mongod: MongoMemoryServer
  let prisma: PrismaClient

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    process.env.DATABASE_URL = mongod.getUri()
    prisma = new PrismaClient()
    await seedTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
    await prisma.$disconnect()
    await mongod.stop()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/bookings', () => {
    it('should return bookings for authenticated user', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-1', role: 'GUEST' }
      })

      const req = new NextRequest('http://localhost:3000/api/bookings')
      req.headers.set('x-forwarded-for', '192.168.1.1')

      const { GET } = await import('@/app/api/bookings/route')
      const response = await GET(req)

      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
      }
    })

    it('should return 401 for unauthenticated user', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/bookings')

      const { GET } = await import('@/app/api/bookings/route')
      const response = await GET(req)

      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(401)
      }
    })
  })

  describe('POST /api/bookings', () => {
    it('should create booking for authenticated user', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-1', role: 'GUEST' }
      })

      const bookingData = {
        roomId: 'test-room-1',
        checkIn: '2025-10-01T00:00:00Z',
        checkOut: '2025-10-03T00:00:00Z',
        guests: 2,
        specialRequests: 'Test booking'
      }

      const req = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1'
        }
      })

      const { POST } = await import('@/app/api/bookings/route')
      const response = await POST(req)

      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(201)
        const data = await response.json()
        expect(data).toHaveProperty('id')
      }
    })

    it('should return 400 for invalid booking data', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'test-user-1', role: 'GUEST' }
      })

      const invalidData = {
        roomId: '', // Invalid: empty room ID
        checkIn: 'invalid-date',
        guests: -1 // Invalid: negative guests
      }

      const req = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const { POST } = await import('@/app/api/bookings/route')
      const response = await POST(req)

      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(400)
      }
    })

    it('should return 401 for unauthenticated user', async () => {
      const { getServerSession } = await import('next-auth')
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const bookingData = {
        roomId: 'test-room-1',
        checkIn: '2025-10-01T00:00:00Z',
        checkOut: '2025-10-03T00:00:00Z',
        guests: 2
      }

      const req = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const { POST } = await import('@/app/api/bookings/route')
      const response = await POST(req)

      expect(response).toBeDefined()
      if (response) {
        expect(response.status).toBe(401)
      }
    })
  })
})
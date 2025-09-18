import { MongoMemoryServer } from 'mongodb-memory-server'
import { PrismaClient } from '@prisma/client'
import request from 'supertest'
import { NextRequest } from 'next/server'
import { seedTestData, cleanupTestData, testUsers, testRooms } from '../fixtures/seed'

// Mock Next.js API route handler
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
    })),
  },
  getServerSession: jest.fn(),
}))

// Create a test API handler
const createTestHandler = async (req: any) => {
  const { NextResponse, getServerSession } = await import('next/server')
  const { GET, POST } = await import('@/app/api/bookings/route')

  if (req.method === 'GET') {
    return GET(req)
  } else if (req.method === 'POST') {
    return POST(req)
  }
}

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
      // Mock authenticated session
      const { getServerSession } = await import('next/server')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUsers.guest.id, role: 'GUEST' },
      })

      const req = new NextRequest('http://localhost:3000/api/bookings')
      req.headers.set('x-forwarded-for', '192.168.1.1')

      const response = await createTestHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    it('should return 401 for unauthenticated user', async () => {
      const { getServerSession } = await import('next/server')
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/bookings')

      const response = await createTestHandler(req)

      expect(response.status).toBe(401)
    })

    it('should return all bookings for admin user', async () => {
      const { getServerSession } = await import('next/server')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUsers.admin.id, role: 'SUPER_ADMIN' },
      })

      const req = new NextRequest('http://localhost:3000/api/bookings')
      req.headers.set('x-forwarded-for', '192.168.1.1')

      const response = await createTestHandler(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('POST /api/bookings', () => {
    it('should create a new booking', async () => {
      const { getServerSession } = await import('next/server')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUsers.guest.id, role: 'GUEST' },
      })

      const bookingData = {
        roomId: testRooms.standard.id,
        checkIn: '2025-11-01',
        checkOut: '2025-11-03',
        specialRequests: 'Test booking',
        paymentMethod: 'pay_now',
      }

      const req = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
      })

      const response = await createTestHandler(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveProperty('id')
      expect(data.roomId).toBe(testRooms.standard.id)
      expect(data.userId).toBe(testUsers.guest.id)
    })

    it('should reject booking with invalid data', async () => {
      const { getServerSession } = await import('next/server')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUsers.guest.id, role: 'GUEST' },
      })

      const invalidBookingData = {
        // Missing required fields
        specialRequests: 'Invalid booking',
      }

      const req = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(invalidBookingData),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
      })

      const response = await createTestHandler(req)

      expect(response.status).toBe(400)
    })

    it('should reject booking for non-existent room', async () => {
      const { getServerSession } = await import('next/server')
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: testUsers.guest.id, role: 'GUEST' },
      })

      const bookingData = {
        roomId: 'non-existent-room',
        checkIn: '2025-11-01',
        checkOut: '2025-11-03',
        paymentMethod: 'pay_now',
      }

      const req = new NextRequest('http://localhost:3000/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
      })

      const response = await createTestHandler(req)

      expect(response.status).toBe(404)
    })
  })
})

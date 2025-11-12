import { NextRequest } from 'next/server'
import { GET as getLiveHealth } from '@/app/api/health/live/route'
import { GET as getReadyHealth } from '@/app/api/health/ready/route'

// Mock Prisma client
jest.mock('@/lib/db', () => ({
  prisma: {
    $runCommandRaw: jest.fn(),
    user: {
      count: jest.fn(),
    },
    booking: {
      count: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Health Check API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/health/live', () => {
    test('should return liveness status', async () => {
      const request = new NextRequest('http://localhost:3000/api/health/live')
      const response = await getLiveHealth()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        status: 'alive',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      })
    })

    test('should include uptime information', async () => {
      const request = new NextRequest('http://localhost:3000/api/health/live')
      const response = await getLiveHealth()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.uptime).toBeGreaterThan(0)
      expect(typeof data.uptime).toBe('number')
    })

    test('should always return 200 status', async () => {
      // Even if there are errors, liveness should always return 200
      const request = new NextRequest('http://localhost:3000/api/health/live')
      const response = await getLiveHealth()

      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/health/ready', () => {
    test('should return ready status when all services are healthy', async () => {
      mockPrisma.$runCommandRaw.mockResolvedValue({ ok: 1 })
      mockPrisma.user.count.mockResolvedValue(100)
      mockPrisma.booking.count.mockResolvedValue(50)

      const request = new NextRequest('http://localhost:3000/api/health/ready')
      const response = await getReadyHealth()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        status: 'ready',
        timestamp: expect.any(String),
        checks: {
          database: 'healthy',
          users: 'healthy',
          bookings: 'healthy',
        },
        uptime: expect.any(Number),
      })
    })

    test('should return not ready when database is down', async () => {
      const errorMessage = 'Database connection failed'
      mockPrisma.$runCommandRaw.mockRejectedValue(new Error(errorMessage))

      const request = new NextRequest('http://localhost:3000/api/health/ready')
      const response = await getReadyHealth()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data).toEqual({
        status: 'not ready',
        timestamp: expect.any(String),
        checks: {
          database: 'unhealthy',
          users: 'unhealthy',
          bookings: 'unhealthy',
        },
        uptime: expect.any(Number),
        error: errorMessage,
      })
    })

    test('should return not ready when user service is down', async () => {
      mockPrisma.$runCommandRaw.mockResolvedValue({ ok: 1 })
      mockPrisma.user.count.mockRejectedValue(new Error('User service error'))
      mockPrisma.booking.count.mockResolvedValue(50)

      const request = new NextRequest('http://localhost:3000/api/health/ready')
      const response = await getReadyHealth()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.checks.database).toBe('healthy')
      expect(data.checks.users).toBe('unhealthy')
      expect(data.checks.bookings).toBe('healthy')
    })

    test('should return not ready when booking service is down', async () => {
      mockPrisma.$runCommandRaw.mockResolvedValue({ ok: 1 })
      mockPrisma.user.count.mockResolvedValue(100)
      mockPrisma.booking.count.mockRejectedValue(new Error('Booking service error'))

      const request = new NextRequest('http://localhost:3000/api/health/ready')
      const response = await getReadyHealth()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.checks.database).toBe('healthy')
      expect(data.checks.users).toBe('healthy')
      expect(data.checks.bookings).toBe('unhealthy')
    })

    test('should include response time metrics', async () => {
      mockPrisma.$runCommandRaw.mockResolvedValue({ ok: 1 })
      mockPrisma.user.count.mockResolvedValue(100)
      mockPrisma.booking.count.mockResolvedValue(50)

      const request = new NextRequest('http://localhost:3000/api/health/ready')
      const response = await getReadyHealth()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('uptime')
      expect(data.uptime).toBeGreaterThan(0)
    })

    test('should handle timeout scenarios', async () => {
      // Simulate a slow database query
      mockPrisma.$runCommandRaw.mockImplementation(() => 
        new Promise((resolve) => setTimeout(() => resolve([{ result: 1 }]), 6000))
      )

      const request = new NextRequest('http://localhost:3000/api/health/ready')
      const response = await getReadyHealth()
      const data = await response.json()

      // Should timeout and return not ready
      expect(response.status).toBe(503)
      expect(data.checks.database).toBe('unhealthy')
    })

    test('should include detailed error information', async () => {
      const errorMessage = 'Connection timeout'
      mockPrisma.$runCommandRaw.mockRejectedValue(new Error(errorMessage))

      const request = new NextRequest('http://localhost:3000/api/health/ready')
      const response = await getReadyHealth()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe(errorMessage)
      expect(data.checks.database).toBe('unhealthy')
    })

    test('should handle partial service failures gracefully', async () => {
      mockPrisma.$runCommandRaw.mockResolvedValue({ ok: 1 })
      mockPrisma.user.count.mockResolvedValue(100)
      mockPrisma.booking.count.mockRejectedValue(new Error('Booking service temporarily unavailable'))

      const request = new NextRequest('http://localhost:3000/api/health/ready')
      const response = await getReadyHealth()
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.checks.database).toBe('healthy')
      expect(data.checks.users).toBe('healthy')
      expect(data.checks.bookings).toBe('unhealthy')
      expect(data.error).toContain('Booking service temporarily unavailable')
    })
  })

  describe('Health Check Integration Scenarios', () => {
    test('should handle concurrent health check requests', async () => {
      mockPrisma.$runCommandRaw.mockResolvedValue({ ok: 1 })
      mockPrisma.user.count.mockResolvedValue(100)
      mockPrisma.booking.count.mockResolvedValue(50)

      const requests = Array(10).fill(null).map(() => 
        getReadyHealth()
      )

      const responses = await Promise.all(requests)
      
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    test('should maintain consistent response format', async () => {
      mockPrisma.$runCommandRaw.mockResolvedValue({ ok: 1 })
      mockPrisma.user.count.mockResolvedValue(100)
      mockPrisma.booking.count.mockResolvedValue(50)

      const request = new NextRequest('http://localhost:3000/api/health/ready')
      const response = await getReadyHealth()
      const data = await response.json()

      // Verify all required fields are present
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('checks')
      expect(data).toHaveProperty('uptime')
      
      // Verify checks object structure
      expect(data.checks).toHaveProperty('database')
      expect(data.checks).toHaveProperty('users')
      expect(data.checks).toHaveProperty('bookings')
      
      // Verify status values
      expect(['ready', 'not ready']).toContain(data.status)
      expect(['healthy', 'unhealthy', 'unknown']).toContain(data.checks.database)
      expect(['healthy', 'unhealthy', 'unknown']).toContain(data.checks.users)
      expect(['healthy', 'unhealthy', 'unknown']).toContain(data.checks.bookings)
    })

    test('should handle service recovery scenarios', async () => {
      // First request - service down
      mockPrisma.$runCommandRaw.mockRejectedValueOnce(new Error('Service down'))
      
      const request1 = new NextRequest('http://localhost:3000/api/health/ready')
      const response1 = await getReadyHealth()
      const data1 = await response1.json()

      expect(response1.status).toBe(503)
      expect(data1.checks.database).toBe('unhealthy')

      // Second request - service recovered
      mockPrisma.$runCommandRaw.mockResolvedValue({ ok: 1 })
      mockPrisma.user.count.mockResolvedValue(100)
      mockPrisma.booking.count.mockResolvedValue(50)

      const request2 = new NextRequest('http://localhost:3000/api/health/ready')
      const response2 = await getReadyHealth()
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      expect(data2.checks.database).toBe('healthy')
    })
  })
})

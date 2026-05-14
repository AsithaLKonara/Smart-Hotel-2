import { NextRequest } from 'next/server'

// ============================================================
// API Rate Limiting & Schema Contract Tests
// ============================================================

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))

jest.mock('@/lib/db', () => {
  const mockClient: Record<string, any> = {
    room: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    roomType: { findUnique: jest.fn(), findMany: jest.fn() },
    booking: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
    foodMenu: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    auditLog: { create: jest.fn() },
  }
  mockClient.$transaction = jest.fn((fn: (client: Record<string, any>) => any) => fn(mockClient))
  return { __esModule: true, default: mockClient, prisma: mockClient }
})

jest.mock('@/lib/session', () => ({ getRequestSession: jest.fn() }))

jest.mock('@/lib/audit', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
  AUDIT_ACTIONS: {
    ROOM_CREATE: 'ROOM_CREATE', ROOM_UPDATE: 'ROOM_UPDATE', ROOM_DELETE: 'ROOM_DELETE',
    MENU_CREATE: 'MENU_CREATE', MENU_UPDATE: 'MENU_UPDATE',
  },
}))

import { getRequestSession } from '@/lib/session'
import prisma from '@/lib/db'

const mockGetSession = getRequestSession as jest.MockedFunction<typeof getRequestSession>
const mockPrisma = prisma as any

console.error = jest.fn()
console.log = jest.fn()

// Helper
const adminSession = { user: { id: 'admin-1', role: 'SUPER_ADMIN', email: 'admin@test.com', name: 'Admin' } }
const guestSession = { user: { id: 'guest-1', role: 'GUEST', email: 'g@test.com', name: 'Guest' } }

function makeReq(url: string, method: string = 'GET', body?: object) {
  return new NextRequest(url, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  })
}

describe('📋 API Schema & Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('/api/rooms — Schema Contracts', () => {
    it('GET returns an array of rooms', async () => {
      const { GET } = await import('@/app/api/rooms/route')
      mockGetSession.mockResolvedValue(adminSession as any)
      mockPrisma.room.findMany.mockResolvedValue([
        { id: 'room-1', number: '101', floor: 1, status: 'AVAILABLE', roomType: { name: 'Deluxe', baseRate: 100 } }
      ])

      const res = await GET(makeReq('http://localhost/api/rooms'))
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    it('POST requires authentication', async () => {
      const { POST } = await import('@/app/api/rooms/route')
      mockGetSession.mockResolvedValue(null)

      const res = await POST(makeReq('http://localhost/api/rooms', 'POST', { number: '205', floor: 2 }))
      expect([401, 403]).toContain(res.status)
    })

    it('POST validates required fields', async () => {
      const { POST } = await import('@/app/api/rooms/route')
      mockGetSession.mockResolvedValue(adminSession as any)

      // Missing required fields
      const res = await POST(makeReq('http://localhost/api/rooms', 'POST', {}))
      expect([400, 422]).toContain(res.status)
    })

    it('GET with invalid filter param does not crash the server', async () => {
      const { GET } = await import('@/app/api/rooms/route')
      mockGetSession.mockResolvedValue(adminSession as any)
      mockPrisma.room.findMany.mockResolvedValue([])

      const res = await GET(makeReq('http://localhost/api/rooms?status=INVALID_STATUS'))
      // Should not return 500 — should gracefully handle or ignore invalid filter
      expect(res.status).toBeLessThan(500)
    })
  })

  describe('/api/restaurant/menu — Schema Contracts', () => {
    it('GET returns array of menu items', async () => {
      const { GET } = await import('@/app/api/restaurant/menu/route')
      mockGetSession.mockResolvedValue(guestSession as any)
      mockPrisma.foodMenu.findMany.mockResolvedValue([
        { id: 'menu-1', name: 'Pasta', price: 15.99, category: 'MAIN', available: true }
      ])

      const res = await GET(makeReq('http://localhost/api/restaurant/menu'))
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id')
        expect(data[0]).toHaveProperty('name')
        expect(data[0]).toHaveProperty('price')
      }
    })

    it('POST menu item requires admin/manager authentication', async () => {
      const { POST } = await import('@/app/api/restaurant/menu/route')
      mockGetSession.mockResolvedValue(guestSession as any)

      const res = await POST(makeReq('http://localhost/api/restaurant/menu', 'POST', {
        name: 'Salad', price: 9.99, category: 'STARTERS'
      }))

      expect([401, 403]).toContain(res.status)
    })
  })

  describe('/api/health — Liveness & Readiness', () => {
    it('GET /api/health/live returns 200', async () => {
      const { GET } = await import('@/app/api/health/live/route')
      const res = await GET()
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.status).toBe('alive')
    })
  })

  describe('Large Payload Handling', () => {
    it('POST /api/bookings rejects extremely large payloads gracefully', async () => {
      const { POST } = await import('@/app/api/bookings/route')
      mockGetSession.mockResolvedValue(guestSession as any)

      // Create an oversized payload
      const largePayload = {
        roomId: 'room-1',
        checkIn: '2025-06-01',
        checkOut: '2025-06-05',
        specialRequests: 'X'.repeat(100000), // 100KB string
      }

      const res = await POST(makeReq('http://localhost/api/bookings', 'POST', largePayload))
      // Must not return 500 (should validate and return 400 or handle gracefully)
      expect(res.status).toBeLessThan(500)
    })
  })
})

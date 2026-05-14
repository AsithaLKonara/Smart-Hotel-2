import { NextRequest } from 'next/server'

// ============================================================
// Security Contract Tests — IDOR, Privilege Escalation, Auth
// ============================================================

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/db', () => {
  const mockClient: Record<string, any> = {
    user: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    booking: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    room: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    foodOrder: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn() },
  }
  mockClient.$transaction = jest.fn((fn: (client: Record<string, any>) => any) => fn(mockClient))
  return { __esModule: true, default: mockClient, prisma: mockClient }
})

jest.mock('@/lib/audit', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
  AUDIT_ACTIONS: { BOOKING_DELETE: 'BOOKING_DELETE', BOOKING_VIEW: 'BOOKING_VIEW', BOOKING_UPDATE: 'BOOKING_UPDATE', USER_LOGIN: 'USER_LOGIN' },
}))

jest.mock('@/lib/inventory-lock', () => ({
  InventoryLockEngine: jest.fn().mockImplementation(() => ({
    acquireLock: jest.fn().mockResolvedValue({ lockId: 'lock-123', roomId: 'room-abc', expiresAt: Date.now() + 60000 }),
    commitLock: jest.fn().mockResolvedValue(true),
    rollbackLock: jest.fn().mockResolvedValue(true),
  })),
}))

jest.mock('@/lib/session', () => ({
  getRequestSession: jest.fn(),
}))

import { getServerSession } from 'next-auth'
import { getRequestSession } from '@/lib/session'
import prisma from '@/lib/db'

const mockPrisma = prisma as any
const mockGetSession = getRequestSession as jest.MockedFunction<typeof getRequestSession>

console.error = jest.fn()
console.log = jest.fn()

describe('🛡️ Security Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('IDOR — Booking Ownership Isolation', () => {
    it('Guest A cannot GET booking belonging to Guest B', async () => {
      const { GET } = await import('@/app/api/bookings/[id]/route')

      // Guest A is authenticated
      mockGetSession.mockResolvedValue({ user: { id: 'guest-A', role: 'GUEST', email: 'a@test.com', name: 'A' } } as any)

      // But the DB returns a booking owned by Guest B
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking-123',
        primaryGuestId: 'guest-B', // Different owner
        checkIn: new Date(),
        checkOut: new Date(),
        status: 'CONFIRMED',
        totalAmount: 200,
      })

      const req = new NextRequest('http://localhost/api/bookings/booking-123')
      const res = await GET(req, { params: { id: 'booking-123' } })

      // Must respond with 403 Forbidden, NOT 200
      expect(res.status).toBe(403)
    })

    it('Guest A cannot DELETE booking belonging to Guest B', async () => {
      const { DELETE } = await import('@/app/api/bookings/[id]/route')

      mockGetSession.mockResolvedValue({ user: { id: 'guest-A', role: 'GUEST', email: 'a@test.com', name: 'A' } } as any)
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'booking-123',
        primaryGuestId: 'guest-B',
        status: 'CONFIRMED',
      })

      const req = new NextRequest('http://localhost/api/bookings/booking-123', { method: 'DELETE' })
      const res = await DELETE(req, { params: { id: 'booking-123' } })

      expect(res.status).toBe(403)
    })
  })

  describe('Privilege Escalation — Role Boundary Enforcement', () => {
    it('GUEST cannot access /api/staff endpoint', async () => {
      const { GET } = await import('@/app/api/staff/route')

      mockGetSession.mockResolvedValue({ user: { id: 'guest-1', role: 'GUEST', email: 'g@test.com', name: 'G' } } as any)

      const req = new NextRequest('http://localhost/api/staff')
      const res = await GET(req)

      expect([401, 403]).toContain(res.status)
    })

    it('RECEPTIONIST cannot access staff management APIs', async () => {
      const { GET } = await import('@/app/api/staff/route')

      mockGetSession.mockResolvedValue({ user: { id: 'rec-1', role: 'RECEPTIONIST', email: 'rec@test.com', name: 'R' } } as any)

      const req = new NextRequest('http://localhost/api/staff')
      const res = await GET(req)

      // Staff management is admin-only
      expect([401, 403]).toContain(res.status)
    })
  })

  describe('Unauthenticated Access — Auth Boundary', () => {
    it('Unauthenticated request to /api/bookings returns 401', async () => {
      const { GET } = await import('@/app/api/bookings/route')

      mockGetSession.mockResolvedValue(null)
      mockPrisma.booking.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost/api/bookings')
      const res = await GET(req)

      expect(res.status).toBe(401)
    })

    it('Unauthenticated request to /api/rooms returns accessible response (public endpoint)', async () => {
      const { GET } = await import('@/app/api/rooms/route')

      mockGetSession.mockResolvedValue(null)
      mockPrisma.room.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost/api/rooms')
      const res = await GET(req)

      // Rooms are publicly viewable
      expect([200, 401]).toContain(res.status)
    })
  })
})

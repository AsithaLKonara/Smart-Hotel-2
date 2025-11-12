import { NextRequest } from 'next/server'
import { GET as getNotifications, POST as createNotification } from '@/app/api/notifications/route'
import { POST as subscribeNotifications } from '@/app/api/notifications/subscribe/route'

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

jest.mock('@/lib/db', () => {
  const mockPrismaClient = {
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  }
  return {
    __esModule: true,
    default: mockPrismaClient,
    prisma: mockPrismaClient,
  }
})

const mockGetServerSessionFn = jest.fn((options) => Promise.resolve(null))

jest.mock('next-auth', () => ({
  getServerSession: (options: any) => mockGetServerSessionFn(options),
}))

jest.mock('@/lib/session', () => ({
  getRequestSession: jest.fn((request) => {
    // Return mocked session based on test needs
    return Promise.resolve(null)
  }),
}))

import prisma from '@/lib/db'
import { getServerSession } from 'next-auth'
import { getRequestSession } from '@/lib/session'

const mockPrisma = prisma as any
const mockGetRequestSession = getRequestSession as jest.MockedFunction<typeof getRequestSession>
const mockGetServerSession = mockGetServerSessionFn as jest.MockedFunction<typeof mockGetServerSessionFn>
const mockPrismaNotification = mockPrisma.notification

describe('Notifications API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  describe('GET /api/notifications', () => {
    it('should return notifications for authenticated user', async () => {
      mockGetRequestSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' },
      } as any)

      mockPrismaNotification.findMany.mockResolvedValue([
        {
          id: 'notif-1',
          userId: 'user-123',
          title: 'Test Notification',
          message: 'Test message',
          type: 'GENERAL',
          isRead: false,
          createdAt: new Date(),
        },
      ] as any)

      const req = new NextRequest('http://localhost:3000/api/notifications')
      const response = await getNotifications(req)

      expect(response?.status).toBe(200)
      const data = await response?.json()
      expect(Array.isArray(data.notifications)).toBe(true)
      expect(data.notifications).toHaveLength(1)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetRequestSession.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/notifications')
      const response = await getNotifications(req)

      expect(response?.status).toBe(401)
    })

    it('should filter unread notifications', async () => {
      mockGetRequestSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' },
      } as any)

      mockPrismaNotification.findMany.mockResolvedValue([
        {
          id: 'notif-1',
          userId: 'user-123',
          title: 'Unread',
          isRead: false,
        },
      ] as any)

      const req = new NextRequest('http://localhost:3000/api/notifications?unread=true')
      const response = await getNotifications(req)

      expect(response?.status).toBe(200)
      const data = await response?.json()
      expect(data.notifications.every((n: any) => !n.isRead)).toBe(true)
    })
  })

  describe('POST /api/notifications', () => {
    it('should create notification for authenticated user', async () => {
      mockGetRequestSession.mockResolvedValue({
        user: { id: 'manager-123', role: 'MANAGER' },
      } as any)

      mockPrismaNotification.create.mockResolvedValue({
        id: 'notif-new',
        userId: 'user-123',
        title: 'New Notification',
        message: 'New message',
        type: 'GENERAL',
        isRead: false,
        createdAt: new Date(),
      } as any)

      const req = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'user-123',
          title: 'New Notification',
          message: 'New message',
          type: 'GENERAL',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createNotification(req)
      expect(response?.status).toBe(201)
      const data = await response?.json()
      expect(data).toHaveProperty('notification')
    })

    it('should mark all notifications as read', async () => {
      mockGetRequestSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' },
      } as any)

      mockPrismaNotification.updateMany.mockResolvedValue({ count: 5 } as any)

      const req = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const { PATCH } = await import('@/app/api/notifications/route')
      const response = await PATCH(req)
      expect(response?.status).toBe(200)
      expect(mockPrismaNotification.updateMany).toHaveBeenCalled()
    })
  })

  describe('POST /api/notifications/subscribe', () => {
    it('should subscribe user to push notifications', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' },
      } as any)

      const req = new NextRequest('http://localhost:3000/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: 'https://fcm.googleapis.com/fcm/send/token',
          keys: {
            p256dh: 'test-key',
            auth: 'test-auth',
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await subscribeNotifications(req)
      expect(response?.status).toBe(200)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint: 'test' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await subscribeNotifications(req)
      expect(response?.status).toBe(401)
    })
  })
})


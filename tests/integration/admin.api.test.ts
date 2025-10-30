import { NextRequest } from 'next/server'
import { GET as getDashboard } from '@/app/api/analytics/dashboard/route'
import { GET as getStaff } from '@/app/api/staff/route'
import { GET as getNotifications } from '@/app/api/notifications/route'
import { POST as createNotification } from '@/app/api/notifications/route'

// Mock Prisma client
const mockBookingAggregate = jest.fn() as jest.MockedFunction<any>
const mockBookingFindMany = jest.fn() as jest.MockedFunction<any>
const mockBookingCount = jest.fn() as jest.MockedFunction<any>
const mockUserFindMany = jest.fn() as jest.MockedFunction<any>
const mockUserCount = jest.fn() as jest.MockedFunction<any>
const mockNotificationFindMany = jest.fn() as jest.MockedFunction<any>
const mockNotificationCreate = jest.fn() as jest.MockedFunction<any>
const mockNotificationUpdate = jest.fn() as jest.MockedFunction<any>
const mockAuditLogCreate = jest.fn() as jest.MockedFunction<any>

jest.mock('@/lib/db', () => ({
  prisma: {
    booking: {
      findMany: mockBookingFindMany,
      count: mockBookingCount,
      aggregate: mockBookingAggregate,
    },
    user: {
      findMany: mockUserFindMany,
      findUnique: jest.fn(),
      create: jest.fn(),
      count: mockUserCount,
    },
    notification: {
      findMany: mockNotificationFindMany,
      create: mockNotificationCreate,
      update: mockNotificationUpdate,
    },
    auditLog: {
      create: mockAuditLogCreate,
    },
  },
}))

// Import after mock to get the mocked version
import { prisma } from '@/lib/db'

const mockPrisma = prisma as any

describe('Admin API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/analytics/dashboard', () => {
    test('should return dashboard analytics for admin', async () => {
      const mockAnalytics = {
        revenue: {
          today: 2500.00,
          thisWeek: 15000.00,
          thisMonth: 65000.00,
          lastMonth: 58000.00,
        },
        bookings: {
          today: 8,
          thisWeek: 45,
          thisMonth: 180,
          lastMonth: 165,
        },
        occupancy: {
          current: 85.5,
          average: 78.2,
        },
        guests: {
          total: 245,
          new: 12,
          returning: 233,
        },
        topRooms: [
          {
            roomType: 'Deluxe King',
            bookings: 45,
            revenue: 13455.00,
          },
        ],
        recentBookings: [
          {
            id: 'booking-123',
            guestName: 'John Doe',
            roomType: 'Deluxe King',
            checkIn: new Date('2024-01-15'),
            totalPrice: 897.00,
            status: 'CONFIRMED',
          },
        ],
      }

      mockBookingAggregate.mockResolvedValue({
        _sum: { totalPrice: 2500.00 },
        _count: { id: 8 },
      })
      mockBookingFindMany.mockResolvedValue(mockAnalytics.recentBookings)
      mockUserCount.mockResolvedValue(245)

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard', {
        headers: {
          'Authorization': 'Bearer admin-token',
        },
      })

      const response = await getDashboard(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('revenue')
      expect(data).toHaveProperty('bookings')
      expect(data).toHaveProperty('occupancy')
      expect(data).toHaveProperty('guests')
    })

    test('should filter analytics by date range', async () => {
      const mockAnalytics = {
        revenue: {
          period: 5000.00,
        },
        bookings: {
          period: 15,
        },
      }

      mockBookingAggregate.mockResolvedValue({
        _sum: { totalPrice: 5000.00 },
        _count: { id: 15 },
      })
      mockBookingFindMany.mockResolvedValue([])
      mockUserCount.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31')
      const response = await getDashboard(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockBookingAggregate).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
        },
        _sum: { totalPrice: true },
        _count: { id: true },
      })
    })

    test('should handle unauthorized access', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard')
      const response = await getDashboard(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    test('should handle database errors gracefully', async () => {
      mockBookingAggregate.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard', {
        headers: {
          'Authorization': 'Bearer admin-token',
        },
      })

      const response = await getDashboard(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to fetch analytics')
    })
  })

  describe('GET /api/staff', () => {
    test('should return staff list for admin', async () => {
      const mockStaff = [
        {
          id: 'staff-1',
          name: 'Alice Johnson',
          email: 'alice@hotel.com',
          role: 'RECEPTIONIST',
          department: 'Front Desk',
          isActive: true,
          lastLogin: new Date('2024-01-15T09:00:00Z'),
        },
        {
          id: 'staff-2',
          name: 'Bob Smith',
          email: 'bob@hotel.com',
          role: 'KITCHEN_STAFF',
          department: 'Kitchen',
          isActive: true,
          lastLogin: new Date('2024-01-15T08:30:00Z'),
        },
      ]

      mockUserFindMany.mockResolvedValue(mockStaff)

      const request = new NextRequest('http://localhost:3000/api/staff', {
        headers: {
          'Authorization': 'Bearer admin-token',
        },
      })

      const response = await getStaff(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('staff')
      expect(data.staff).toHaveLength(2)
      expect(mockUserFindMany).toHaveBeenCalledWith({
        where: {
          role: {
            in: ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'KITCHEN_STAFF', 'HOUSEKEEPING'],
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          isActive: true,
          lastLogin: true,
        },
        orderBy: {
          name: 'asc',
        },
      })
    })

    test('should filter staff by department', async () => {
      const mockKitchenStaff = [
        {
          id: 'staff-2',
          name: 'Bob Smith',
          role: 'KITCHEN_STAFF',
          department: 'Kitchen',
        },
      ]

      mockUserFindMany.mockResolvedValue(mockKitchenStaff)

      const request = new NextRequest('http://localhost:3000/api/staff?department=Kitchen')
      const response = await getStaff(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.staff).toHaveLength(1)
      expect(mockUserFindMany).toHaveBeenCalledWith({
        where: {
          role: {
            in: ['ADMIN', 'MANAGER', 'RECEPTIONIST', 'KITCHEN_STAFF', 'HOUSEKEEPING'],
          },
          department: 'Kitchen',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          isActive: true,
          lastLogin: true,
        },
        orderBy: {
          name: 'asc',
        },
      })
    })

    test('should filter staff by role', async () => {
      const mockReceptionists = [
        {
          id: 'staff-1',
          name: 'Alice Johnson',
          role: 'RECEPTIONIST',
          department: 'Front Desk',
        },
      ]

      mockUserFindMany.mockResolvedValue(mockReceptionists)

      const request = new NextRequest('http://localhost:3000/api/staff?role=RECEPTIONIST')
      const response = await getStaff(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.staff).toHaveLength(1)
      expect(mockUserFindMany).toHaveBeenCalledWith({
        where: {
          role: 'RECEPTIONIST',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          isActive: true,
          lastLogin: true,
        },
        orderBy: {
          name: 'asc',
        },
      })
    })

    test('should handle unauthorized access', async () => {
      const request = new NextRequest('http://localhost:3000/api/staff')
      const response = await getStaff(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })
  })

  describe('GET /api/notifications', () => {
    test('should return user notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          title: 'Booking Confirmed',
          message: 'Your booking for Deluxe King room has been confirmed',
          type: 'BOOKING',
          isRead: false,
          createdAt: new Date('2024-01-15T10:00:00Z'),
        },
        {
          id: 'notif-2',
          title: 'Check-in Reminder',
          message: 'Your check-in is tomorrow at 3:00 PM',
          type: 'REMINDER',
          isRead: true,
          createdAt: new Date('2024-01-14T15:00:00Z'),
        },
      ]

      mockNotificationFindMany.mockResolvedValue(mockNotifications)

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        headers: {
          'Authorization': 'Bearer user-token',
        },
      })

      const response = await getNotifications(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('notifications')
      expect(data.notifications).toHaveLength(2)
      expect(mockNotificationFindMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    })

    test('should filter notifications by type', async () => {
      const mockBookingNotifications = [
        {
          id: 'notif-1',
          title: 'Booking Confirmed',
          type: 'BOOKING',
          isRead: false,
        },
      ]

      mockNotificationFindMany.mockResolvedValue(mockBookingNotifications)

      const request = new NextRequest('http://localhost:3000/api/notifications?type=BOOKING')
      const response = await getNotifications(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.notifications).toHaveLength(1)
      expect(mockNotificationFindMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          type: 'BOOKING',
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    })

    test('should filter unread notifications', async () => {
      const mockUnreadNotifications = [
        {
          id: 'notif-1',
          title: 'Booking Confirmed',
          isRead: false,
        },
      ]

      mockNotificationFindMany.mockResolvedValue(mockUnreadNotifications)

      const request = new NextRequest('http://localhost:3000/api/notifications?unread=true')
      const response = await getNotifications(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.notifications).toHaveLength(1)
      expect(mockNotificationFindMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isRead: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    })

    test('should handle unauthorized access', async () => {
      const request = new NextRequest('http://localhost:3000/api/notifications')
      const response = await getNotifications(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })
  })

  describe('POST /api/notifications', () => {
    test('should create notification successfully', async () => {
      const mockNotification = {
        id: 'notif-123',
        userId: 'user-123',
        title: 'Welcome to Grand Palace Hotel',
        message: 'We hope you enjoy your stay',
        type: 'WELCOME',
        isRead: false,
      }

      mockNotificationCreate.mockResolvedValue(mockNotification)

      const requestBody = {
        userId: 'user-123',
        title: 'Welcome to Grand Palace Hotel',
        message: 'We hope you enjoy your stay',
        type: 'WELCOME',
      }

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await createNotification(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveProperty('notification')
      expect(data.notification.title).toBe('Welcome to Grand Palace Hotel')
      expect(mockNotificationCreate).toHaveBeenCalledTimes(1)
    })

    test('should validate notification data', async () => {
      const requestBody = {
        userId: '',
        title: '',
        message: '',
        type: 'INVALID_TYPE',
      }

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await createNotification(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid notification data')
    })

    test('should create bulk notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'user-1',
          title: 'Bulk Notification',
          type: 'ANNOUNCEMENT',
        },
        {
          id: 'notif-2',
          userId: 'user-2',
          title: 'Bulk Notification',
          type: 'ANNOUNCEMENT',
        },
      ]

      mockNotificationCreate.mockResolvedValue(mockNotifications[0])

      const requestBody = {
        userIds: ['user-1', 'user-2'],
        title: 'Bulk Notification',
        message: 'This is a bulk notification',
        type: 'ANNOUNCEMENT',
      }

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await createNotification(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveProperty('notifications')
      expect(mockNotificationCreate).toHaveBeenCalledTimes(2)
    })

    test('should handle database errors', async () => {
      mockNotificationCreate.mockRejectedValue(new Error('Database error'))

      const requestBody = {
        userId: 'user-123',
        title: 'Test Notification',
        message: 'This is a test',
        type: 'INFO',
      }

      const request = new NextRequest('http://localhost:3000/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await createNotification(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to create notification')
    })
  })
})

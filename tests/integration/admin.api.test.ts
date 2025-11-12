import { NextRequest } from 'next/server'
import { GET as getDashboard } from '@/app/api/analytics/dashboard/route'
import { GET as getStaff } from '@/app/api/staff/route'
import { GET as getNotifications } from '@/app/api/notifications/route'
import { POST as createNotification } from '@/app/api/notifications/route'

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

// Mock Prisma client
const computeDashboardAnalyticsMock = jest.fn()

function getAdminPrismaMocks() {
  const globalRef = globalThis as any
  if (!globalRef.__ADMIN_PRISMA_MOCKS__) {
    globalRef.__ADMIN_PRISMA_MOCKS__ = {}
  }
  return globalRef.__ADMIN_PRISMA_MOCKS__ as Record<string, jest.Mock>
}

jest.mock('@/lib/db', () => {
  const prismaMocks = getAdminPrismaMocks()
  prismaMocks.mockBookingAggregate = jest.fn()
  prismaMocks.mockBookingFindMany = jest.fn()
  prismaMocks.mockBookingCount = jest.fn()
  prismaMocks.mockStaffFindMany = jest.fn()
  prismaMocks.mockUserFindMany = jest.fn()
  prismaMocks.mockUserCount = jest.fn()
  prismaMocks.mockNotificationFindMany = jest.fn()
  prismaMocks.mockNotificationCreate = jest.fn()
  prismaMocks.mockNotificationUpdate = jest.fn()
  prismaMocks.mockAuditLogCreate = jest.fn()

  return {
    prisma: {
      booking: {
        findMany: (...args: any[]) => getAdminPrismaMocks().mockBookingFindMany(...args),
        count: (...args: any[]) => getAdminPrismaMocks().mockBookingCount(...args),
        aggregate: (...args: any[]) => getAdminPrismaMocks().mockBookingAggregate(...args),
      },
      staff: {
        findMany: (...args: any[]) => getAdminPrismaMocks().mockStaffFindMany(...args),
      },
      user: {
        findMany: (...args: any[]) => getAdminPrismaMocks().mockUserFindMany(...args),
        findUnique: jest.fn(),
        create: jest.fn(),
        count: (...args: any[]) => getAdminPrismaMocks().mockUserCount(...args),
      },
      notification: {
        findMany: (...args: any[]) => getAdminPrismaMocks().mockNotificationFindMany(...args),
        create: (...args: any[]) => getAdminPrismaMocks().mockNotificationCreate(...args),
        update: (...args: any[]) => getAdminPrismaMocks().mockNotificationUpdate(...args),
      },
      auditLog: {
        create: (...args: any[]) => getAdminPrismaMocks().mockAuditLogCreate(...args),
      },
    },
  }
})

jest.mock('@/lib/analytics/dashboard', () => {
  const actual = jest.requireActual('@/lib/analytics/dashboard')
  return {
    ...actual,
    computeDashboardAnalytics: (...args: any[]) => computeDashboardAnalyticsMock(...args),
  }
})

const prismaMocks = getAdminPrismaMocks()
// Import after mock to get the mocked version
import { prisma } from '@/lib/db'

const mockPrisma = prisma as any

describe('Admin API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    computeDashboardAnalyticsMock.mockReset()
  })

  describe('GET /api/analytics/dashboard', () => {
    test('should return dashboard analytics for admin', async () => {
      const mockAnalytics = {
        summary: {
          occupancyRate: 82.5,
          averageOccupancyRate: 78.2,
          bookingGrowthRate: 12.5,
          todayRevenue: 2500,
          monthlyRevenue: 65000,
          revenueGrowthRate: 8.1,
          todayBookings: 8,
          monthlyBookings: 180,
          restaurantOrdersToday: 45,
          restaurantRevenueToday: 3800,
          restaurantRevenueMonth: 12000,
          averageOrderValueToday: 84.44,
          taskStats: {
            total: 42,
            completed: 30,
            pending: 10,
            overdue: 2,
            completionRate: 71.4,
          },
          guestSatisfaction: {
            rating: 4.7,
            reviews: 128,
          },
        },
        recentActivity: {
          bookings: [
          {
            id: 'booking-123',
              roomNumber: '701',
              guestName: 'Jordan Carter',
              createdAt: new Date('2024-01-15'),
              totalAmount: 897,
            status: 'CONFIRMED',
          },
        ],
          orders: [],
          tasks: [],
        },
      }

      computeDashboardAnalyticsMock.mockResolvedValue(mockAnalytics)

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard', {
        headers: {
          'Authorization': 'Bearer admin-token',
        },
      })

      const response = await getDashboard(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary).toEqual(mockAnalytics.summary)
      const expectedBookings = mockAnalytics.recentActivity.bookings.map(booking => ({
        ...booking,
        createdAt: booking.createdAt.toISOString(),
      }))
      expect(data.recentActivity.bookings).toEqual(expectedBookings)
      expect(data.recentActivity.orders).toEqual(mockAnalytics.recentActivity.orders)
      expect(data.recentActivity.tasks).toEqual(mockAnalytics.recentActivity.tasks)
      expect(computeDashboardAnalyticsMock).toHaveBeenCalledTimes(1)
    })

    test('should filter analytics by date range', async () => {
      const mockAnalytics = {
        summary: {
          occupancyRate: 65.4,
          averageOccupancyRate: 70.1,
          bookingGrowthRate: 5,
          todayRevenue: 5000,
          monthlyRevenue: 12000,
          revenueGrowthRate: 4,
          todayBookings: 3,
          monthlyBookings: 15,
          restaurantOrdersToday: 12,
          restaurantRevenueToday: 640,
          restaurantRevenueMonth: 4500,
          averageOrderValueToday: 53.33,
          taskStats: {
            total: 10,
            completed: 7,
            pending: 2,
            overdue: 1,
            completionRate: 70,
          },
          guestSatisfaction: {
            rating: 4.5,
            reviews: 56,
          },
        },
        recentActivity: {
          bookings: [],
          orders: [],
          tasks: [],
        },
      }

      computeDashboardAnalyticsMock.mockResolvedValue(mockAnalytics)

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31', {
        headers: {
          'Authorization': 'Bearer admin-token',
        },
      })
      const response = await getDashboard(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockAnalytics)
      expect(computeDashboardAnalyticsMock).toHaveBeenCalledWith()
    })

    test('should handle unauthorized access', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard')
      const response = await getDashboard(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })

    test('should handle database errors gracefully', async () => {
      computeDashboardAnalyticsMock.mockRejectedValue(new Error('Database connection failed'))

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
          employeeId: 'EMP-001',
          name: 'Alice Johnson',
          email: 'alice@hotel.com',
          phone: '123-456-7890',
          position: 'Receptionist',
          role: 'RECEPTIONIST',
          department: 'Front Desk',
          hireDate: new Date('2024-01-01T09:00:00Z'),
          salary: 45000,
          isActive: true,
          hotelId: null,
        },
        {
          id: 'staff-2',
          employeeId: 'EMP-002',
          name: 'Bob Smith',
          email: 'bob@hotel.com',
          phone: '321-654-0987',
          position: 'Kitchen Staff',
          role: 'KITCHEN_STAFF',
          department: 'Kitchen',
          hireDate: new Date('2024-02-10T08:30:00Z'),
          salary: 38000,
          isActive: true,
          hotelId: null,
        },
      ]

      prismaMocks.mockStaffFindMany.mockResolvedValue(mockStaff)

      const request = new NextRequest('http://localhost:3000/api/staff', {
        headers: {
          'Authorization': 'Bearer admin-token',
        },
      })

      const response = await getStaff(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(2)
      expect(prismaMocks.mockStaffFindMany).toHaveBeenCalledWith({
        where: {},
        orderBy: {
          name: 'asc',
        },
      })
    })

    test('should filter staff by department', async () => {
      const mockKitchenStaff = [
        {
          id: 'staff-2',
          employeeId: 'EMP-002',
          name: 'Bob Smith',
          email: 'bob@hotel.com',
          phone: '321-654-0987',
          role: 'KITCHEN_STAFF',
          position: 'Kitchen Staff',
          department: 'Kitchen',
          hireDate: new Date('2024-02-10T08:30:00Z'),
          salary: 38000,
          isActive: true,
          hotelId: null,
        },
      ]

      prismaMocks.mockStaffFindMany.mockResolvedValue(mockKitchenStaff)

      const request = new NextRequest('http://localhost:3000/api/staff?department=Kitchen')
      const response = await getStaff(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(1)
      expect(prismaMocks.mockStaffFindMany).toHaveBeenCalledWith({
        where: {
          department: {
            equals: 'Kitchen',
            mode: 'insensitive',
          },
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
          employeeId: 'EMP-001',
          name: 'Alice Johnson',
          email: 'alice@hotel.com',
          phone: '123-456-7890',
          role: 'RECEPTIONIST',
          position: 'Receptionist',
          department: 'Front Desk',
          hireDate: new Date('2024-01-01T09:00:00Z'),
          salary: 45000,
          isActive: true,
          hotelId: null,
        },
      ]

      prismaMocks.mockStaffFindMany.mockResolvedValue(mockReceptionists)

      const request = new NextRequest('http://localhost:3000/api/staff?role=RECEPTIONIST')
      const response = await getStaff(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(1)
      expect(prismaMocks.mockStaffFindMany).toHaveBeenCalledWith({
        where: {
          position: {
            equals: 'RECEPTIONIST',
            mode: 'insensitive',
          },
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

      prismaMocks.mockNotificationFindMany.mockResolvedValue(mockNotifications)

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
      expect(prismaMocks.mockNotificationFindMany).toHaveBeenCalledWith({
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

      prismaMocks.mockNotificationFindMany.mockResolvedValue(mockBookingNotifications)

      const request = new NextRequest('http://localhost:3000/api/notifications?type=BOOKING', {
        headers: {
          'Authorization': 'Bearer user-token',
        },
      })
      const response = await getNotifications(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.notifications).toHaveLength(1)
      expect(prismaMocks.mockNotificationFindMany).toHaveBeenCalledWith({
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

      prismaMocks.mockNotificationFindMany.mockResolvedValue(mockUnreadNotifications)

      const request = new NextRequest('http://localhost:3000/api/notifications?unread=true', {
        headers: {
          'Authorization': 'Bearer user-token',
        },
      })
      const response = await getNotifications(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.notifications).toHaveLength(1)
      expect(prismaMocks.mockNotificationFindMany).toHaveBeenCalledWith({
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

      prismaMocks.mockNotificationCreate.mockResolvedValue(mockNotification)

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
      expect(prismaMocks.mockNotificationCreate).toHaveBeenCalledTimes(1)
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
          'Authorization': 'Bearer admin-token',
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

      prismaMocks.mockNotificationCreate.mockResolvedValue(mockNotifications[0])

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
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await createNotification(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveProperty('notifications')
      expect(prismaMocks.mockNotificationCreate).toHaveBeenCalledTimes(2)
    })

    test('should handle database errors', async () => {
      prismaMocks.mockNotificationCreate.mockRejectedValue(new Error('Database error'))

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
          'Authorization': 'Bearer admin-token',
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

afterAll(() => {
  consoleErrorSpy.mockRestore()
  consoleLogSpy.mockRestore()
})

import { NextRequest } from 'next/server'
import { GET as exportAnalytics } from '@/app/api/analytics/export/route'

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

jest.mock('@/lib/db', () => {
  const mockPrismaClient = {
    booking: {
      findMany: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
    },
    room: {
      findMany: jest.fn(),
    },
  }
  return {
    __esModule: true,
    default: mockPrismaClient,
    prisma: mockPrismaClient,
  }
})

jest.mock('next-auth', () => ({
  getServerSession: jest.fn((options) => {
    // Return mocked session based on test needs
    return Promise.resolve(null)
  }),
}))

jest.mock('@/app/api/analytics/route', () => ({
  buildAnalytics: jest.fn().mockResolvedValue({
    revenue: { total: 10000, thisMonth: 5000, thisWeek: 1000, today: 200 },
    occupancy: { 
      current: 75, 
      average: 70, 
      trend: 5,
      series: []
    },
    bookings: { total: 100, confirmed: 80, pending: 15, cancelled: 5 },
    topRooms: [],
    guestSources: [],
    dailyRevenue: [],
  }),
}))

jest.mock('@/lib/analytics/core', () => ({
  normalizeAnalyticsRange: jest.fn((range) => range || '30d'),
  computeAnalytics: jest.fn().mockResolvedValue({
    revenue: { total: 10000, thisMonth: 5000, thisWeek: 1000, today: 200 },
    occupancy: { 
      current: 75, 
      average: 70, 
      trend: 5,
      series: []
    },
    bookings: { total: 100, confirmed: 80, pending: 15, cancelled: 5 },
    topRooms: [],
    guestSources: [],
    dailyRevenue: [],
  }),
}))

jest.mock('@/lib/rate-limit-enhanced', () => ({
  enhancedRateLimit: jest.fn().mockReturnValue({ allowed: true }),
  createEnhancedRateLimitResponse: jest.fn(),
}))

jest.mock('pdfkit', () => {
  return jest.fn(() => {
    const buffers: Buffer[] = []
    const handlers: Record<string, Function[]> = {}
    
  const mockDoc = {
    font: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
      list: jest.fn().mockReturnThis(),
      on: jest.fn((event: string, handler: Function) => {
        if (!handlers[event]) {
          handlers[event] = []
        }
        handlers[event].push(handler)
        
        // Simulate data events immediately for 'data' handler
        if (event === 'data') {
          setTimeout(() => {
            const buffer = Buffer.from('pdf-data')
            buffers.push(buffer)
            handler(buffer)
          }, 0)
  }
        
        return mockDoc
      }),
      end: jest.fn(function(this: any) {
        // Trigger end event which resolves the Promise
        if (handlers['end'] && handlers['end'].length > 0) {
          setTimeout(() => {
            handlers['end'].forEach(handler => handler())
          }, 0)
        }
        return this
      }),
    }
    return mockDoc
  })
})
jest.mock('exceljs', () => ({
  Workbook: jest.fn(() => {
    const worksheets: any[] = []
    return {
      creator: 'SmartHotel',
      created: new Date(),
      addWorksheet: jest.fn((name: string) => {
        const worksheet = {
          name,
          columns: [],
          addRow: jest.fn(),
          getColumn: jest.fn(() => ({ width: 0 })),
        }
        worksheets.push(worksheet)
        return worksheet
      }),
      xlsx: {
        writeBuffer: jest.fn().mockResolvedValue(Buffer.from('excel-data')),
      },
    }
  }),
}))

import prisma from '@/lib/db'
import { getServerSession } from 'next-auth'

const mockPrisma = prisma as any
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockPrismaBooking = mockPrisma.booking
const mockPrismaInvoice = mockPrisma.invoice
const mockPrismaRoom = mockPrisma.room

describe('Analytics Export API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  describe('GET /api/analytics/export', () => {
    it('should export analytics as PDF for manager', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'manager-123', role: 'MANAGER' },
      } as any)

      mockPrismaBooking.findMany.mockResolvedValue([])
      mockPrismaInvoice.findMany.mockResolvedValue([])
      mockPrismaRoom.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/analytics/export?type=pdf')
      const response = await exportAnalytics(req)

      expect(response?.status).toBe(200)
      expect(response?.headers.get('content-type')).toContain('application/pdf')
    })

    it('should export analytics as Excel for manager', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'manager-123', role: 'MANAGER' },
      } as any)

      mockPrismaBooking.findMany.mockResolvedValue([])
      mockPrismaInvoice.findMany.mockResolvedValue([])
      mockPrismaRoom.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/analytics/export?type=excel')
      const response = await exportAnalytics(req)

      expect(response?.status).toBe(200)
      expect(response?.headers.get('content-type')).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    })

    it('should return 401 for non-manager user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'guest-123', role: 'GUEST' },
      } as any)

      const req = new NextRequest('http://localhost:3000/api/analytics/export?type=pdf')
      const response = await exportAnalytics(req)

      expect(response?.status).toBe(401)
    })

    it('should return 400 for invalid format', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'manager-123', role: 'MANAGER' },
      } as any)

      const req = new NextRequest('http://localhost:3000/api/analytics/export?type=invalid')
      const response = await exportAnalytics(req)

      expect(response?.status).toBe(400)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/analytics/export?type=pdf')
      const response = await exportAnalytics(req)

      expect(response?.status).toBe(401)
    })
  })
})


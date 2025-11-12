import { NextRequest } from 'next/server'
import { GET as getStaff } from '@/app/api/staff/route'

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

jest.mock('@/lib/db', () => {
  const mockPrismaClient = {
    staff: {
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

jest.mock('@/lib/session', () => ({
  getRequestSession: jest.fn((request) => {
    // Return mocked session based on test needs
    return Promise.resolve(null)
  }),
}))

jest.mock('@/lib/audit', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
  AUDIT_ACTIONS: {
    STAFF_CREATE: 'STAFF_CREATE',
  },
}))

import prisma from '@/lib/db'
import { getServerSession } from 'next-auth'
import { getRequestSession } from '@/lib/session'

const mockPrisma = prisma as any
const mockGetRequestSession = getRequestSession as jest.MockedFunction<typeof getRequestSession>
const mockPrismaStaff = mockPrisma.staff

describe('Staff API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  describe('GET /api/staff', () => {
    it('should return staff list for authenticated user', async () => {
      mockGetRequestSession.mockResolvedValue({
        user: { id: 'user-123', role: 'MANAGER' },
      } as any)

      mockPrismaStaff.findMany.mockResolvedValue([
        {
          id: 'staff-1',
          employeeId: 'EMP001',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          position: 'Receptionist',
          department: 'Front Desk',
          hireDate: new Date('2023-01-01'),
          salary: 50000,
          isActive: true,
          hotelId: null,
        },
        {
          id: 'staff-2',
          employeeId: 'EMP002',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '123-456-7891',
          position: 'Housekeeper',
          department: 'Housekeeping',
          hireDate: new Date('2023-02-01'),
          salary: 45000,
          isActive: true,
          hotelId: null,
        },
      ] as any)

      const req = new NextRequest('http://localhost:3000/api/staff')
      const response = await getStaff(req)

      expect(response?.status).toBe(200)
      const data = await response?.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(2)
    })

    it('should filter staff by department', async () => {
      mockGetRequestSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' },
      } as any)

      mockPrismaStaff.findMany.mockResolvedValue([
        {
          id: 'staff-1',
          employeeId: 'EMP001',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          position: 'Receptionist',
          department: 'Front Desk',
          hireDate: new Date('2023-01-01'),
          salary: 50000,
          isActive: true,
          hotelId: null,
        },
      ] as any)

      const req = new NextRequest('http://localhost:3000/api/staff?department=Front Desk')
      const response = await getStaff(req)

      expect(response?.status).toBe(200)
      expect(mockPrismaStaff.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            department: expect.objectContaining({ equals: 'Front Desk' }),
          }),
        }),
      )
    })

    it('should filter staff by role/position', async () => {
      mockGetRequestSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' },
      } as any)

      mockPrismaStaff.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/staff?role=Receptionist')
      const response = await getStaff(req)

      expect(response?.status).toBe(200)
      expect(mockPrismaStaff.findMany).toHaveBeenCalled()
    })

    it('should return empty array when no staff found', async () => {
      mockGetRequestSession.mockResolvedValue({
        user: { id: 'user-123', role: 'MANAGER' },
      } as any)

      mockPrismaStaff.findMany.mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/staff')
      const response = await getStaff(req)

      expect(response?.status).toBe(200)
      const data = await response?.json()
      expect(data).toEqual([])
    })
  })
})


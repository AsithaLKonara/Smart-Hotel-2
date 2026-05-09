import { NextRequest } from 'next/server'
import { GET as getInventory, POST as createInventory } from '@/app/api/inventory/route'
import { PUT as updateInventory, DELETE as deleteInventory } from '@/app/api/inventory/[id]/route'

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

jest.mock('@/lib/db', () => {
  const mockPrismaClient = {
    inventory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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

const mockGetRequestSessionFn = jest.fn((request) => Promise.resolve(null))

jest.mock('@/lib/session', () => ({
  getRequestSession: (request: any) => mockGetRequestSessionFn(request),
}))

jest.mock('@/lib/audit', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
  AUDIT_ACTIONS: {
    INVENTORY_CREATE: 'INVENTORY_CREATE',
    INVENTORY_UPDATE: 'INVENTORY_UPDATE',
    INVENTORY_DELETE: 'INVENTORY_DELETE',
  },
}))

import prisma from '@/lib/db'
import { getServerSession } from 'next-auth'
import { getRequestSession } from '@/lib/session'

const mockPrisma = prisma as any
const mockGetServerSession = mockGetServerSessionFn as jest.MockedFunction<typeof mockGetServerSessionFn>
const mockGetRequestSession = mockGetRequestSessionFn as jest.MockedFunction<typeof getRequestSession>
const mockPrismaInventory = mockPrisma.inventory

describe('Inventory API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetServerSession.mockReset()
    mockGetRequestSession.mockReset()

    // Default to authorized MANAGER for both session providers
    const mockManagerSession = {
      user: { id: 'manager-123', role: 'MANAGER' },
    }
    mockGetServerSession.mockResolvedValue(mockManagerSession as any)
    mockGetRequestSession.mockResolvedValue(mockManagerSession as any)
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  describe('GET /api/inventory', () => {
    it('should return inventory items for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'MANAGER' },
      } as any)

      mockPrismaInventory.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          name: 'Towels',
          category: 'LINEN',
          quantity: 100,
          unit: 'pieces',
          minThreshold: 20,
        },
        {
          id: 'inv-2',
          name: 'Shampoo',
          category: 'AMENITIES',
          quantity: 50,
          unit: 'bottles',
          minThreshold: 10,
        },
      ] as any)

      const req = new NextRequest('http://localhost:3000/api/inventory')
      const response = await getInventory(req)

      expect(response?.status).toBe(200)
      const data = await response?.json()
      expect(Array.isArray(data.items)).toBe(true)
      expect(data.items).toHaveLength(2)
    })

    it('should filter inventory by category', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'MANAGER' },
      } as any)

      mockPrismaInventory.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          category: 'LINEN',
        },
      ] as any)

      const req = new NextRequest('http://localhost:3000/api/inventory?category=LINEN')
      const response = await getInventory(req)

      expect(response?.status).toBe(200)
      expect(mockPrismaInventory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'LINEN' }),
        }),
      )
    })

    it('should filter low stock items', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'MANAGER' },
      } as any)

      mockPrismaInventory.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          quantity: 5,
          minThreshold: 20,
        },
      ] as any)

      const req = new NextRequest('http://localhost:3000/api/inventory?lowStock=true')
      const response = await getInventory(req)

      expect(response?.status).toBe(200)
    })
  })

  describe('POST /api/inventory', () => {
    it('should create inventory item for manager', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'manager-123', role: 'MANAGER' },
      } as any)

      mockPrismaInventory.create.mockResolvedValue({
        id: 'inv-new',
        name: 'New Item',
        category: 'AMENITIES',
        quantity: 100,
        unit: 'pieces',
        minThreshold: 20,
        createdAt: new Date(),
      } as any)

      const req = new NextRequest('http://localhost:3000/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Item',
          category: 'AMENITIES',
          quantity: 100,
          unit: 'pieces',
          minThreshold: 20,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createInventory(req)
      expect(response?.status).toBe(201)
      const data = await response?.json()
      expect(data.item).toHaveProperty('id')
    })

    it('should return 401 for non-manager user', async () => {
      const mockGuestSession = {
        user: { id: 'guest-123', role: 'GUEST' },
      }
      mockGetServerSession.mockResolvedValue(mockGuestSession as any)
      mockGetRequestSession.mockResolvedValue(mockGuestSession as any)

      const req = new NextRequest('http://localhost:3000/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Item',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createInventory(req)
      expect(response?.status).toBe(401)
    })
  })

  describe('PUT /api/inventory/[id]', () => {
    it('should update inventory quantity', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'manager-123', role: 'MANAGER' },
      } as any)

      mockPrismaInventory.findUnique.mockResolvedValue({
        id: 'inv-1',
        quantity: 100,
      } as any)

      mockPrismaInventory.update.mockResolvedValue({
        id: 'inv-1',
        quantity: 150,
      } as any)

      const req = new NextRequest('http://localhost:3000/api/inventory/inv-1', {
        method: 'PUT',
        body: JSON.stringify({ quantity: 150 }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await updateInventory(req, { params: Promise.resolve({ id: 'inv-1' }) })
      expect(response?.status).toBe(200)
      const data = await response?.json()
      expect(data.item.quantity).toBe(150)
    })

    it('should return 404 for non-existent item', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'manager-123', role: 'MANAGER' },
      } as any)

      mockPrismaInventory.findUnique.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/inventory/non-existent', {
        method: 'PUT',
        body: JSON.stringify({ quantity: 150 }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await updateInventory(req, { params: Promise.resolve({ id: 'non-existent' }) })
      expect(response?.status).toBe(404)
    })
  })

  describe('DELETE /api/inventory/[id]', () => {
    it('should delete inventory item for manager', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'manager-123', role: 'MANAGER' },
      } as any)

      mockPrismaInventory.findUnique.mockResolvedValue({
        id: 'inv-1',
      } as any)

      mockPrismaInventory.delete.mockResolvedValue({} as any)

      const req = new NextRequest('http://localhost:3000/api/inventory/inv-1', {
        method: 'DELETE',
      })

      const response = await deleteInventory(req, { params: Promise.resolve({ id: 'inv-1' }) })
      expect(response?.status).toBe(200)
    })
  })
})


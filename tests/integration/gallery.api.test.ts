import { NextRequest } from 'next/server'
import { GET as getGallery, POST as createGallery } from '@/app/api/gallery/route'
import { GET as getGalleryItem, DELETE as deleteGalleryItem } from '@/app/api/gallery/[id]/route'

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

jest.mock('@/lib/db', () => {
  const mockPrismaClient = {
    gallery: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
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

jest.mock('@/lib/audit', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
  AUDIT_ACTIONS: {
    GALLERY_CREATE: 'GALLERY_CREATE',
    GALLERY_DELETE: 'GALLERY_DELETE',
  },
}))

import prisma from '@/lib/db'
import { getServerSession } from 'next-auth'

const mockPrisma = prisma as any
const mockGetServerSession = mockGetServerSessionFn as jest.MockedFunction<typeof mockGetServerSessionFn>
const mockPrismaGallery = mockPrisma.gallery

describe('Gallery API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  describe('GET /api/gallery', () => {
    it('should return gallery items', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' },
      } as any)

      mockPrismaGallery.findMany.mockResolvedValue([
        {
          id: 'gallery-1',
          title: 'Lobby View',
          imageUrl: '/images/gallery/lobby.jpg',
          category: 'ROOM',
          description: 'Beautiful lobby',
        },
        {
          id: 'gallery-2',
          title: 'Pool Area',
          imageUrl: '/images/gallery/pool.jpg',
          category: 'AMENITY',
          description: 'Infinity pool',
        },
      ] as any)

      const req = new NextRequest('http://localhost:3000/api/gallery')
      const response = await getGallery(req)

      expect(response?.status).toBe(200)
      const data = await response?.json()
      expect(Array.isArray(data.items)).toBe(true)
      expect(data.items).toHaveLength(2)
    })

    it('should filter gallery by category', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' },
      } as any)

      mockPrismaGallery.findMany.mockResolvedValue([
        {
          id: 'gallery-1',
          category: 'ROOM',
        },
      ] as any)

      const req = new NextRequest('http://localhost:3000/api/gallery?category=ROOM')
      const response = await getGallery(req)

      expect(response?.status).toBe(200)
      expect(mockPrismaGallery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'ROOM' }),
        }),
      )
    })
  })

  describe('POST /api/gallery', () => {
    it('should create gallery item for manager', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'manager-123', role: 'MANAGER' },
      } as any)

      mockPrismaGallery.create.mockResolvedValue({
        id: 'gallery-new',
        title: 'New Image',
        imageUrl: '/images/gallery/new.jpg',
        category: 'ROOM',
        createdAt: new Date(),
      } as any)

      const req = new NextRequest('http://localhost:3000/api/gallery', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Image',
          imageUrl: 'https://example.com/images/gallery/new.jpg',
          category: 'ROOM',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createGallery(req)
      expect(response?.status).toBe(201)
      const data = await response?.json()
      expect(data.item).toHaveProperty('id')
    })

    it('should return 401 for non-manager user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'guest-123', role: 'GUEST' },
      } as any)

      const req = new NextRequest('http://localhost:3000/api/gallery', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Image',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createGallery(req)
      expect(response?.status).toBe(401)
    })
  })

  describe('GET /api/gallery/[id]', () => {
    it('should return single gallery item', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'GUEST' },
      } as any)

      mockPrismaGallery.findUnique.mockResolvedValue({
        id: 'gallery-1',
        title: 'Lobby View',
        imageUrl: '/images/gallery/lobby.jpg',
        category: 'ROOM',
      } as any)

      const req = new NextRequest('http://localhost:3000/api/gallery/gallery-1')
      const response = await getGalleryItem(req, { params: Promise.resolve({ id: 'gallery-1' }) })

      expect(response?.status).toBe(200)
      const data = await response?.json()
      expect(data.item).toHaveProperty('id')
      expect(data.item.id).toBe('gallery-1')
    })

    it('should return 404 for non-existent item', async () => {
      mockPrismaGallery.findUnique.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/gallery/non-existent')
      const response = await getGalleryItem(req, { params: Promise.resolve({ id: 'non-existent' }) })

      expect(response?.status).toBe(404)
    })
  })

  describe('DELETE /api/gallery/[id]', () => {
    it('should delete gallery item for manager', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'manager-123', role: 'MANAGER' },
      } as any)

      mockPrismaGallery.findUnique.mockResolvedValue({
        id: 'gallery-1',
      } as any)

      mockPrismaGallery.delete.mockResolvedValue({} as any)

      const req = new NextRequest('http://localhost:3000/api/gallery/gallery-1', {
        method: 'DELETE',
      })

      const response = await deleteGalleryItem(req, { params: Promise.resolve({ id: 'gallery-1' }) })
      expect(response?.status).toBe(200)
    })
  })
})


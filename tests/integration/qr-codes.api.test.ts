import { NextRequest } from 'next/server'
import { POST as generateQRCode } from '@/app/api/qr-codes/generate/route'

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

jest.mock('@/lib/db', () => ({
  prisma: {
    booking: {
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('next-auth', () => ({
  getServerSession: jest.fn((options) => {
    // Return mocked session based on test needs
    return Promise.resolve(null)
  }),
}))

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,test-qr-code'),
}))

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
}))

import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'

const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('QR Codes API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  describe('POST /api/qr-codes/generate', () => {
    it('should generate QR code with valid data', async () => {
      const req = new NextRequest('http://localhost:3000/api/qr-codes/generate', {
        method: 'POST',
        body: JSON.stringify({ data: 'test-data' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await generateQRCode(req)
      expect(response?.status).toBe(200)
      const data = await response?.json()
      expect(data).toHaveProperty('qrCode')
      expect(data.qrCode).toHaveProperty('dataUrl')
    })

    it('should generate QR code with roomNumber and guestId', async () => {
      const req = new NextRequest('http://localhost:3000/api/qr-codes/generate', {
        method: 'POST',
        body: JSON.stringify({ roomNumber: '101', guestId: 'guest-123' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await generateQRCode(req)
      expect(response?.status).toBe(200)
      const data = await response?.json()
      expect(data).toHaveProperty('qrCode')
    })

    it('should return 400 for missing parameters', async () => {
      const req = new NextRequest('http://localhost:3000/api/qr-codes/generate', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await generateQRCode(req)
      expect(response?.status).toBe(400)
    })
  })
})


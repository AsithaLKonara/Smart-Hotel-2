import { jest } from '@jest/globals'
import { generateQRToken, verifyQRToken, generateOrderingURL, generateQRData } from '@/lib/qr'

const originalNow = Date.now

describe('lib/qr', () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = 'test-secret'
  })

  afterEach(() => {
    Date.now = originalNow
    jest.restoreAllMocks()
  })

  it('generates and verifies QR tokens', async () => {
    const token = await generateQRToken({ roomNumber: '301', guestId: 'guest-1', bookingId: 'booking-9' })
    expect(typeof token).toBe('string')

    const decoded = await verifyQRToken(token)
    expect(decoded).toMatchObject({ roomNumber: '301', guestId: 'guest-1', bookingId: 'booking-9' })
    expect(decoded?.expiresAt).toBeGreaterThan(Date.now())
  })

  it('returns null for expired tokens', async () => {
    const token = await generateQRToken({ roomNumber: '301', guestId: 'guest-1' })

    const expiredNow = Date.now() + 25 * 60 * 60 * 1000
    Date.now = () => expiredNow

    const decoded = await verifyQRToken(token)
    expect(decoded).toBeNull()
  })

  it('handles invalid tokens gracefully', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const decoded = await verifyQRToken('invalid-token')
    expect(decoded).toBeNull()
    expect(errorSpy).toHaveBeenCalled()
  })

  it('builds ordering URL using defaults and overrides', () => {
    process.env.NODE_ENV = 'development'
    process.env.NEXTAUTH_URL = 'http://localhost:4000'

    const token = 'token-123'
    expect(generateOrderingURL(token)).toBe('http://localhost:4000/order?token=token-123')
    expect(generateOrderingURL(token, 'https://custom.app')).toBe('https://custom.app/order?token=token-123')
  })

  it('generates QR data links with optional params', () => {
    process.env.NEXTAUTH_URL = 'https://app.test'
    const data = generateQRData('301', 'guest-1', 'booking-2', 'hotel-5')
    expect(data).toBe('https://app.test/order?room=301&guest=guest-1&booking=booking-2&hotel=hotel-5')
  })
})

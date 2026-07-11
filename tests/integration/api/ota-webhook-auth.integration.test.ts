/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/webhooks/ota/route'

// Mock the rate limiter so we don't accidentally fail due to rate limits during tests
jest.mock('@/lib/rate-limit-enhanced', () => ({
  enhancedRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
  createEnhancedRateLimitResponse: jest.fn()
}))

// Mock processOtaReservation so we don't try to touch the DB or do actual business logic
jest.mock('@/lib/ota/webhook-handler', () => ({
  processOtaReservation: jest.fn().mockResolvedValue({ status: 'mocked' })
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  log: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

describe('OTA Webhook Authentication (INT-001)', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it('should return 401 Unauthorized when OTA_WEBHOOK_SECRET is missing from environment', async () => {
    // Arrange: Unset secret
    delete process.env.OTA_WEBHOOK_SECRET

    const req = new NextRequest('http://localhost/api/webhooks/ota', {
      method: 'POST',
      body: JSON.stringify({ event: 'test' })
    })

    // Act
    const response = await POST(req)
    const json = await response.json()

    // Assert
    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('should return 401 Unauthorized when Authorization header is invalid', async () => {
    // Arrange: Set environment secret but omit header
    process.env.OTA_WEBHOOK_SECRET = 'valid-ota-secret'

    const req = new NextRequest('http://localhost/api/webhooks/ota', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer wrong-secret'
      },
      body: JSON.stringify({ event: 'test' })
    })

    // Act
    const response = await POST(req)
    const json = await response.json()

    // Assert
    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('should return 200 OK when Authorization header matches OTA_WEBHOOK_SECRET', async () => {
    // Arrange: Valid environment and valid header
    process.env.OTA_WEBHOOK_SECRET = 'valid-ota-secret'

    const req = new NextRequest('http://localhost/api/webhooks/ota', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-ota-secret'
      },
      body: JSON.stringify({ event: 'test' })
    })

    // Act
    const response = await POST(req)
    const json = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
  })
})

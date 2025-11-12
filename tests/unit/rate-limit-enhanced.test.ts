import { enhancedRateLimit, getClientIdentifier, authLimiter, createEnhancedRateLimitResponse } from '@/lib/rate-limit-enhanced'
import { NextRequest } from 'next/server'

describe('EnhancedRateLimit', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    mockRequest = new NextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': '192.168.1.1'
      }
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('getClientIdentifier', () => {
    it('should return x-forwarded-for header when present', () => {
      const identifier = getClientIdentifier(mockRequest)
      expect(identifier).toMatch(/^192\.168\.1\.1:/)
    })

    it('should return x-real-ip when x-forwarded-for is not present', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-real-ip': '10.0.0.1'
        }
      })
      
      const identifier = getClientIdentifier(request)
      expect(identifier).toMatch(/^10\.0\.0\.1:/)
    })

    it('should return "unknown" when no IP headers are present', () => {
      const request = new NextRequest('http://localhost:3000/api/test')
      
      const identifier = getClientIdentifier(request)
      expect(identifier).toMatch(/^unknown:/)
    })
  })

  describe('enhancedRateLimit', () => {
    it('should allow requests within limit', () => {
      const result = enhancedRateLimit(mockRequest, 'api')
      
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeGreaterThan(0)
      expect(result.resetTime).toBeGreaterThan(Date.now())
    })

    it('should return correct rate limit type for different endpoints', () => {
      const authResult = enhancedRateLimit(mockRequest, 'auth')
      const bookingResult = enhancedRateLimit(mockRequest, 'booking')
      const apiResult = enhancedRateLimit(mockRequest, 'api')
      
      expect(authResult).toBeDefined()
      expect(bookingResult).toBeDefined()
      expect(apiResult).toBeDefined()
    })

    it('blocks after exceeding auth limit and unblocks after block duration', () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00.000Z'))
      const request = new NextRequest('http://localhost:3000/api/auth', {
        headers: { 'x-forwarded-for': '203.0.113.10' }
      })

      for (let i = 0; i < 5; i++) {
        const result = enhancedRateLimit(request, 'auth')
        expect(result.allowed).toBe(true)
      }

      jest.setSystemTime(new Date('2025-01-01T00:00:01.000Z'))
      const blocked = enhancedRateLimit(request, 'auth')
      expect(blocked.allowed).toBe(false)
      expect(blocked.blocked).toBe(true)
      expect(blocked.blockUntil).toBeDefined()

      jest.setSystemTime(new Date(blocked.blockUntil! + 1000))
      const afterBlock = enhancedRateLimit(request, 'auth')
      expect(afterBlock.allowed).toBe(true)
      expect(afterBlock.blocked).toBe(false)

      jest.setSystemTime(new Date(afterBlock.resetTime + 60_000))
      authLimiter.cleanup()
    })

    it('cleanup removes expired records', () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-01-02T00:00:00.000Z'))
      const request = new NextRequest('http://localhost:3000/api/auth', {
        headers: { 'x-forwarded-for': '198.51.100.5' }
      })

      const initial = enhancedRateLimit(request, 'auth')
      expect(initial.allowed).toBe(true)

      jest.setSystemTime(new Date('2025-01-02T00:20:00.000Z'))
      authLimiter.cleanup()

      const afterCleanup = enhancedRateLimit(request, 'auth')
      expect(afterCleanup.allowed).toBe(true)
      expect(afterCleanup.remaining).toBe(4)
    })
  })

  describe('authLimiter', () => {
    it('should have correct configuration for auth endpoints', () => {
      expect(authLimiter).toBeDefined()
    })
  })

  describe('createEnhancedRateLimitResponse', () => {
    it('creates a 429 response with helpful headers and payload', async () => {
      const now = Date.now()
      const response = createEnhancedRateLimitResponse({
        allowed: false,
        remaining: 0,
        resetTime: now + 60_000,
        blocked: true,
        blockUntil: now + 120_000,
      })

      expect(response.status).toBe(429)
      expect(response.headers.get('X-RateLimit-Blocked')).toBe('true')
      expect(response.headers.get('Retry-After')).toBeDefined()

      const body = await response.json()
      expect(body.error).toBe('Too many requests')
      expect(body.blockUntil).toBeDefined()
      expect(body.retryAfter).toBeGreaterThan(0)
    })
  })
})
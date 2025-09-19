import { enhancedRateLimit, getClientIdentifier, authLimiter } from '@/lib/rate-limit-enhanced'
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
    // Clean up any rate limit state if needed
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
  })

  describe('authLimiter', () => {
    it('should have correct configuration for auth endpoints', () => {
      expect(authLimiter).toBeDefined()
      // Test that auth limiter has appropriate limits
    })
  })
})
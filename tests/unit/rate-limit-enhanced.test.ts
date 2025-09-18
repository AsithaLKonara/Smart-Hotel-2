import { EnhancedRateLimiter, getClientIdentifier } from '@/lib/rate-limit-enhanced'
import { NextRequest } from 'next/server'

describe('EnhancedRateLimiter', () => {
  let limiter: EnhancedRateLimiter

  beforeEach(() => {
    limiter = new EnhancedRateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
      blockDurationMs: 300000, // 5 minutes
    })
  })

  afterEach(() => {
    limiter.cleanup()
  })

  it('should allow requests within limit', () => {
    const result = limiter.isAllowed('test-client-1')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('should block requests when limit exceeded', () => {
    // Make 5 requests to reach the limit
    for (let i = 0; i < 5; i++) {
      limiter.isAllowed('test-client-1')
    }

    // 6th request should be blocked
    const result = limiter.isAllowed('test-client-1')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should reset window after time expires', async () => {
    // Create a limiter with a very short window
    const shortLimiter = new EnhancedRateLimiter({
      windowMs: 100, // 100ms
      maxRequests: 2,
      blockDurationMs: 1000,
    })

    // Make 2 requests to reach the limit
    shortLimiter.isAllowed('test-client-1')
    shortLimiter.isAllowed('test-client-1')

    // Should be blocked
    expect(shortLimiter.isAllowed('test-client-1').allowed).toBe(false)

    // Wait for window to reset
    await new Promise(resolve => setTimeout(resolve, 150))

    // Should be allowed again
    expect(shortLimiter.isAllowed('test-client-1').allowed).toBe(true)

    shortLimiter.cleanup()
  })

  it('should block clients for specified duration', async () => {
    // Make requests to exceed limit and trigger blocking
    for (let i = 0; i < 6; i++) {
      limiter.isAllowed('test-client-1')
    }

    // Client should be blocked
    expect(limiter.isAllowed('test-client-1').allowed).toBe(false)

    // Cleanup and recreate limiter to simulate restart
    limiter.cleanup()
    limiter = new EnhancedRateLimiter({
      windowMs: 60000,
      maxRequests: 5,
      blockDurationMs: 100, // Short block duration for testing
    })

    // Should still be blocked due to persistent blocking
    expect(limiter.isAllowed('test-client-1').allowed).toBe(false)

    // Wait for block duration to expire
    await new Promise(resolve => setTimeout(resolve, 150))

    // Should be allowed again
    expect(limiter.isAllowed('test-client-1').allowed).toBe(true)

    limiter.cleanup()
  })
})

describe('getClientIdentifier', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const request = new NextRequest('http://localhost:3000', {
      headers: {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        'user-agent': 'Mozilla/5.0',
      },
    })

    const identifier = getClientIdentifier(request)
    expect(identifier).toContain('192.168.1.1')
  })

  it('should fallback to x-real-ip header', () => {
    const request = new NextRequest('http://localhost:3000', {
      headers: {
        'x-real-ip': '10.0.0.1',
        'user-agent': 'Mozilla/5.0',
      },
    })

    const identifier = getClientIdentifier(request)
    expect(identifier).toContain('10.0.0.1')
  })

  it('should include user agent hash for uniqueness', () => {
    const request1 = new NextRequest('http://localhost:3000', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0 (Chrome)',
      },
    })

    const request2 = new NextRequest('http://localhost:3000', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0 (Firefox)',
      },
    })

    const identifier1 = getClientIdentifier(request1)
    const identifier2 = getClientIdentifier(request2)

    expect(identifier1).not.toBe(identifier2)
  })
})

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  limit: number // Maximum requests per interval
  blockDuration?: number // How long to block after limit exceeded
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  blocked: boolean
  blockUntil?: number
}

class EnhancedRateLimiter {
  private requests: Map<string, { 
    count: number
    resetTime: number
    blocked: boolean
    blockUntil?: number
  }> = new Map()

  constructor(private config: RateLimitConfig) {}

  isAllowed(identifier: string): RateLimitResult {
    const now = Date.now()
    const record = this.requests.get(identifier)

    // Check if currently blocked
    if (record?.blocked && record.blockUntil && now < record.blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        blocked: true,
        blockUntil: record.blockUntil
      }
    }

    // Reset if block period expired
    if (record?.blocked && record.blockUntil && now >= record.blockUntil) {
      this.requests.delete(identifier)
    }

    // Check if reset time passed
    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.interval,
        blocked: false
      })
      return {
        allowed: true,
        remaining: this.config.limit - 1,
        resetTime: now + this.config.interval,
        blocked: false
      }
    }

    // Check if limit exceeded
    if (record.count >= this.config.limit) {
      const blockUntil = now + (this.config.blockDuration || this.config.interval)
      this.requests.set(identifier, {
        ...record,
        blocked: true,
        blockUntil
      })
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        blocked: true,
        blockUntil
      }
    }

    // Increment counter
    record.count++
    this.requests.set(identifier, record)

    return {
      allowed: true,
      remaining: this.config.limit - record.count,
      resetTime: record.resetTime,
      blocked: false
    }
  }

  getRemaining(identifier: string): number {
    const record = this.requests.get(identifier)
    if (!record || record.blocked) return 0
    return Math.max(0, this.config.limit - record.count)
  }

  getResetTime(identifier: string): number {
    const record = this.requests.get(identifier)
    return record?.resetTime || Date.now() + this.config.interval
  }

  // Clean up expired records periodically
  cleanup() {
    const now = Date.now()
    const entries = Array.from(this.requests.entries())
    for (const [key, record] of entries) {
      if (now > record.resetTime && (!record.blocked || !record.blockUntil || now > record.blockUntil)) {
        this.requests.delete(key)
      }
    }
  }
}

// Enhanced rate limiters with blocking
const authLimiter = new EnhancedRateLimiter({ 
  interval: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 attempts per 15 minutes
  blockDuration: 30 * 60 * 1000 // Block for 30 minutes after limit exceeded
})

const bookingLimiter = new EnhancedRateLimiter({ 
  interval: 60 * 1000, // 1 minute
  limit: 10, // 10 requests per minute
  blockDuration: 5 * 60 * 1000 // Block for 5 minutes
})

const apiLimiter = new EnhancedRateLimiter({ 
  interval: 60 * 1000, // 1 minute
  limit: 100, // 100 requests per minute
  blockDuration: 2 * 60 * 1000 // Block for 2 minutes
})

const paymentLimiter = new EnhancedRateLimiter({ 
  interval: 60 * 1000, // 1 minute
  limit: 5, // 5 payment attempts per minute
  blockDuration: 10 * 60 * 1000 // Block for 10 minutes
})

// Cleanup expired records every 5 minutes
const cleanupInterval = setInterval(() => {
  authLimiter.cleanup()
  bookingLimiter.cleanup()
  apiLimiter.cleanup()
  paymentLimiter.cleanup()
}, 5 * 60 * 1000)

if (typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref()
}

export function getClientIdentifier(req: NextRequest): string {
  // Use IP address as identifier with additional fingerprinting
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || 'unknown'
  
  // Add user agent hash for additional uniqueness (if available)
  const userAgent = req.headers.get('user-agent') || ''
  const userAgentHash = userAgent.length > 0 ? 
    Buffer.from(userAgent).toString('base64').slice(0, 8) : ''
  
  return `${ip}:${userAgentHash}`
}

export function enhancedRateLimit(
  req: NextRequest,
  type: 'auth' | 'booking' | 'api' | 'payment' = 'api'
): RateLimitResult {
  const identifier = getClientIdentifier(req)
  let limiter: EnhancedRateLimiter

  switch (type) {
    case 'auth':
      limiter = authLimiter
      break
    case 'booking':
      limiter = bookingLimiter
      break
    case 'payment':
      limiter = paymentLimiter
      break
    default:
      limiter = apiLimiter
  }

  return limiter.isAllowed(identifier)
}

export function createEnhancedRateLimitResponse(
  result: RateLimitResult
): NextResponse {
  const resetDate = new Date(result.resetTime).toISOString()
  const blockUntilDate = result.blockUntil ? new Date(result.blockUntil).toISOString() : undefined
  
  const responseBody = { 
    error: 'Too many requests',
    message: result.blocked ? 
      'Rate limit exceeded. You have been temporarily blocked.' : 
      'Rate limit exceeded. Please try again later.',
    resetTime: resetDate,
    blockUntil: blockUntilDate,
    retryAfter: result.blocked && result.blockUntil ? 
      Math.ceil((result.blockUntil - Date.now()) / 1000) :
      Math.ceil((result.resetTime - Date.now()) / 1000)
  }
  
  return NextResponse.json(responseBody, { 
    status: 429,
    headers: {
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': resetDate,
      'X-RateLimit-Blocked': result.blocked.toString(),
      'Retry-After': responseBody.retryAfter.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  })
}

// Export individual limiters for specific use cases
export { authLimiter, bookingLimiter, apiLimiter, paymentLimiter }


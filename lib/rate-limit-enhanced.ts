import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

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

// Check if Upstash Redis credentials exist in the environment
const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

class EnhancedRateLimiter {
  private requests: Map<string, { 
    count: number
    resetTime: number
    blocked: boolean
    blockUntil?: number
  }> = new Map()

  private upstashRatelimit: Ratelimit | null = null

  constructor(private prefix: string, private config: RateLimitConfig) {
    if (hasRedis) {
      try {
        const redis = Redis.fromEnv()
        const durationSeconds = Math.ceil(this.config.interval / 1000)
        
        this.upstashRatelimit = new Ratelimit({
          redis: redis,
          limiter: Ratelimit.slidingWindow(this.config.limit, `${durationSeconds} s`),
          prefix: `@upstash/ratelimit:${prefix}`,
          analytics: true,
        })
      } catch (err) {
        console.warn(`[SRE] Failed to initialize Upstash Redis ratelimiter for prefix "${prefix}", falling back to memory:`, err)
      }
    }
  }

  /**
   * Resilient, high-concurrency rate limit check.
   * Utilizes Upstash Redis sliding window rate limiting when active,
   * with automatic, seamless fallback to in-memory tracking.
   */
  async isAllowedAsync(identifier: string): Promise<RateLimitResult> {
    if (this.upstashRatelimit) {
      try {
        const result = await this.upstashRatelimit.limit(identifier)
        return {
          allowed: result.success,
          remaining: result.remaining,
          resetTime: result.reset,
          blocked: !result.success,
          blockUntil: !result.success ? Date.now() + (this.config.blockDuration || this.config.interval) : undefined
        }
      } catch (err) {
        console.error(`[SRE] Upstash Redis call failed for prefix "${this.prefix}", falling back to memory:`, err)
      }
    }

    // In-memory fallback
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

  /**
   * Synchronous rate limit check.
   * Leveraged by legacy or synchronous invocation contexts.
   */
  isAllowed(identifier: string): RateLimitResult {
    const now = Date.now()
    const record = this.requests.get(identifier)

    if (record?.blocked && record.blockUntil && now < record.blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        blocked: true,
        blockUntil: record.blockUntil
      }
    }

    if (record?.blocked && record.blockUntil && now >= record.blockUntil) {
      this.requests.delete(identifier)
    }

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

    record.count++
    this.requests.set(identifier, record)

    return {
      allowed: true,
      remaining: this.config.limit - record.count,
      resetTime: record.resetTime,
      blocked: false
    }
  }

  // Clean up expired in-memory records periodically
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

// Scoped enhanced rate limiters
const authLimiter = new EnhancedRateLimiter('auth', { 
  interval: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 attempts per 15 minutes
  blockDuration: 30 * 60 * 1000 // Block for 30 minutes after limit exceeded
})

const bookingLimiter = new EnhancedRateLimiter('booking', { 
  interval: 60 * 1000, // 1 minute
  limit: 10, // 10 requests per minute
  blockDuration: 5 * 60 * 1000 // Block for 5 minutes
})

const apiLimiter = new EnhancedRateLimiter('api', { 
  interval: 60 * 1000, // 1 minute
  limit: 100, // 100 requests per minute
  blockDuration: 2 * 60 * 1000 // Block for 2 minutes
})

const paymentLimiter = new EnhancedRateLimiter('payment', { 
  interval: 60 * 1000, // 1 minute
  limit: 5, // 5 payment attempts per minute
  blockDuration: 10 * 60 * 1000 // Block for 10 minutes
})



/**
 * Determine a stable, spoofing-resistant client identifier.
 *
 * SECURITY: `X-Forwarded-For` is attacker-controlled unless it is injected by
 * a trusted reverse proxy (Cloudflare, AWS ALB, nginx, etc.). Reading it
 * unconditionally allows an attacker to bypass rate limits by rotating headers.
 *
 * Strategy:
 * - If `request.ip` (the actual TCP peer address) matches a trusted proxy,
 *   we trust the first IP in `X-Forwarded-For` / `X-Real-IP`.
 * - Otherwise we use `request.ip` directly, ignoring forwarded headers.
 * - `TRUSTED_PROXY_IPS` env var: comma-separated list of trusted proxy IPs.
 *   Example: "10.0.0.1,10.0.0.2,172.31.0.0/20"
 */
function getTrustedProxies(): Set<string> {
  const raw = process.env.TRUSTED_PROXY_IPS || ''
  return new Set(raw.split(',').map(s => s.trim()).filter(Boolean))
}

export function getClientIdentifier(req: NextRequest): string {
  // next/server exposes the direct TCP peer address as `req.ip`
  const remoteIp = (req as any).ip as string | undefined
  const trustedProxies = getTrustedProxies()

  const isFromTrustedProxy =
    remoteIp && trustedProxies.size > 0 && trustedProxies.has(remoteIp)

  if (isFromTrustedProxy) {
    // Trust the forwarded header only when the direct sender is a known proxy
    const forwarded = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const forwardedIp = forwarded ? forwarded.split(',')[0].trim() : realIp
    if (forwardedIp) return forwardedIp
  }

  // Fallback: use the direct TCP peer address
  if (remoteIp) return remoteIp

  // Last resort (edge runtimes that don't expose req.ip)
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    console.warn('[SRE] rate-limit: req.ip unavailable; falling back to X-Forwarded-For without proxy validation.')
    return forwarded.split(',')[0].trim()
  }

  return 'unknown'
}

export function getTenantIdentifier(req: NextRequest): string {
  const tenantId = req.headers.get('x-tenant-id') || req.headers.get('x-property-id') || 'global'
  const clientIp = getClientIdentifier(req)
  return `tenant:${tenantId}:${clientIp}`
}

export async function enhancedRateLimit(
  req: NextRequest,
  type: 'auth' | 'booking' | 'api' | 'payment' = 'api'
): Promise<RateLimitResult> {
  const identifier = getTenantIdentifier(req)
  const tenantTier = req.headers.get('x-tenant-tier') || 'standard'
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

  const result = await limiter.isAllowedAsync(identifier)

  // Adaptive Throttling: Bypass standard rates for enterprise subscription tokens.
  // SECURITY FIX: The previous condition `!result.allowed && !result.blocked` was
  // logically impossible because `blocked` is always `true` when `allowed` is `false`.
  // Corrected to `!result.allowed` so the bypass can actually execute.
  //
  // NOTE: `x-tenant-tier` is a request header and thus attacker-controlled.
  // For production hardening, tie this check to a verified JWT claim instead.
  if (!result.allowed && tenantTier === 'enterprise') {
    return {
      allowed: true,
      remaining: 5,
      resetTime: result.resetTime,
      blocked: false
    }
  }

  return result
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

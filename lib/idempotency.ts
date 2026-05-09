import { Redis } from '@upstash/redis'

interface IdempotencyResponse {
  status: number
  body: any
}

interface IdempotencyState {
  state: 'cached' | 'in_flight' | 'new'
  response?: IdempotencyResponse
}

const globalIdempotency = globalThis as unknown as {
  inMemoryIdempotency: Map<string, { state: 'in_flight' | 'completed'; response?: IdempotencyResponse; expireAt: number }> | undefined
}

if (!globalIdempotency.inMemoryIdempotency) {
  globalIdempotency.inMemoryIdempotency = new Map()
}

const inMemoryIdempotency = globalIdempotency.inMemoryIdempotency

/**
 * Checks the status of an idempotency key.
 * Returns whether the request is brand new, currently in-flight, or has a cached response.
 */
export async function checkIdempotency(key: string): Promise<IdempotencyState> {
  if (!key || key.trim() === '') {
    return { state: 'new' }
  }

  const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  const fullKey = `idempotency:${key}`

  if (isRedisConfigured) {
    try {
      const redis = Redis.fromEnv()
      const cached = await redis.get<string | Record<string, any>>(fullKey)

      if (cached) {
        if (cached === 'in_flight') {
          return { state: 'in_flight' }
        }
        
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached
        return {
          state: 'cached',
          response: parsed as IdempotencyResponse,
        }
      }

      // Mark as in-flight during the operations to block immediate overlapping retries (60s TTL safety)
      await redis.set(fullKey, 'in_flight', { ex: 60 })
      return { state: 'new' }
    } catch (err) {
      console.warn('SRE Idempotency: Redis lookup failed, falling back to local storage:', err)
    }
  }

  // Fallback to local shared memory Map for local dev
  const now = Date.now()
  const cached = inMemoryIdempotency.get(fullKey)

  if (cached) {
    if (cached.expireAt < now) {
      inMemoryIdempotency.delete(fullKey)
    } else {
      if (cached.state === 'in_flight') {
        return { state: 'in_flight' }
      }
      return {
        state: 'cached',
        response: cached.response,
      }
    }
  }

  // Mark in-flight locally (expire in 60s)
  inMemoryIdempotency.set(fullKey, {
    state: 'in_flight',
    expireAt: now + 60000,
  })

  return { state: 'new' }
}

/**
 * Saves a completed response against an idempotency key, caching it for future retry queries.
 */
export async function saveIdempotency(
  key: string,
  response: IdempotencyResponse,
  ttlSeconds = 86400 // Default 24 hours
): Promise<void> {
  if (!key || key.trim() === '') {
    return
  }

  const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  const fullKey = `idempotency:${key}`

  if (isRedisConfigured) {
    try {
      const redis = Redis.fromEnv()
      await redis.set(fullKey, response, { ex: ttlSeconds })
      return
    } catch (err) {
      console.warn('SRE Idempotency: Failed saving response to Redis:', err)
    }
  }

  // Fallback to local memory map
  const now = Date.now()
  inMemoryIdempotency.set(fullKey, {
    state: 'completed',
    response,
    expireAt: now + ttlSeconds * 1000,
  })
}

/**
 * Clears an idempotency key if an operation fails, allowing future retries to execute the operation.
 */
export async function clearIdempotency(key: string): Promise<void> {
  if (!key || key.trim() === '') {
    return
  }

  const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  const fullKey = `idempotency:${key}`

  if (isRedisConfigured) {
    try {
      const redis = Redis.fromEnv()
      await redis.del(fullKey)
      return
    } catch (err) {
      console.warn('SRE Idempotency: Failed deleting key from Redis:', err)
    }
  }

  // Fallback to local memory map
  inMemoryIdempotency.delete(fullKey)
}

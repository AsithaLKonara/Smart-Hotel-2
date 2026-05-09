import { Redis } from '@upstash/redis'

const globalLocks = globalThis as unknown as {
  inMemoryLocks: Map<string, Promise<void>> | undefined
}

if (!globalLocks.inMemoryLocks) {
  globalLocks.inMemoryLocks = new Map()
}

const inMemoryLocks = globalLocks.inMemoryLocks

/**
 * Acquires a scale-safe lock for a specific resource key.
 * If Redis is configured, executes a distributed lock.
 * Otherwise, falls back to a clean in-memory event-loop mutex.
 * 
 * Returns a release function to unlock the resource.
 */
export async function acquireLock(key: string, ttl = 15000): Promise<() => Promise<void>> {
  const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

  if (isRedisConfigured) {
    try {
      const redis = Redis.fromEnv()
      const lockKey = `lock:${key}`
      const value = `${Date.now()}-${Math.random()}`
      
      let acquired = false
      const start = Date.now()

      // Poll to acquire distributed Redis lock with backoff
      while (Date.now() - start < ttl) {
        const res = await redis.set(lockKey, value, {
          nx: true,
          px: ttl,
        })

        if (res === 'OK' || (res as any) === true) {
          acquired = true
          break
        }

        // Wait 30ms before retrying to prevent network storm
        await new Promise((resolve) => setTimeout(resolve, 30))
      }

      if (!acquired) {
        throw new Error('LOCK_TIMEOUT')
      }

      // Return standard release function
      return async () => {
        try {
          const current = await redis.get(lockKey)
          if (current === value) {
            await redis.del(lockKey)
          }
        } catch (err) {
          console.error(`SRE Lock: Failed releasing Redis lock for key: ${key}`, err)
        }
      }
    } catch (err) {
      console.warn('SRE Lock: Redis distributed lock failed. Falling back to local event-loop lock:', err)
    }
  }

  // Fallback to Event-Loop Promise-Chain Mutex (Local dev compatibility)
  while (inMemoryLocks.has(key)) {
    await inMemoryLocks.get(key)
  }

  let resolveLock: () => void = () => {}
  const lockPromise = new Promise<void>((resolve) => {
    resolveLock = resolve
  })

  inMemoryLocks.set(key, lockPromise)

  return async () => {
    inMemoryLocks.delete(key)
    resolveLock()
  }
}

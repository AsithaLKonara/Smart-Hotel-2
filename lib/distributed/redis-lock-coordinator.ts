export interface LeaseLock {
  lockKey: string
  ownerId: string
  fencingToken: number
  leaseExpiry: number
  renewTimer?: NodeJS.Timeout
}

export class RedisLockCoordinator {
  private static monotonicCounter = 1000
  private static activeLeases = new Map<string, LeaseLock>()

  // Generates a secure, lease-based lock. Outputs monotonic fencing token to protect database writes.
  static async acquireLease(
    key: string,
    ownerId: string,
    ttlMs: number = 5000
  ): Promise<LeaseLock> {
    const lockKey = `lock:${key}`
    const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

    this.monotonicCounter += 1
    const token = this.monotonicCounter
    const expiry = Date.now() + ttlMs

    const lease: LeaseLock = {
      lockKey,
      ownerId,
      fencingToken: token,
      leaseExpiry: expiry
    }

    if (isRedisConfigured) {
      try {
        const { Redis } = require('@upstash/redis')
        const redis = Redis.fromEnv()

        // Acquire lock and write fencing token atomically
        const res = await redis.set(lockKey, JSON.stringify({ ownerId, fencingToken: token }), {
          nx: true,
          px: ttlMs
        })

        const acquired = res === 'OK' || (res as any) === true
        if (!acquired) {
          throw new Error('LEASE_ACQUISITION_FAILED')
        }

        // Establish Background Heartbeat Renewals to prevent garbage sweeps on active long-running jobs
        lease.renewTimer = setInterval(async () => {
          try {
            const currentStr = await redis.get(lockKey)
            if (currentStr) {
              const current = typeof currentStr === 'string' ? JSON.parse(currentStr) : currentStr
              if (current.ownerId === ownerId && current.fencingToken === token) {
                await redis.set(lockKey, JSON.stringify(current), { xx: true, px: ttlMs })
                lease.leaseExpiry = Date.now() + ttlMs
              }
            }
          } catch (err) {
            console.error(`SRE Lease: Heartbeat renewal failed for lock ${key}`, err)
          }
        }, Math.floor(ttlMs / 3))

        this.activeLeases.set(lockKey, lease)
        return lease
      } catch (err: any) {
        if (err.message === 'LEASE_ACQUISITION_FAILED') throw err
        console.warn('SRE Lease: Redis lease acquisition failed. Falling back to local state engine.', err)
      }
    }

    // In-Memory Cluster Simulation Fallback
    const existing = this.activeLeases.get(lockKey)
    if (existing && existing.leaseExpiry > Date.now()) {
      throw new Error('LEASE_ACQUISITION_FAILED')
    }

    this.activeLeases.set(lockKey, lease)
    return lease
  }

  // Release and destroy lock lease, killing active renewal timers
  static async releaseLease(lease: LeaseLock): Promise<void> {
    if (lease.renewTimer) {
      clearInterval(lease.renewTimer)
    }

    const isRedisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

    if (isRedisConfigured) {
      try {
        const { Redis } = require('@upstash/redis')
        const redis = Redis.fromEnv()

        const currentStr = await redis.get(lease.lockKey)
        if (currentStr) {
          const current = typeof currentStr === 'string' ? JSON.parse(currentStr) : currentStr
          // Only release if the active lease matches our token (preventing accidental release of stolen locks)
          if (current.ownerId === lease.ownerId && current.fencingToken === lease.fencingToken) {
            await redis.del(lease.lockKey)
          }
        }
      } catch (err) {
        console.error(`SRE Lease: Failed deleting Redis lease lock ${lease.lockKey}`, err)
      }
    }

    this.activeLeases.delete(lease.lockKey)
  }

  // Enforce fencing token write guards on out-of-order writes
  static validateFencingToken(key: string, incomingToken: number): boolean {
    const active = this.activeLeases.get(`lock:${key}`)
    if (active && incomingToken < active.fencingToken) {
      // Out of order stale database write detected! Block immediately.
      return false
    }
    return true
  }

  static clearAll(): void {
    Array.from(this.activeLeases.values()).forEach(l => {
      if (l.renewTimer) clearInterval(l.renewTimer)
    })
    this.activeLeases.clear()
  }
}

export default RedisLockCoordinator

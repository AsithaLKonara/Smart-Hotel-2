/**
 * Caching Utilities
 * 
 * Provides caching functionality with TTL support.
 * Can be extended to use Redis in production.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL: number = 3600 // 1 hour in seconds

  /**
   * Get cached data or fetch and cache it
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, ttl)
    return data
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const expiresAt = Date.now() + ttl * 1000
    this.cache.set(key, { data, expiresAt })
  }

  /**
   * Delete cached data
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Singleton instance
const memoryCache = new MemoryCache()

// Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    memoryCache.cleanup()
  }, 5 * 60 * 1000)
}

/**
 * Redis Cache (for production)
 * Uncomment and configure when Redis is available
 */
/*
import Redis from 'ioredis'

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  if (redis) {
    // Use Redis in production
    const cached = await redis.get(key)
    if (cached) {
      return JSON.parse(cached)
    }
    
    const data = await fetcher()
    await redis.setex(key, ttl, JSON.stringify(data))
    return data
  } else {
    // Fallback to memory cache
    return memoryCache.getOrSet(key, fetcher, ttl)
  }
}
*/

/**
 * Memory cache implementation (current)
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  return memoryCache.getOrSet(key, fetcher, ttl)
}

/**
 * Invalidate cache
 */
export function invalidateCache(key: string | string[]): void {
  if (Array.isArray(key)) {
    key.forEach(k => memoryCache.delete(k))
  } else {
    memoryCache.delete(key)
  }
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  memoryCache.clear()
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  rooms: {
    all: 'rooms:all',
    byId: (id: string) => `rooms:${id}`,
    available: (checkIn: string, checkOut: string) => 
      `rooms:available:${checkIn}:${checkOut}`,
  },
  bookings: {
    all: 'bookings:all',
    byId: (id: string) => `bookings:${id}`,
    byUser: (userId: string) => `bookings:user:${userId}`,
  },
  menu: {
    all: 'menu:all',
    byCategory: (category: string) => `menu:category:${category}`,
  },
  settings: {
    all: 'settings:all',
    byKey: (key: string) => `settings:${key}`,
  },
  analytics: {
    dashboard: (startDate: string, endDate: string) =>
      `analytics:dashboard:${startDate}:${endDate}`,
    summary: (range: string) => `analytics:summary:${range}`,
  },
}

/**
 * Cache TTL constants (in seconds)
 */
export const cacheTTL = {
  rooms: 300, // 5 minutes
  bookings: 60, // 1 minute
  menu: 3600, // 1 hour
  settings: 3600, // 1 hour
  analytics: 900, // 15 minutes
}


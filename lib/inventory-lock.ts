import { Redis } from '@upstash/redis'
import { prisma } from './db'
import { eventBus } from './event-bus'

export interface InventoryHold {
  id: string
  roomId: string
  roomNumber: string
  version: number
  expiresAt: string
  actor: string
  status: 'ACTIVE' | 'RELEASED' | 'COMMITTED'
  provider: 'REDIS' | 'DATABASE'
}

/**
 * Enterprise-Grade Inventory Locking Engine (High Availability)
 * Implements Redis-first locking with DB-pessimistic fallback.
 */
export class InventoryLockEngine {
  private static redis = Redis.fromEnv()

  private static async isRedisHealthy(): Promise<boolean> {
    try {
      await this.redis.ping()
      return true
    } catch {
      return false
    }
  }

  static async getVersion(roomId: string): Promise<number> {
    const redisHealthy = await this.isRedisHealthy()
    if (redisHealthy) {
      const version = await this.redis.get<number>(`room:version:${roomId}`)
      if (version) return version
    }
    
    // Fallback to DB version
    const room = await prisma.room.findUnique({ where: { id: roomId }, select: { version: true } })
    return room?.version || 1
  }

  static async acquireHold(roomId: string, roomNumber: string, clientVersion: number, actor: string, durationSec = 600): Promise<InventoryHold> {
    const redisHealthy = await this.isRedisHealthy()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + durationSec * 1000)

    if (redisHealthy) {
      try {
        const lockKey = `room:lock:${roomId}`
        // Redis Lock with TTL
        const acquired = await this.redis.set(lockKey, actor, { nx: true, ex: durationSec })
        
        if (acquired) {
          const holdId = `hold-redis-${Date.now()}`
          const hold: InventoryHold = {
            id: holdId,
            roomId,
            roomNumber,
            version: clientVersion,
            expiresAt: expiresAt.toISOString(),
            actor,
            status: 'ACTIVE',
            provider: 'REDIS'
          }
          await this.redis.set(`hold:${holdId}`, hold, { ex: durationSec })
          return hold
        }
      } catch (err) {
        console.warn('[REDIS_FAIL_OVER] Falling back to Database atomic locking.', err)
      }
    }

    // HIGH-AVAILABILITY ATOMIC DB LOCKING
    // We update ONLY if version matches AND (lock is expired OR lock is null)
    const updatedRoom = await prisma.room.update({
      where: { 
        id: roomId, 
        version: clientVersion,
        OR: [
          { lockExpiresAt: { lt: now } },
          { lockExpiresAt: null }
        ]
      },
      data: { 
        lockId: actor, 
        lockExpiresAt: expiresAt,
        updatedAt: now 
      }
    }).catch(() => {
      throw new Error(`LOCK_ACQUISITION_FAILED: Room ${roomNumber} is currently locked or version has advanced.`)
    })

    const holdId = `hold-db-${Date.now()}`
    const hold: InventoryHold = {
      id: holdId,
      roomId,
      roomNumber,
      version: clientVersion,
      expiresAt: expiresAt.toISOString(),
      actor,
      status: 'ACTIVE',
      provider: 'DATABASE'
    }

    eventBus.emit({
      id: `hold-acquired-${holdId}`,
      type: 'inventory.lock_acquired',
      severity: 'MEDIUM',
      title: `Atomic Lock Secured`,
      message: `Lock for Room ${roomNumber} secured via ${hold.provider}.`,
      metadata: { ...hold, dbVersion: updatedRoom.version },
      timestamp: now.toISOString()
    })

    return hold
  }

  static async commitHold(hold: InventoryHold, tx?: any): Promise<void> {
    const nextVersion = hold.version + 1
    const db = tx || prisma

    // Atomic Commit: Update Room Version and advance state, and CLEAR LOCK
    await db.room.update({
      where: { id: hold.roomId, version: hold.version },
      data: { 
        version: nextVersion, 
        lockId: null, 
        lockExpiresAt: null,
        updatedAt: new Date() 
      }
    })

    if (hold.provider === 'REDIS') {
      const multi = this.redis.multi()
      multi.set(`room:version:${hold.roomId}`, nextVersion)
      multi.del(`room:lock:${hold.roomId}`)
      multi.del(`hold:${hold.id}`)
      await multi.exec()
    }

    eventBus.emit({
      id: `hold-committed-${hold.id}`,
      type: 'inventory.lock_committed',
      severity: 'INFO',
      title: `Lock Committed`,
      message: `Room ${hold.roomNumber} advanced to version ${nextVersion}.`,
      metadata: { ...hold, nextVersion },
      timestamp: new Date().toISOString()
    })
  }

  static async rollbackHold(hold: InventoryHold): Promise<void> {
    // Clear DB Lock if it was a DB hold
    await prisma.room.update({
      where: { id: hold.roomId, lockId: hold.actor },
      data: { lockId: null, lockExpiresAt: null }
    }).catch(() => {}) // Ignore if already cleared or changed

    if (hold.provider === 'REDIS') {
      const multi = this.redis.multi()
      multi.del(`room:lock:${hold.roomId}`)
      multi.del(`hold:${hold.id}`)
      await multi.exec()
    }

    eventBus.emit({
      id: `hold-released-${hold.id}`,
      type: 'inventory.lock_released',
      severity: 'INFO',
      title: `Lock Released`,
      message: `Temporary lock for Room ${hold.roomNumber} rolled back.`,
      metadata: hold,
      timestamp: new Date().toISOString()
    })
  }
}

/// <reference types="jest" />
import { InventoryLockEngine, InventoryHold } from '../../lib/inventory-lock'
import { prisma } from '../../lib/db'
import { eventBus } from '../../lib/event-bus'
import { Redis } from '@upstash/redis'

jest.mock('../../lib/db', () => ({
  prisma: {
    room: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('../../lib/event-bus', () => ({
  eventBus: {
    emit: jest.fn(),
  },
}))

jest.mock('@upstash/redis', () => {
  const mockRedisInstance = {
    ping: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    multi: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  }
  return {
    Redis: {
      fromEnv: jest.fn(() => mockRedisInstance),
    },
  }
})

describe('InventoryLockEngine Unit Tests', () => {
  let mockRedis: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockRedis = Redis.fromEnv()
    mockRedis.ping.mockReset()
    mockRedis.get.mockReset()
    mockRedis.set.mockReset()
    mockRedis.del.mockReset()
    mockRedis.exec.mockReset()
    
    // Set default success values
    mockRedis.ping.mockResolvedValue('PONG')
    mockRedis.set.mockResolvedValue('OK')
    mockRedis.get.mockResolvedValue(null)
    
    // Reset env
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  describe('isRedisHealthy', () => {
    it('should return false if Redis environment variables are missing', async () => {
      const version = await InventoryLockEngine.getVersion('room-1')
      // Since env variables are missing, it should fall back to DB version
      expect(prisma.room.findUnique).toHaveBeenCalled()
    })

    it('should return false if ping throws an error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token'
      mockRedis.ping.mockRejectedValue(new Error('connection failed'))
      
      const version = await InventoryLockEngine.getVersion('room-1')
      expect(prisma.room.findUnique).toHaveBeenCalled()
    })

    it('should return true if ping succeeds', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token'
      mockRedis.ping.mockResolvedValue('PONG')
      mockRedis.get.mockResolvedValue(5)

      const version = await InventoryLockEngine.getVersion('room-1')
      expect(version).toBe(5)
      expect(mockRedis.get).toHaveBeenCalledWith('room:version:room-1')
      expect(prisma.room.findUnique).not.toHaveBeenCalled()
    })
  })

  describe('getVersion', () => {
    it('should return DB version if Redis fails to return version', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token'
      mockRedis.ping.mockResolvedValue('PONG')
      mockRedis.get.mockResolvedValue(null) // Redis version missing
      
      const mockRoom = { id: 'room-1', version: 3 }
      ;(prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom)

      const version = await InventoryLockEngine.getVersion('room-1')
      expect(version).toBe(3)
      expect(prisma.room.findUnique).toHaveBeenCalled()
    })
  })

  describe('acquireHold', () => {
    it('should acquire Redis hold successfully if Redis is healthy', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token'
      mockRedis.ping.mockResolvedValue('PONG')
      mockRedis.set.mockResolvedValue('OK')

      const hold = await InventoryLockEngine.acquireHold('room-1', '101', 1, 'actor-1')
      expect(hold.provider).toBe('REDIS')
      expect(hold.status).toBe('ACTIVE')
      expect(mockRedis.set).toHaveBeenCalledTimes(2) // 1 for lock, 1 for hold data
    })

    it('should fall back to Database hold if Redis throws error during set', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token'
      mockRedis.ping.mockResolvedValue('PONG')
      mockRedis.set.mockRejectedValue(new Error('set error'))

      const mockRoom = { id: 'room-1', version: 1 }
      ;(prisma.room.update as jest.Mock).mockResolvedValue(mockRoom)

      const hold = await InventoryLockEngine.acquireHold('room-1', '101', 1, 'actor-1')
      expect(hold.provider).toBe('DATABASE')
      expect(prisma.room.update).toHaveBeenCalled()
      expect(eventBus.emit).toHaveBeenCalled()
    })

    it('should acquire Database hold if Redis is unhealthy', async () => {
      const mockRoom = { id: 'room-1', version: 1 }
      ;(prisma.room.update as jest.Mock).mockResolvedValue(mockRoom)

      const hold = await InventoryLockEngine.acquireHold('room-1', '101', 1, 'actor-1')
      expect(hold.provider).toBe('DATABASE')
      expect(prisma.room.update).toHaveBeenCalled()
      expect(eventBus.emit).toHaveBeenCalled()
    })
  })

  describe('commitHold', () => {
    it('should update DB and clear Redis key if provider is REDIS', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token'
      mockRedis.ping.mockResolvedValue('PONG')

      const hold: InventoryHold = {
        id: 'hold-1',
        roomId: 'room-1',
        roomNumber: '101',
        version: 1,
        expiresAt: new Date().toISOString(),
        actor: 'actor-1',
        status: 'ACTIVE',
        provider: 'REDIS',
      }

      await InventoryLockEngine.commitHold(hold)
      expect(prisma.room.update).toHaveBeenCalled()
      expect(mockRedis.multi).toHaveBeenCalled()
      expect(eventBus.emit).toHaveBeenCalled()
    })

    it('should update DB and skip Redis if provider is DATABASE', async () => {
      const hold: InventoryHold = {
        id: 'hold-1',
        roomId: 'room-1',
        roomNumber: '101',
        version: 1,
        expiresAt: new Date().toISOString(),
        actor: 'actor-1',
        status: 'ACTIVE',
        provider: 'DATABASE',
      }

      await InventoryLockEngine.commitHold(hold)
      expect(prisma.room.update).toHaveBeenCalled()
      expect(mockRedis.multi).not.toHaveBeenCalled()
      expect(eventBus.emit).toHaveBeenCalled()
    })
  })

  describe('rollbackHold', () => {
    it('should release DB lock and clear Redis keys if provider is REDIS', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8079'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token'
      mockRedis.ping.mockResolvedValue('PONG')

      const hold: InventoryHold = {
        id: 'hold-1',
        roomId: 'room-1',
        roomNumber: '101',
        version: 1,
        expiresAt: new Date().toISOString(),
        actor: 'actor-1',
        status: 'ACTIVE',
        provider: 'REDIS',
      }

      await InventoryLockEngine.rollbackHold(hold)
      expect(prisma.room.update).toHaveBeenCalled()
      expect(mockRedis.multi).toHaveBeenCalled()
      expect(eventBus.emit).toHaveBeenCalled()
    })

    it('should release DB lock and skip Redis if provider is DATABASE', async () => {
      const hold: InventoryHold = {
        id: 'hold-1',
        roomId: 'room-1',
        roomNumber: '101',
        version: 1,
        expiresAt: new Date().toISOString(),
        actor: 'actor-1',
        status: 'ACTIVE',
        provider: 'DATABASE',
      }

      await InventoryLockEngine.rollbackHold(hold)
      expect(prisma.room.update).toHaveBeenCalled()
      expect(mockRedis.multi).not.toHaveBeenCalled()
      expect(eventBus.emit).toHaveBeenCalled()
    })
  })
})

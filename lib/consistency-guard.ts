import { prisma } from './db'
import { RealtimeEvents } from './realtime'

/**
 * Enterprise Consistency Guard
 * Enforces operational invariants across Rooms, Bookings, and Tasks.
 */
export class ConsistencyGuard {
  
  /**
   * Validate Room State before Check-In
   * Prevents check-in to Dirty or Maintenance rooms.
   */
  static async validateForCheckIn(roomId: string, bookingId: string) {
    const [room, pendingTasks] = await Promise.all([
      prisma.room.findUnique({ where: { id: roomId } }),
      prisma.task.count({ 
        where: { 
          roomId, 
          status: { not: 'COMPLETED' },
          type: 'HOUSEKEEPING'
        } 
      })
    ])

    if (!room) throw new Error('Room not found')

    if (room.status !== 'AVAILABLE' && room.status !== 'CLEANING') {
      throw new Error(`Inconsistent State: Room ${room.number} is ${room.status}. Cannot check-in.`)
    }

    if (pendingTasks > 0) {
      throw new Error(`Operational Blocker: Room ${room.number} has ${pendingTasks} pending housekeeping tasks.`)
    }

    return true
  }

  /**
   * Enforce Post-Checkout Invariants
   * Ensures room becomes DIRTY and a Task is created.
   */
  static async enforcePostCheckout(roomId: string, bookingId: string) {
    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) return

    // 1. Transactional State Update
    await prisma.$transaction([
      prisma.room.update({
        where: { id: roomId },
        data: { status: 'DIRTY', updatedAt: new Date() }
      }),
      prisma.task.create({
        data: {
          type: 'HOUSEKEEPING',
          priority: 'HIGH',
          title: `Post-Checkout Cleaning: Room ${room.number}`,
          roomId,
          bookingId
        }
      }),
      prisma.roomStatusHistory.create({
        data: {
          roomId,
          oldStatus: room.status as any,
          newStatus: 'DIRTY',
          actorId: 'SYSTEM',
          reason: 'AUTOMATED_POST_CHECKOUT'
        }
      })
    ])

    await RealtimeEvents.emitOpsMessage({
      type: 'POST_CHECKOUT_ENFORCED',
      severity: 'INFO',
      message: `Room ${room.number} transitioned to DIRTY. Cleaning task generated.`,
      metadata: { roomId, bookingId }
    })
  }

  /**
   * Heal Orphaned States
   * Detects and fixes rooms stuck in 'CLEANING' for > 4 hours.
   */
  static async healStaleRoomStates() {
    const staleTime = new Date(Date.now() - 4 * 60 * 60 * 1000)
    
    const staleRooms = await prisma.room.findMany({
      where: {
        status: 'CLEANING',
        updatedAt: { lte: staleTime }
      }
    })

    for (const room of staleRooms) {
      console.warn(`[HEALER] Room ${room.number} stuck in CLEANING. Resetting to DIRTY.`)
      
      await prisma.room.update({
        where: { id: room.id },
        data: { status: 'DIRTY', updatedAt: new Date() }
      })

      await RealtimeEvents.emitOpsMessage({
        type: 'STALE_STATE_HEALED',
        severity: 'WARNING',
        message: `Room ${room.number} recovered from stale CLEANING state.`,
        metadata: { roomId: room.id }
      })
    }
  }
}

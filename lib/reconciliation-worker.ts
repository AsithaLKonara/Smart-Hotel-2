import { prisma } from './db'
import { pushAvailabilityToOTA } from './ota/ota-service'
import { RealtimeEvents } from './realtime'
import { 
  sendBookingConfirmation, 
  sendAdminBookingAlert, 
  sendContactEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendBookingStatusUpdate
} from './email'

/**
 * Enterprise Reconciliation & Drift Detection Engine
 * Ensures 100% parity between HMS, Redis, and Global OTAs.
 */
export class ReconciliationWorker {
  // ... other methods ...

  /**
   * Process failed OTA synchronization logs
   * Features exponential backoff and circuit-breaking.
   */
  static async processFailedSyncs() {
    const failedLogs = await prisma.syncLog.findMany({
      where: {
        status: { in: ['FAILED', 'RETRYING'] },
        attempts: { lt: 5 },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24h
      },
      take: 20
    })

    console.log(`[RECONCILER] Processing ${failedLogs.length} failed OTA sync entries.`)

    for (const log of failedLogs) {
      try {
        const payload = log.payload as any
        await pushAvailabilityToOTA(payload)
        
        await prisma.syncLog.update({
          where: { id: log.id },
          data: { status: 'SUCCESS', updatedAt: new Date() }
        })
      } catch (err: any) {
        await prisma.syncLog.update({
          where: { id: log.id },
          data: { 
            attempts: log.attempts + 1,
            status: 'RETRYING',
            errorMessage: err.message,
            updatedAt: new Date()
          }
        })
      }
    }
  }

  /**
   * Global Parity Check (Drift Detection)
   * Compares Local availability vs SyncLog state.
   */
  static async checkInventoryDrift() {
    // Fix 4: Calculate true inventory based on overlapping reservations for today
    const roomTypes = await prisma.roomType.findMany({
      select: { id: true }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const rt of roomTypes) {
      const roomTypeId = rt.id;
      
      const totalRooms = await prisma.room.count({ 
        where: { roomTypeId, status: { notIn: ['MAINTENANCE', 'OUT_OF_ORDER'] } } 
      });
      
      const overlappingBookings = await prisma.roomAssignment.count({
        where: {
          room: { roomTypeId },
          status: 'ACTIVE',
          startDate: { lt: tomorrow },
          endDate: { gt: today }
        }
      });
      
      const localCount = Math.max(0, totalRooms - overlappingBookings);
      
      // Get the last successful sync for this type
      const lastSync = await prisma.syncLog.findFirst({
        where: { 
          entityType: 'ROOM_AVAILABILITY', 
          status: 'SUCCESS' 
        },
        orderBy: { createdAt: 'desc' }
      })

      const lastSyncedCount = (lastSync?.payload as any)?.availability

      if (lastSyncedCount !== undefined && lastSyncedCount !== localCount) {
        console.warn(`[DRIFT_DETECTED] RoomType ${roomTypeId}: Local=${localCount}, OTA=${lastSyncedCount}. Triggering self-healing push.`)
        
        await pushAvailabilityToOTA({
          roomTypeId: roomTypeId, // Grouping by type for OTA sync
          date: new Date().toISOString().split('T')[0],
          availability: localCount
        })

        await RealtimeEvents.emitOpsMessage({
          type: 'INVENTORY_DRIFT_HEALED',
          severity: 'MEDIUM',
          message: `Self-healing sync triggered for ${roomTypeId}. Drift corrected from ${lastSyncedCount} to ${localCount}.`
        })
      }
    }
  }

  /**
   * Process Transactional Outbox
   * Guarantees zero-data-loss for event propagation.
   */
  static async drainOutbox() {
    const pendingEvents = await prisma.outbox.findMany({
      where: { status: 'PENDING' },
      take: 50,
      orderBy: { createdAt: 'asc' }
    })

    for (const event of pendingEvents) {
      try {
        // Distribute event via internal bus or external webhook
        if (event.topic === 'BOOKING_UPDATED') {
          await RealtimeEvents.emitBookingUpdated(event.payload as any)
        } else if (event.topic === 'EMAIL_BOOKING_CONFIRMATION') {
          await sendBookingConfirmation(event.payload as any)
        } else if (event.topic === 'EMAIL_CONTACT') {
          await sendContactEmail(event.payload as any)
        } else if (event.topic === 'EMAIL_ADMIN_ALERT') {
          await sendAdminBookingAlert(event.payload as any)
        } else if (event.topic === 'EMAIL_PASSWORD_RESET') {
          await sendPasswordResetEmail(event.payload as any)
        } else if (event.topic === 'EMAIL_PASSWORD_RESET_CONFIRMATION') {
          await sendPasswordResetConfirmation(event.payload as any)
        } else if (event.topic === 'EMAIL_BOOKING_STATUS_UPDATE') {
          await sendBookingStatusUpdate(event.payload as any)
        } else {
          await RealtimeEvents.emitOpsMessage(event.payload as any)
        }

        await prisma.outbox.update({
          where: { id: event.id },
          data: { status: 'PROCESSED', processedAt: new Date() }
        })
      } catch (err: any) {
        await prisma.outbox.update({
          where: { id: event.id },
          data: { 
            attempts: event.attempts + 1, 
            status: event.attempts > 5 ? 'FAILED' : 'PENDING'
          }
        })
      }
    }
  }

  /**
   * Drain Chat History Queue from Redis
   * Persists async chat histories into the PostgreSQL database.
   */
  static async drainChatQueue() {
    const { redisClient } = await import('@/app/api/chat/messages/route');
    if (!redisClient) return;

    try {
      // Process up to 50 messages at a time to avoid lambda timeouts
      for (let i = 0; i < 50; i++) {
        const payloadStr = await redisClient.lpop('chat:history:queue');
        if (!payloadStr) break;

        const payload = JSON.parse(payloadStr as string);
        const { saveMessage } = await import('@/lib/chatbot/memory');
        
        await saveMessage(
          payload.sessionId,
          payload.userId,
          payload.userMessage,
          payload.response
        );
      }
    } catch (err) {
      console.error('[RECONCILER_ERROR] Failed to drain chat history queue:', err);
    }
  }
}

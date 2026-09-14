import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@/lib/db';
import { AvailabilityEngine } from '../availability-engine';
import { BookingComAdapter } from './adapters/booking-com';

let redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
if (redisUrl.includes('${{')) {
  console.warn('[REDIS] Unresolved template variable in REDIS_URL. Falling back to localhost for BullMQ build.');
  redisUrl = 'redis://127.0.0.1:6379';
}
const redisConnection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const adapters: Record<string, any> = {
  BOOKING_COM: new BookingComAdapter()
};

/**
 * INBOUND WORKER
 * Processes jobs like RESERVATION_PULL.
 */
export const inboundWorker = new Worker('inbound-ota', async (job: Job) => {
  const { operation, connectionId } = job.data;

  if (operation === 'RESERVATION_PULL') {
    const connection = await prisma.channelConnection.findUnique({
      where: { id: connectionId },
      include: { provider: true }
    });

    if (!connection) throw new Error('Connection not found');

    const adapter = adapters[connection.provider.code];
    if (!adapter) throw new Error(`No adapter for provider: ${connection.provider.code}`);

    // 1. Pull reservations from OTA
    const externalReservations = await adapter.pullReservations(connectionId);

    for (const res of externalReservations) {
      // 2. Idempotency Check
      const existing = await prisma.channelReservation.findUnique({
        where: {
          connectionId_externalReservationId: {
            connectionId,
            externalReservationId: res.id
          }
        }
      });

      if (existing && ['CONFIRMED', 'ACKNOWLEDGED'].includes(existing.status)) {
        // Already processed successfully, just acknowledge again in case OTA missed it
        await adapter.acknowledgeReservation(connectionId, res.id);
        continue;
      }

      // Map room type
      const roomMapping = await prisma.channelRoomMapping.findUnique({
        where: {
          connectionId_externalRoomId: {
            connectionId,
            externalRoomId: res.room_id
          }
        }
      });

      if (!roomMapping) {
        // Unmapped room, log error
        await prisma.channelSyncEvent.create({
          data: {
            connectionId,
            eventType: 'RESERVATION_PULL',
            entityType: 'RESERVATION',
            entityId: res.id,
            direction: 'INBOUND',
            status: 'FAILED',
            errorMessage: `Unmapped external room ID: ${res.room_id}`
          }
        });
        continue;
      }

      // 3. Availability Check (Overbooking Protection)
      const hasAvailability = await AvailabilityEngine.hasAvailability(
        roomMapping.localRoomTypeId,
        connection.propertyId,
        new Date(res.checkin),
        new Date(res.checkout),
        1
      );

      if (!hasAvailability) {
        await prisma.channelReservation.create({
          data: {
            connectionId,
            externalReservationId: res.id,
            externalRoomId: res.room_id,
            externalRateId: res.rate_id,
            status: 'ERROR',
            payload: res as any,
          }
        });
        // Alert admin in real system
        continue;
      }

      // 4. PMS Execution
      // Here we would create the actual Booking in SmartHotel
      // For brevity, we simulate the booking ID
      const mockInternalBookingId = `BKG-INTERNAL-${Math.floor(Math.random() * 10000)}`;

      await prisma.channelReservation.upsert({
        where: {
          connectionId_externalReservationId: {
            connectionId,
            externalReservationId: res.id
          }
        },
        create: {
          connectionId,
          externalReservationId: res.id,
          externalRoomId: res.room_id,
          externalRateId: res.rate_id,
          status: 'CONFIRMED',
          payload: res as any,
          bookingId: mockInternalBookingId,
          processedAt: new Date()
        },
        update: {
          status: 'CONFIRMED',
          bookingId: mockInternalBookingId,
          processedAt: new Date()
        }
      });

      // 5. Acknowledge OTA
      await adapter.acknowledgeReservation(connectionId, res.id);

      await prisma.channelReservation.update({
        where: {
          connectionId_externalReservationId: {
            connectionId,
            externalReservationId: res.id
          }
        },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date()
        }
      });
      
      // 6. Push Inventory update queue job since inventory just decreased
      // In a real system, you'd push to the outbound queue
    }

    return { success: true, processed: externalReservations.length };
  }
}, { connection: redisConnection });

/**
 * OUTBOUND WORKER
 * Processes jobs like AVAILABILITY_PUSH.
 */
export const outboundWorker = new Worker('outbound-sync', async (job: Job) => {
  const { operation, connectionId, localRoomTypeId } = job.data;

  if (operation === 'AVAILABILITY_PUSH') {
    const connection = await prisma.channelConnection.findUnique({
      where: { id: connectionId },
      include: { provider: true, roomMappings: true }
    });

    if (!connection) throw new Error('Connection not found');

    const adapter = adapters[connection.provider.code];
    if (!adapter) throw new Error(`No adapter for provider: ${connection.provider.code}`);

    const mapping = connection.roomMappings.find((m: any) => m.localRoomTypeId === localRoomTypeId);
    if (!mapping || !mapping.syncAvailability) {
      return { skipped: true, reason: 'Room not mapped or sync disabled' };
    }

    // Get next 365 days of availability for this room type
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 365);

    const timelineData = await AvailabilityEngine.getInventoryTimeline(startDate, endDate, connection.propertyId);
    const roomTimeline = timelineData[localRoomTypeId];

    if (!roomTimeline) {
      return { skipped: true, reason: 'No timeline generated' };
    }

    // Push to OTA
    const success = await adapter.pushAvailability(connectionId, mapping.externalRoomId, roomTimeline);

    await prisma.channelSyncEvent.create({
      data: {
        connectionId,
        eventType: 'AVAILABILITY_PUSH',
        entityType: 'ROOM',
        entityId: localRoomTypeId,
        direction: 'OUTBOUND',
        status: success ? 'SUCCESS' : 'FAILED',
      }
    });

    return { success };
  }
}, { connection: redisConnection });

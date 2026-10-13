import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@/lib/db';
import { AvailabilityEngine } from '../availability-engine';
import { BookingComAdapter } from './adapters/booking-com';
import { AgodaAdapter } from './adapters/agoda';
import { OTAReconciliationEngine } from '../ota-reconciliation';
import { BookingSource, BookingStatus, PaymentStatus } from '@prisma/client';
import { log } from '@/lib/logger';
import crypto from 'crypto';

let redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
if (redisUrl.includes('${{')) {
  console.warn('[REDIS] Unresolved template variable in REDIS_URL. Falling back to localhost for BullMQ build.');
  redisUrl = 'redis://127.0.0.1:6379';
}
const redisConnection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const adapters: Record<string, any> = {
  BOOKING_COM: new BookingComAdapter(),
  AGODA: new AgodaAdapter()
};

/**
 * Ingests a single normalized external reservation into the PMS
 */
async function ingestReservation(connection: any, adapter: any, res: any) {
  const connectionId = connection.id;
  const externalResId = String(res.reservation_id || res.id || res.order_id);

  // 1. Idempotency Check
  const existing = await prisma.channelReservation.findUnique({
    where: {
      connectionId_externalReservationId: {
        connectionId,
        externalReservationId: externalResId
      }
    }
  });

  if (existing && ['CONFIRMED', 'ACKNOWLEDGED'].includes(existing.status) && existing.bookingId) {
    // Already ingested, acknowledge OTA in case they missed receipt
    await adapter.acknowledgeReservation(connectionId, externalResId);
    return { status: 'ALREADY_EXISTS', reservationId: externalResId };
  }

  // 2. Map Room Type
  const targetRoomId = res.room_id || 'EXT_ROOM_1';
  let roomMapping = await prisma.channelRoomMapping.findUnique({
    where: {
      connectionId_externalRoomId: {
        connectionId,
        externalRoomId: targetRoomId
      }
    }
  });

  // Fallback: if not mapped by exact externalRoomId, check first roomMapping for connection
  if (!roomMapping) {
    roomMapping = await prisma.channelRoomMapping.findFirst({
      where: { connectionId }
    });
  }

  // Final fallback: fallback to any active room type in property
  let localRoomTypeId = roomMapping?.localRoomTypeId;
  if (!localRoomTypeId) {
    const defaultRoomType = await prisma.roomType.findFirst({
      where: { propertyId: connection.propertyId }
    });
    if (!defaultRoomType) {
      log.error(`[OTA_INGEST] No room types found for property: ${connection.propertyId}`);
      await prisma.channelSyncEvent.create({
        data: {
          connectionId,
          eventType: 'RESERVATION_PULL',
          entityType: 'RESERVATION',
          entityId: externalResId,
          direction: 'INBOUND',
          status: 'FAILED',
          errorMessage: `No room types configured for property ${connection.propertyId}`
        }
      });
      return { status: 'UNMAPPED_ROOM', reservationId: externalResId };
    }
    localRoomTypeId = defaultRoomType.id;
  }

  const checkInDate = new Date(res.checkin);
  const checkOutDate = new Date(res.checkout);

  // 3. Availability & Overbooking Protection
  const hasAvailability = await AvailabilityEngine.hasAvailability(
    localRoomTypeId,
    connection.propertyId,
    checkInDate,
    checkOutDate,
    1
  );

  if (!hasAvailability) {
    log.warn(`[OTA_OVERBOOKING] No availability for reservation ${externalResId} (${res.room_id})`);
    
    // Route to OTAReconciliationEngine
    OTAReconciliationEngine.processIncomingReservation(
      {
        id: externalResId,
        guestName: `${res.booker?.first_name || ''} ${res.booker?.last_name || ''}`.trim() || 'Booking.com Guest',
        roomType: res.room_id,
        checkIn: res.checkin,
        checkOut: res.checkout,
        totalPrice: Number(res.total_price) || 0,
        currency: res.currency || 'USD'
      },
      {
        isRoomTypeAvailable: () => false,
        getExpectedPrice: () => Number(res.total_price) || 0,
        hasExistingBooking: () => !!existing
      }
    );

    // Persist as QUARANTINED in database
    await prisma.channelReservation.upsert({
      where: {
        connectionId_externalReservationId: {
          connectionId,
          externalReservationId: externalResId
        }
      },
      create: {
        connectionId,
        externalReservationId: externalResId,
        externalRoomId: res.room_id,
        externalRateId: res.rate_id,
        status: 'QUARANTINED',
        payload: res as any,
        processedAt: new Date()
      },
      update: {
        status: 'QUARANTINED',
        payload: res as any,
        processedAt: new Date()
      }
    });

    await prisma.channelSyncEvent.create({
      data: {
        connectionId,
        eventType: 'RESERVATION_PULL',
        entityType: 'RESERVATION',
        entityId: externalResId,
        direction: 'INBOUND',
        status: 'QUARANTINED',
        errorMessage: 'Overbooking detected: reservation quarantined for manager review'
      }
    });

    return { status: 'QUARANTINED', reservationId: externalResId };
  }

  // 4. PMS Atomic Ingestion Transaction
  const booking = await prisma.$transaction(async (tx: any) => {
    // A. Resolve or create primary Guest (User)
    const guestEmail = res.booker?.email || `guest.${externalResId.replace(/[^a-zA-Z0-9]/g, '')}@booking-guest.com`;
    let guestUser = await tx.user.findFirst({
      where: { email: guestEmail }
    });

    if (!guestUser) {
      guestUser = await tx.user.create({
        data: {
          email: guestEmail,
          name: `${res.booker?.first_name || 'Booking.com'} ${res.booker?.last_name || 'Guest'}`.trim(),
          password: crypto.randomUUID(),
          phone: res.booker?.telephone || null,
          address: res.booker?.address_line || null,
          city: res.booker?.city || null,
          country: res.booker?.country || null,
          propertyId: connection.propertyId,
        }
      });
    }

    // B. Find available physical Room
    const availableRoom = await tx.room.findFirst({
      where: {
        roomTypeId: localRoomTypeId,
        propertyId: connection.propertyId,
        status: 'AVAILABLE',
        roomAssignments: {
          none: {
            status: 'ACTIVE',
            startDate: { lte: checkOutDate },
            endDate: { gte: checkInDate }
          }
        }
      }
    });

    const confirmationCode = `BKG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // C. Create Booking
    const newBooking = await tx.booking.create({
      data: {
        confirmationCode,
        otaReference: externalResId,
        source: BookingSource.BOOKING_COM,
        status: BookingStatus.CONFIRMED,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        primaryGuestId: guestUser.id,
        propertyId: connection.propertyId,
        totalAmount: Number(res.total_price) || 0,
        paymentStatus: PaymentStatus.completed,
        paymentMethod: 'OTA_COLLECT',
        guests: res.products?.[0]?.guests?.length || 1,
        ...(availableRoom ? {
          roomAssignments: {
            create: {
              roomId: availableRoom.id,
              startDate: checkInDate,
              endDate: checkOutDate,
              status: 'ACTIVE'
            }
          }
        } : {})
      }
    });

    // D. Create Stay Event
    await tx.stayEvent.create({
      data: {
        bookingId: newBooking.id,
        type: 'BOOKED',
        notes: `Reservation ingested from Booking.com Demand API (${externalResId})`
      }
    });

    // E. Initialize Guest Billing Folio
    const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
    const folio = await tx.folio.create({
      data: {
        bookingId: newBooking.id,
        type: 'GUEST',
        status: 'OPEN'
      }
    });

    await tx.folioLineItem.create({
      data: {
        folioId: folio.id,
        description: `Booking.com Accommodation Charge (${nights} nights)`,
        amount: Number(res.total_price) || 0,
        type: 'ROOM_CHARGE'
      }
    });

    // F. Persist ChannelReservation record linked to Booking
    await tx.channelReservation.upsert({
      where: {
        connectionId_externalReservationId: {
          connectionId,
          externalReservationId: externalResId
        }
      },
      create: {
        connectionId,
        externalReservationId: externalResId,
        externalRoomId: res.room_id,
        externalRateId: res.rate_id,
        status: 'CONFIRMED',
        payload: res as any,
        bookingId: newBooking.id,
        processedAt: new Date()
      },
      update: {
        status: 'CONFIRMED',
        payload: res as any,
        bookingId: newBooking.id,
        processedAt: new Date()
      }
    });

    return newBooking;
  });

  // 5. Acknowledge OTA
  await adapter.acknowledgeReservation(connectionId, externalResId);

  await prisma.channelReservation.update({
    where: {
      connectionId_externalReservationId: {
        connectionId,
        externalReservationId: externalResId
      }
    },
    data: {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date()
    }
  });

  return { status: 'CONFIRMED', reservationId: externalResId, bookingId: booking.id };
}

/**
 * INBOUND WORKER
 * Processes RESERVATION_PULL and WEBHOOK_PUSH jobs.
 */
export const inboundWorker = new Worker('inbound-ota', async (job: Job) => {
  const { operation, connectionId, payload } = job.data;

  const connection = await prisma.channelConnection.findUnique({
    where: { id: connectionId },
    include: { provider: true }
  });

  if (!connection) throw new Error(`Channel connection not found: ${connectionId}`);

  const adapter = adapters[connection.provider.code];
  if (!adapter) throw new Error(`No adapter registered for provider code: ${connection.provider.code}`);

  if (operation === 'RESERVATION_PULL') {
    // 1. Pull reservations from OTA
    const externalReservations = await adapter.pullReservations(connectionId);
    log.info(`[INBOUND_WORKER] Pulled ${externalReservations.length} reservations for connection ${connectionId}`);

    const results = [];
    for (const res of externalReservations) {
      const outcome = await ingestReservation(connection, adapter, res);
      results.push(outcome);
    }

    return { success: true, processed: results };
  }

  if (operation === 'WEBHOOK_PUSH') {
    log.info(`[INBOUND_WORKER] Processing WEBHOOK_PUSH for connection ${connectionId}`);
    try {
      const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
      
      // If webhook contains an order or reservation payload directly
      if (parsed.reservation_id || parsed.order_id || parsed.id) {
        const outcome = await ingestReservation(connection, adapter, parsed);
        return { success: true, outcome };
      }

      // If webhook is a notification that orders were updated, trigger a pull
      const outcome = await adapter.pullReservations(connectionId);
      for (const res of outcome) {
        await ingestReservation(connection, adapter, res);
      }

      return { success: true, pulled: outcome.length };
    } catch (err: any) {
      log.error('[INBOUND_WORKER] Webhook processing failed', { error: err.message });
      throw err;
    }
  }

  throw new Error(`Unsupported job operation: ${operation}`);
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

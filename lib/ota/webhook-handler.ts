import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';
import { BookingSource } from '@prisma/client';
import { acquireLock } from '@/lib/lock';

export interface OtaReservationPayload {
  ota_reservation_code: string;
  ota_room_type_id: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  total_price: number;
  currency: string;
  status: 'new' | 'modified' | 'cancelled';
}

/**
 * Processes an incoming OTA reservation from the middleware webhook
 */
export async function processOtaReservation(payload: OtaReservationPayload) {
  const { ota_reservation_code, ota_room_type_id, check_in, check_out, guest_name, total_price, status } = payload;

  let releaseLock: (() => Promise<void>) | null = null;
  try {
    // Acquire distributed lock to prevent concurrent webhook overbooking race conditions
    releaseLock = await acquireLock(`ota_room_type:${ota_room_type_id}`);

    log.info('Processing OTA Reservation Webhook', { ota_reservation_code, status });

    // 1. Transactional handling of the reservation
    return await prisma.$transaction(async (tx: any) => {
      
      // A. Check for existing reservation
      const existingBooking = await tx.booking.findFirst({
        where: { otaReference: ota_reservation_code }
      });

      // B. Handle Cancellation
      if (status === 'cancelled') {
        if (!existingBooking) {
          log.warn('Received cancellation for non-existent OTA booking', { ota_reservation_code });
          return { status: 'IGNORED', reason: 'NOT_FOUND' };
        }
        
        const updated = await tx.booking.update({
          where: { id: existingBooking.id },
          data: { status: 'CANCELLED', updatedAt: new Date() }
        });

        log.info('OTA Reservation Cancelled and Room Released', { ota_reservation_code, roomId: updated.roomId });
        return { status: 'CANCELLED', id: updated.id };
      }

      // C. Handle Modification or New Booking
      if (existingBooking) {
        // Update existing booking dates/price
        const updated = await tx.booking.update({
          where: { id: existingBooking.id },
          data: {
            checkIn: new Date(check_in),
            checkOut: new Date(check_out),
            totalAmount: total_price,
            updatedAt: new Date()
          }
        });
        
        log.info('OTA Reservation Modified', { ota_reservation_code, id: updated.id });
        return { status: 'MODIFIED', id: updated.id };
      }

      // D. Create New Booking
      const mapping = await tx.roomMapping.findFirst({
        where: { otaRoomTypeId: ota_room_type_id }
      });

      if (!mapping) throw new Error(`No mapping found for OTA Room Type ID: ${ota_room_type_id}`);

      const targetRoomType = await tx.roomType.findUnique({
        where: { id: mapping.localRoomTypeId }
      });
      
      if (!targetRoomType) throw new Error(`Local room type not found for mapping: ${mapping.localRoomTypeId}`);

      // Find available physical room (Helper uses tx to ensure consistency in complex flows)
      const availableRoom = await findAvailablePhysicalRoom(targetRoomType.id, new Date(check_in), new Date(check_out), tx);

      if (!availableRoom) {
        log.error('No physical rooms available for OTA booking', { ota_reservation_code, type: targetRoomType.name });
        throw new Error('OVERBOOKING_DETECTED');
      }

      const booking = await tx.booking.create({
        data: {
          checkIn: new Date(check_in),
          checkOut: new Date(check_out),
          createdAt: new Date(),
          guests: 2,
          paymentMethod: 'OTA_COLLECT',
          paymentStatus: 'completed',
          status: 'CONFIRMED',
          totalAmount: total_price,
          updatedAt: new Date(),
          primaryGuestId: 'SYSTEM',
          source: BookingSource.BOOKING_COM,
          otaReference: ota_reservation_code,
          confirmationCode: `OTA-${ota_reservation_code.slice(-6)}`,
          roomAssignments: {
            create: {
              roomId: availableRoom.id,
              startDate: new Date(check_in),
              endDate: new Date(check_out),
              status: 'ACTIVE'
            }
          }
        }
      });

      await tx.stayEvent.create({
        data: {
          bookingId: booking.id,
          type: 'BOOKED',
          notes: 'Booking created via OTA webhook'
        }
      });

      const nights = Math.ceil((new Date(check_out).getTime() - new Date(check_in).getTime()) / (1000 * 60 * 60 * 24)) || 1;
      
      const folio = await tx.folio.create({
        data: {
          bookingId: booking.id,
          type: 'GUEST',
          status: 'OPEN'
        }
      });

      await tx.folioLineItem.create({
        data: {
          folioId: folio.id,
          description: `Room Charge (${nights} nights)`,
          amount: total_price,
          category: 'ROOM',
        }
      });

      // Log success to sync logs (outside transaction if preferred, or inside for consistency)
      await tx.syncLog.create({
        data: {
          direction: 'PULL',
          status: 'SUCCESS',
          entityType: 'RESERVATION',
          entityId: ota_reservation_code,
          payload: payload as any,
        }
      });

      return { status: 'INGESTED', id: booking.id };
    });

  } catch (error: any) {
    if (['P2002', 'P2004', 'P2010'].includes(error.code)) {
      if (error.message?.includes('RoomAssignment_no_overlap_excl') || error.message?.includes('overlapping')) {
        log.error('OTA Reservation Rejected: Room Already Assigned (Overbooking Prevented by DB)', { ota_reservation_code });
        // Instead of completely failing, an OTA overbooking means we cannot fulfill it with the targeted room.
        // In a real system, we might re-assign to another room. For now, fail the webhook.
        throw new Error('OVERBOOKING_DETECTED_DB_CONSTRAINT');
      }
      
      // If it's a generic P2002 on Booking, it's idempotency
      if (error.code === 'P2002') {
        log.info('Idempotent OTA Reservation (Duplicate Detected)', { ota_reservation_code });
        return { status: 'IGNORED', reason: 'DUPLICATE' };
      }
    }

    log.error('OTA Reservation Processing Failed', { error: error.message, ota_reservation_code });
    
    await prisma.syncLog.create({
      data: {
        direction: 'PULL',
        status: 'FAILED',
        entityType: 'RESERVATION',
        entityId: ota_reservation_code,
        payload: payload as any,
        errorMessage: error.message,
      }
    });

    throw error;
  } finally {
    if (releaseLock) {
      await releaseLock();
    }
  }
}

/**
 * Finds an available physical room of a specific type for the given dates
 */
async function findAvailablePhysicalRoom(roomTypeId: string, start: Date, end: Date, tx: any = prisma) {
  // We find rooms of the given type, order them (arbitrary), and try to lock one that is available
  const rooms: any[] = await tx.$queryRaw`
    SELECT id FROM "Room" 
    WHERE "roomTypeId" = ${roomTypeId} AND status = 'AVAILABLE' 
    ORDER BY "number" ASC
    FOR UPDATE SKIP LOCKED
  `;

  for (const r of rooms) {
    // Check for double booking using the existing logic
    const overlap = await tx.booking.findFirst({
      where: {
        roomId: r.id,
        status: { not: 'CANCELLED' },
        OR: [
          { checkIn: { lt: end }, checkOut: { gt: start } }
        ]
      }
    });

    if (!overlap) {
      // Re-fetch the full room model to return it
      return await tx.room.findUnique({ where: { id: r.id } });
    }
  }

  return null;
}

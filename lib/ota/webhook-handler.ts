import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';
import { BookingSource } from '@prisma/client';

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

  try {
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

      const targetRoomType = await tx.room.findFirst({
        where: { id: mapping.localRoomTypeId }
      });
      
      if (!targetRoomType) throw new Error(`Local room type not found for mapping: ${mapping.localRoomTypeId}`);

      // Find available physical room (Helper uses tx to ensure consistency in complex flows)
      const availableRoom = await findAvailablePhysicalRoom(targetRoomType.type, new Date(check_in), new Date(check_out), tx);

      if (!availableRoom) {
        log.error('No physical rooms available for OTA booking', { ota_reservation_code, type: targetRoomType.type });
        throw new Error('OVERBOOKING_DETECTED');
      }

      const booking = await tx.booking.create({
        data: {
          checkIn: new Date(check_in),
          checkOut: new Date(check_out),
          createdAt: new Date(),
          guests: 2,
          paymentMethod: 'OTA_COLLECT',
          paymentStatus: 'CONFIRMED',
          roomId: availableRoom.id,
          status: 'CONFIRMED',
          totalAmount: total_price,
          updatedAt: new Date(),
          userId: 'SYSTEM',
          source: BookingSource.BOOKING_COM,
          otaReference: ota_reservation_code,
          confirmationCode: `OTA-${ota_reservation_code.slice(-6)}`
        }
      });

      // Log success to sync logs (outside transaction if preferred, or inside for consistency)
      await tx.syncLog.create({
        data: {
          direction: 'PULL',
          status: 'SUCCESS',
          payload: payload as any,
        }
      });

      return { status: 'INGESTED', id: booking.id };
    });

  } catch (error: any) {
    log.error('OTA Reservation Processing Failed', { error: error.message, ota_reservation_code });
    
    await prisma.syncLog.create({
      data: {
        direction: 'PULL',
        status: 'FAILED',
        payload: payload as any,
        errorMessage: error.message,
      }
    });

    throw error;
  }
}

/**
 * Finds an available physical room of a specific type for the given dates
 */
async function findAvailablePhysicalRoom(type: string, start: Date, end: Date, tx: any = prisma) {
  const rooms = await tx.room.findMany({
    where: { type: type, status: 'available' }
  });

  for (const room of rooms) {
    const overlap = await tx.booking.findFirst({
      where: {
        roomId: room.id,
        status: { not: 'CANCELLED' },
        OR: [
          { checkIn: { lt: end }, checkOut: { gt: start } }
        ]
      }
    });

    if (!overlap) return room;
  }

  return null;
}

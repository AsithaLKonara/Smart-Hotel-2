import prisma from '@/lib/db';
import { BookingStatus, RoomStatus } from '@prisma/client';

export class BookingService {
  static async updateBookingWithOCC(
    id: string,
    expectedVersion: number,
    data: { status?: BookingStatus, paymentStatus?: any }
  ) {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Fetch current with lock
      const current = await tx.booking.findUnique({ where: { id } });
      if (!current) throw new Error('Booking not found');
      
      // 2. Validate Version (Optimistic Locking)
      if (current.version !== expectedVersion) {
        throw new Error('Concurrent modification detected. Please refresh and try again.');
      }

      // 3. Status Transitions
      if (data.status && data.status !== current.status) {
        if (data.status === 'CHECKED_IN') {
          // Double booking prevention check
          const room = await tx.room.findUnique({ where: { id: current.roomId } });
          if (!room || room.status !== 'AVAILABLE') {
            throw new Error(`Room is currently ${room?.status}. Cannot check-in.`);
          }
          await tx.room.update({
            where: { id: current.roomId },
            data: { status: 'OCCUPIED', version: room.version + 1 }
          });
        }
      }

      // 4. Atomic Update
      return await tx.booking.update({
        where: { id },
        data: {
          ...data,
          version: expectedVersion + 1,
        },
      });
    }, {
      isolationLevel: 'Serializable'
    });
  }
}

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { addDays, format, isBefore, isSameDay } from 'date-fns'

export class AvailabilityEngine {
  /**
   * Returns a daily inventory count for all room types between startDate and endDate.
   * This is explicitly designed for Channel Manager pushing (e.g., a 365-day push).
   */
  static async getInventoryTimeline(startDate: Date, endDate: Date, propertyId?: string) {
    // 1. Get all room types and their physical rooms
    const roomTypes = await prisma.roomType.findMany({
      where: propertyId ? { propertyId } : {},
      include: {
        rooms: {
          where: {
            status: { notIn: ['MAINTENANCE', 'OUT_OF_ORDER'] },
            ...(propertyId ? { propertyId } : {})
          }
        }
      }
    });

    // 2. Fetch all conflicting bookings in this date range
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        ...(propertyId ? { propertyId } : {}),
        OR: [
          { checkIn: { gte: startDate, lt: endDate } },
          { checkOut: { gt: startDate, lte: endDate } },
          { checkIn: { lte: startDate }, checkOut: { gte: endDate } }
        ]
      },
      include: {
        roomAssignments: true
      }
    });

    // 3. Fetch out of order records
    const outOfOrderRecords = await prisma.outOfOrderRecord.findMany({
      where: {
        OR: [
          { startDate: { gte: startDate, lt: endDate } },
          { endDate: { gt: startDate, lte: endDate } },
          { startDate: { lte: startDate }, endDate: { gte: endDate } }
        ]
      }
    });

    // 4. Build timeline
    const timeline: Record<string, Record<string, number>> = {}; // { roomTypeId: { '2026-09-14': 5 } }

    let currentDate = new Date(startDate);
    while (isBefore(currentDate, endDate) || isSameDay(currentDate, endDate)) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      for (const roomType of roomTypes) {
        if (!timeline[roomType.id]) timeline[roomType.id] = {};
        
        let availableCount = roomType.rooms.length;

        // Deduct bookings that overlap with this specific date
        for (const booking of conflictingBookings) {
          if (currentDate >= booking.checkIn && currentDate < booking.checkOut) {
            // Find if any room assignment matches this room type
            const assignments = booking.roomAssignments.filter((ra: any) => 
              roomType.rooms.some((r: any) => r.id === ra.roomId)
            );
            availableCount -= assignments.length;
          }
        }

        // Deduct out of order rooms
        for (const ooo of outOfOrderRecords) {
          if (currentDate >= ooo.startDate && currentDate <= ooo.endDate) {
             const isMatch = roomType.rooms.some((r: any) => r.id === ooo.roomId);
             if (isMatch) availableCount--;
          }
        }

        timeline[roomType.id][dateStr] = Math.max(0, availableCount);
      }

      currentDate = addDays(currentDate, 1);
    }

    return timeline;
  }

  /**
   * Boolean check for idempotency worker to verify if a specific room type has capacity 
   * for a given date range before accepting an OTA reservation.
   */
  static async hasAvailability(roomTypeId: string, propertyId: string, checkIn: Date, checkOut: Date, quantity: number = 1): Promise<boolean> {
    const timeline = await this.getInventoryTimeline(checkIn, checkOut, propertyId);
    const roomTimeline = timeline[roomTypeId];
    
    if (!roomTimeline) return false;

    // Check all days in the stay (excluding checkout day)
    let currentDate = new Date(checkIn);
    while (isBefore(currentDate, checkOut)) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      if ((roomTimeline[dateStr] || 0) < quantity) {
        return false;
      }
      currentDate = addDays(currentDate, 1);
    }

    return true;
  }
}

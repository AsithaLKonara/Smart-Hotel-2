import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { bookingComService } from '@/lib/booking-com';
import logger from '@/lib/logger';
import prisma from '@/lib/prisma';

/**
 * Manual Synchronization Endpoint
 * Triggered by Admin to sync current availability and pull new reservations.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    
    // Check for Admin privileges
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Starting manual Booking.com synchronization');

    // 1. Pull New Reservations
    const reservations = await bookingComService.fetchNewReservations();
    
    let syncedCount = 0;
    
    for (const res of reservations) {
      // Find room by otaMappingId or fallback to any room type for testing
      let roomType = await prisma.roomType.findFirst({
         where: { otaMappingId: res.room_id }
      });
      if (!roomType) {
         roomType = await prisma.roomType.findFirst();
      }

      if (!roomType) continue;

      // Find available room of that type
      const availableRoom = await prisma.room.findFirst({
        where: { roomTypeId: roomType.id, status: 'AVAILABLE' }
      });
      
      if (!availableRoom) continue; 

      let user = await prisma.user.findFirst({ where: { email: `${res.guest_name.replace(' ', '.').toLowerCase()}@ota.mock.com` }});
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: `${res.guest_name.replace(' ', '.').toLowerCase()}@ota.mock.com`,
            name: res.guest_name,
            password: 'mock_password_for_ota',
          }
        });
      }

      await prisma.booking.upsert({
        where: { confirmationCode: res.id },
        create: {
          confirmationCode: res.id,
          otaReference: res.id,
          source: 'BOOKING_COM',
          checkIn: new Date(res.checkin),
          checkOut: new Date(res.checkout),
          primaryGuestId: user.id,
          totalAmount: res.total_price,
          status: res.status === 'confirmed' ? 'CONFIRMED' : (res.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'),
          roomAssignments: {
            create: {
              roomId: availableRoom.id,
              startDate: new Date(res.checkin),
              endDate: new Date(res.checkout),
              status: 'ACTIVE'
            }
          }
        },
        update: {
          status: res.status === 'confirmed' ? 'CONFIRMED' : (res.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'),
        }
      });
      syncedCount++;
    }

    // 2. Push Current Availability
    const roomTypes = await prisma.roomType.findMany({ include: { rooms: true } });
    let roomsUpdated = 0;
    
    for (const rt of roomTypes) {
      const dates = [];
      for (let i = 0; i < 30; i++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + i);
        targetDate.setHours(0,0,0,0);
        
        const activeBookings = await prisma.booking.count({
           where: {
             roomAssignments: { some: { room: { roomTypeId: rt.id } } },
             status: { notIn: ['CANCELLED', 'NO_SHOW'] },
             checkIn: { lte: targetDate },
             checkOut: { gt: targetDate }
           }
        });

        const availableInventory = Math.max(0, rt.totalRooms - activeBookings);

        dates.push({
          date: targetDate.toISOString().split('T')[0],
          price: rt.baseRate,
          inventory: availableInventory
        });
      }

      await bookingComService.updateAvailability(rt.otaMappingId || rt.id, dates);
      roomsUpdated++;
    }

    return NextResponse.json({
      success: true,
      message: 'Synchronization completed successfully',
      reservations_synced: syncedCount,
      room_types_updated: roomsUpdated
    });

  } catch (error) {
    logger.error('Booking.com sync failed', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Synchronization failed' }, { status: 500 });
  }
}

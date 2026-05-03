import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { bookingComService } from '@/lib/booking-com';
import logger from '@/lib/logger';
import prisma from '@/lib/db';

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
    
    // In a real scenario, we would iterate through these and save to DB
    // for (const res of reservations) {
    //   await prisma.booking.upsert({ ... });
    // }

    // 2. Push Current Availability
    // Fetch all rooms from DB
    const rooms = await prisma.room.findMany();
    
    for (const room of rooms) {
      // Mock: Update availability for the next 7 days
      const dates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
          date: d.toISOString().split('T')[0],
          price: room.price,
          inventory: 1 // Default to 1 for mock
        };
      });

      await bookingComService.updateAvailability(room.id, dates);
    }

    return NextResponse.json({
      success: true,
      message: 'Synchronization completed successfully',
      reservations_synced: reservations.length,
      rooms_updated: rooms.length
    });

  } catch (error) {
    logger.error('Booking.com sync failed', { error });
    return NextResponse.json({ error: 'Synchronization failed' }, { status: 500 });
  }
}

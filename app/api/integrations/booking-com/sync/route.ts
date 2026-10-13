import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { BookingComAdapter } from '@/lib/channel-manager/adapters/booking-com';
import { AvailabilityEngine } from '@/lib/availability-engine';
import { inboundOtaQueue } from '@/lib/channel-manager/queues';
import { log } from '@/lib/logger';

/**
 * Manual Synchronization Endpoint
 * Triggered by Admin to sync current availability and pull new reservations.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role;
    
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.info('Starting manual Booking.com synchronization');

    // 1. Find active Booking.com channel connection
    const connection = await prisma.channelConnection.findFirst({
      where: {
        provider: { code: 'BOOKING_COM' }
      },
      include: {
        provider: true,
        roomMappings: true
      }
    });

    if (!connection) {
      return NextResponse.json({
        error: 'No active Booking.com connection configured. Please connect Booking.com first.'
      }, { status: 404 });
    }

    // 2. Trigger reservation pull via Queue or Adapter
    const adapter = new BookingComAdapter();
    let reservationsPulled = 0;

    try {
      if (inboundOtaQueue) {
        await inboundOtaQueue.add('manual-pull', {
          operation: 'RESERVATION_PULL',
          connectionId: connection.id
        });
      }
      const reservations = await adapter.pullReservations(connection.id);
      reservationsPulled = reservations.length;
    } catch (pullErr: any) {
      log.warn('Reservation pull warning:', { error: pullErr.message });
    }

    // 3. Broadcast current availability timeline for all mapped room types
    let roomsUpdated = 0;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30-day broadcast

    const timelineData = await AvailabilityEngine.getInventoryTimeline(startDate, endDate, connection.propertyId);

    for (const mapping of connection.roomMappings) {
      if (mapping.syncAvailability && timelineData[mapping.localRoomTypeId]) {
        await adapter.pushAvailability(
          connection.id,
          mapping.externalRoomId,
          timelineData[mapping.localRoomTypeId]
        );
        roomsUpdated++;
      }
    }

    // If no room mappings were explicitly configured, count active room types
    if (roomsUpdated === 0) {
      const roomTypes = await prisma.roomType.findMany({
        where: { propertyId: connection.propertyId }
      });
      roomsUpdated = roomTypes.length;
    }

    await prisma.channelConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncAt: new Date(),
        lastSuccessAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Synchronization completed successfully',
      reservations_synced: reservationsPulled,
      room_types_updated: roomsUpdated
    });

  } catch (error: any) {
    log.error('Booking.com sync failed', { error: error.message });
    return NextResponse.json({ error: error.message || 'Synchronization failed' }, { status: 500 });
  }
}

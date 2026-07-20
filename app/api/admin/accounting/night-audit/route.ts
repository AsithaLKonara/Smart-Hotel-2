import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { realtime } from '@/lib/realtime';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const auditLog = await prisma.$transaction(async (tx: any) => {
      // 1. Get all CHECKED_IN bookings
      const activeBookings = await tx.booking.findMany({
        where: { status: 'CHECKED_IN' },
        include: { roomAssignments: { include: { room: { include: { roomType: true } } } } }
      });

      let totalRevenue = 0;
      const businessDate = new Date();

      // 2. Post room charges
      for (const booking of activeBookings) {
        let folio = await tx.folio.findFirst({
          where: { bookingId: booking.id, type: 'MASTER' }
        });

        if (!folio) {
          folio = await tx.folio.create({
            data: {
              bookingId: booking.id,
              type: 'MASTER',
              status: 'OPEN',
              propertyId: booking.propertyId
            }
          });
        }

        // Process all room assignments for the booking
        for (const assignment of booking.roomAssignments) {
          if (!assignment || !assignment.room || !assignment.room.roomType) continue;

          const rate = assignment.room.roomType.baseRate;
          const tax = rate * 0.15; // 15% Tax added back

          await tx.folioLineItem.create({
            data: {
              folioId: folio.id,
              description: `Room Charge - ${assignment.room.number}`,
              category: 'ROOM_CHARGE',
              amount: rate
            }
          });

          await tx.folioLineItem.create({
            data: {
              folioId: folio.id,
              description: `Room Tax (15%) - ${assignment.room.number}`,
              category: 'TAX',
              amount: tax
            }
          });

          totalRevenue += (rate + tax);

          await tx.journalEntry.create({
            data: {
              accountId: 'A/R-GUEST',
              debit: rate + tax,
              description: `Room Posting: ${booking.id} (${assignment.room.number})`,
              postingDate: businessDate
            }
          });
        }
      }

      // 3. Log Audit
      return await tx.nightAuditLog.create({
        data: {
          businessDate,
          totalRevenue,
          roomsProcessed: activeBookings.length,
          runByUserId: session.user.id
        }
      });
    });

    try {
      await realtime.trigger('admin', 'night_audit.completed', {
        businessDate: auditLog.businessDate,
        revenue: auditLog.totalRevenue,
        roomsProcessed: auditLog.roomsProcessed
      });
    } catch (e) {
      console.error('Pusher error:', e);
    }

    return NextResponse.json({ success: true, auditLog });
  } catch (error) {
    console.error('Night audit failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logs = await prisma.nightAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: true }
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

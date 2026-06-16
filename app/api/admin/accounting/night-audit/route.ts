import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get all CHECKED_IN bookings
    const activeBookings = await prisma.booking.findMany({
      where: { status: 'CHECKED_IN' },
      include: { room: { include: { roomType: true } } }
    });

    let totalRevenue = 0;
    const businessDate = new Date();

    // 2. Post room charges
    for (const booking of activeBookings) {
      let folio = await prisma.invoice.findFirst({
        where: { bookingId: booking.id, folioType: 'MASTER' }
      });

      if (!folio) {
        folio = await prisma.invoice.create({
          data: {
            bookingId: booking.id,
            invoiceNo: `FOL-${Date.now()}-${booking.id.slice(0,4)}`,
            folioType: 'MASTER',
            status: 'OPEN',
            subtotal: 0, taxAmount: 0, grandTotal: 0
          }
        });
      }

      const rate = booking.room.roomType.baseRate;
      const tax = 0; // Tax removed

      await prisma.invoiceLineItem.create({
        data: {
          invoiceId: folio.id,
          description: `Room Charge - ${booking.room.number}`,
          category: 'ROOM',
          quantity: 1,
          unitPrice: rate,
          totalPrice: rate + tax
        }
      });

      await prisma.invoice.update({
        where: { id: folio.id },
        data: {
          subtotal: folio.subtotal + rate,
          taxAmount: folio.taxAmount + tax,
          grandTotal: folio.grandTotal + rate + tax
        }
      });

      totalRevenue += (rate + tax);

      await prisma.journalEntry.create({
        data: {
          accountId: 'A/R-GUEST',
          debit: rate + tax,
          description: `Room Posting: ${booking.id}`,
          postingDate: businessDate
        }
      });
    }

    // 3. Log Audit
    const auditLog = await prisma.nightAuditLog.create({
      data: {
        businessDate,
        totalRevenue,
        roomsProcessed: activeBookings.length,
        runByUserId: session.user.id
      }
    });

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

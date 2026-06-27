import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'FRONT_DESK'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = id;

    // Validate the booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        stay: true,
        folios: {
          include: {
            lineItems: true,
            payments: true
          }
        },
        roomAssignments: {
          where: { status: 'ACTIVE' },
          include: { room: true }
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'CHECKED_OUT') {
      return NextResponse.json({ error: 'Booking is already checked out' }, { status: 400 });
    }

    // Process Folio balances
    let totalCharges = 0;
    let totalPayments = 0;
    for (const folio of booking.folios) {
      for (const item of folio.lineItems) {
        totalCharges += item.amount;
      }
      for (const payment of folio.payments) {
        if (payment.status === 'completed') {
          totalPayments += payment.amount;
        }
      }
    }

    const balance = totalCharges - totalPayments;
    
    // In a real application, you might prevent checkout if balance > 0
    // We allow it here but you could add a 'force' flag check if needed
    // if (balance > 0) {
    //   return NextResponse.json({ error: 'Outstanding balance exists', balance }, { status: 400 });
    // }

    // Execute state transitions
    await prisma.$transaction(async (tx: any) => {
      // 1. Update Booking status and clear checkout request
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CHECKED_OUT',
          checkoutRequestId: null,
          checkoutFinalizedAt: new Date(),
        }
      });

      // 2. Update Stay status
      if (booking.stay) {
        await tx.stay.update({
          where: { id: booking.stay.id },
          data: {
            status: 'CHECKED_OUT',
            checkOutTime: new Date()
          }
        });
      }

      // 3. Mark active rooms as dirty
      const activeAssignments = booking.roomAssignments;
      for (const assignment of activeAssignments) {
        await tx.room.update({
          where: { id: assignment.roomId },
          data: {
            status: 'DIRTY',
            lastStatusChangeAt: new Date()
          }
        });

        await tx.roomAssignment.update({
          where: { id: assignment.id },
          data: {
            status: 'COMPLETED'
          }
        });
        
        // Log status history
        await tx.roomStatusHistory.create({
          data: {
            roomId: assignment.roomId,
            oldStatus: assignment.room.status,
            newStatus: 'DIRTY',
            actorId: (session.user as any).id,
            reason: 'Guest checkout'
          }
        });
      }

      // 4. Record Stay Event
      await tx.stayEvent.create({
        data: {
          bookingId: booking.id,
          type: 'CHECK_OUT',
          actorId: (session.user as any).id,
          notes: `Checkout finalized. Outstanding balance: ${balance}`
        }
      });
    });

    return NextResponse.json({ success: true, message: 'Checkout completed successfully' });
  } catch (error) {
    console.error('Failed to complete checkout:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

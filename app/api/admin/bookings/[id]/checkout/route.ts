import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { realtime } from '@/lib/realtime';
import { getEffectivePropertyId } from '@/lib/server-rbac';

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

    const activePropertyId = await getEffectivePropertyId(req);
    if (booking.propertyId !== activePropertyId) {
      return NextResponse.json({ error: 'Unauthorized: Booking belongs to a different property' }, { status: 403 });
    }

    if (booking.status === 'CHECKED_OUT') {
      return NextResponse.json({ error: 'Booking is already checked out' }, { status: 400 });
    }

    // Process Folio balances
    let totalCharges = new Prisma.Decimal(0);
    let totalPayments = new Prisma.Decimal(0);
    for (const folio of booking.folios) {
      for (const item of folio.lineItems) {
        totalCharges = totalCharges.add(item.amount);
      }
      for (const payment of folio.payments) {
        if (payment.status === 'completed') {
          totalPayments = totalPayments.add(payment.amount);
        }
      }
    }

    const balance = totalCharges.sub(totalPayments).toNumber();
    
    // In a real application, you might prevent checkout if balance > 0
    // We allow it here but you could add a 'force' flag check if needed
    // if (balance > 0) {
    //   return NextResponse.json({ error: 'Outstanding balance exists', balance }, { status: 400 });
    // }

    // Execute state transitions
    await prisma.$transaction(async (tx: any) => {
      // 0. Close Folios & Double-entry Ledger
      for (const folio of booking.folios) {
        await tx.folio.update({
          where: { id: folio.id },
          data: { status: 'CLOSED' }
        });

        // Calculate total charges for this specific folio
        const folioCharges = folio.lineItems.reduce((acc: any, item: any) => acc.add(item.amount), new Prisma.Decimal(0)).toNumber();
        const folioPayments = folio.payments.filter((p: any) => p.status === 'completed').reduce((acc: any, p: any) => acc.add(p.amount), new Prisma.Decimal(0)).toNumber();
        const folioBalance = folioCharges - folioPayments;

        if (folioCharges > 0) {
          // Double-entry settlement log
          await tx.journalEntry.create({
            data: {
              accountId: 'GUEST_LEDGER',
              debit: 0,
              credit: folioCharges,
              description: `Checkout settlement for Folio ${folio.id}`,
              postingDate: new Date()
            }
          });
          
          // Fix 3: Iterate through individual payments to correctly record their account type
          // 'CASH' for offline payments, 'STRIPE_CLEARING' for online payments
          const completedPayments = folio.payments.filter((p: any) => p.status === 'completed');
          for (const payment of completedPayments) {
            const accountId = payment.paymentProvider === 'STRIPE' ? 'STRIPE_CLEARING' : 'CASH';
            await tx.journalEntry.create({
              data: {
                accountId: accountId,
                debit: payment.amount,
                credit: 0,
                description: `Checkout payment settlement for Folio ${folio.id} (${payment.paymentProvider || 'CASH'})`,
                postingDate: new Date()
              }
            });
          }

          if (folioBalance > 0) {
            await tx.journalEntry.create({
              data: {
                accountId: 'ACCOUNTS_RECEIVABLE',
                debit: folioBalance,
                credit: 0,
                description: `Checkout balance transfer for Folio ${folio.id}`,
                postingDate: new Date()
              }
            });
          }
        }
      }
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

      // 3. Mark active rooms as dirty and generate cleaning task
      const activeAssignments = booking.roomAssignments;
      for (const assignment of activeAssignments) {
        await tx.room.update({
          where: { id: assignment.roomId },
          data: {
            status: 'DIRTY',
            lastStatusChangeAt: new Date()
          }
        });

        await tx.task.create({
          data: {
            title: `Clean Room ${assignment.room.number} (Checkout)`,
            type: 'HOUSEKEEPING',
            status: 'PENDING',
            priority: 'HIGH',
            roomId: assignment.roomId,
            bookingId: bookingId,
            propertyId: booking.propertyId
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

    try {
      await realtime.trigger('admin', 'booking.checked_out', {
        bookingId: bookingId,
        balance: balance
      });
      for (const assignment of booking.roomAssignments) {
        await realtime.trigger('admin', 'room.status_changed', {
          roomId: assignment.roomId,
          status: 'DIRTY'
        });
      }
    } catch (e) {
      console.error('Pusher error:', e);
    }

    return NextResponse.json({ success: true, message: 'Checkout completed successfully' });
  } catch (error) {
    console.error('Failed to complete checkout:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

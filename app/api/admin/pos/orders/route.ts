import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const { outletId, items, paymentType, roomNumber } = data;

    if (!outletId || !items || items.length === 0 || !paymentType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const totalAmount = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

    let invoiceId = null;

    if (paymentType === 'ROOM_CHARGE' && roomNumber) {
      const room = await prisma.room.findUnique({
        where: { number: roomNumber },
        include: {
          bookings: {
            where: { status: 'CHECKED_IN' },
            include: { invoices: { where: { folioType: 'MASTER' } } }
          }
        }
      });

      if (!room || room.bookings.length === 0) {
        return NextResponse.json({ error: 'No active booking found for this room' }, { status: 404 });
      }

      const activeBooking = room.bookings[0];
      const masterInvoice = activeBooking.invoices[0];

      if (!masterInvoice) {
        return NextResponse.json({ error: 'No open master folio (invoice) found for the guest' }, { status: 404 });
      }

      invoiceId = masterInvoice.id;

      const outlet = await prisma.pOSOutlet.findUnique({ where: { id: outletId } });
      const description = `POS Charge: ${outlet?.name || 'Outlet'}`;

      await prisma.invoiceLineItem.create({
        data: {
          invoiceId,
          description,
          quantity: 1,
          unitPrice: totalAmount,
          totalPrice: totalAmount,
          category: 'POS'
        }
      });
      
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { 
            subtotal: masterInvoice.subtotal + totalAmount,
            grandTotal: masterInvoice.grandTotal + totalAmount 
        }
      });
    }

    const order = await prisma.pOSOrder.create({
      data: {
        outletId,
        invoiceId,
        paymentType,
        status: 'COMPLETED',
        totalAmount,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price
          }))
        }
      },
      include: { items: true, outlet: true }
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Failed to create POS Order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    let folioId = null;

    if (paymentType === 'ROOM_CHARGE') {
      let masterFolio = null;

      if (data.bookingId) {
        // Find by specific booking ID
        const booking = await prisma.booking.findUnique({
          where: { id: data.bookingId },
          include: { folios: { where: { type: 'GUEST' } } } // Changed from folioType: 'MASTER'
        });
        
        if (booking && booking.folios.length > 0) {
          masterFolio = booking.folios[0];
        }
      } else if (roomNumber) {
        // Fallback: Find by room number
        const room = await prisma.room.findUnique({
          where: { number: roomNumber },
          include: {
            bookings: {
              where: { status: 'CHECKED_IN' },
              include: { folios: { where: { type: 'GUEST' } } }
            }
          }
        });

        if (room && room.bookings.length > 0 && room.bookings[0].folios.length > 0) {
          masterFolio = room.bookings[0].folios[0];
        }
      }

      if (!masterFolio) {
        return NextResponse.json({ error: 'No active booking or open folio found for this guest' }, { status: 404 });
      }

      folioId = masterFolio.id;

      const outlet = await prisma.pOSOutlet.findUnique({ where: { id: outletId } });
      const description = `POS Charge: ${outlet?.name || 'Outlet'}`;

      // FolioLineItem uses 'amount', not 'quantity'/'unitPrice'
      await prisma.folioLineItem.create({
        data: {
          folioId,
          description,
          amount: totalAmount,
          category: 'POS'
        }
      });
    }

    const order = await prisma.internalOrder.create({
      data: {
        outletId,
        folioId,
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

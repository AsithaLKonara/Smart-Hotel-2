import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { bookingId, cart, totalAmount, paymentType } = await req.json();

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const posOrder = await prisma.$transaction(async (tx: any) => {
      // 1. Create POS Order
      // Assume a default outlet for now if not provided
      let defaultOutlet = await tx.pOSOutlet.findFirst();
      if (!defaultOutlet) {
        defaultOutlet = await tx.pOSOutlet.create({
          data: { name: 'Main Restaurant', type: 'RESTAURANT' }
        });
      }

      let targetFolioId = null;

      if (paymentType === 'ROOM_CHARGE' && bookingId) {
        const folio = await tx.folio.findFirst({
          where: { bookingId, status: { not: 'PAID' } },
          orderBy: { createdAt: 'desc' }
        });
        
        if (folio) {
          targetFolioId = folio.id;
          
          // Add to FolioLineItem
          for (const item of cart) {
            await tx.folioLineItem.create({
              data: {
                folioId: folio.id,
                description: `POS: ${item.name}`,
                amount: item.price * item.quantity,
                category: 'FOOD_AND_BEVERAGE',
              }
            });
          }
        }
      }

      const order = await tx.internalOrder.create({
        data: {
          outletId: defaultOutlet.id,
          folioId: targetFolioId,
          status: 'COMPLETED',
          totalAmount,
          paymentType,
        }
      });

      // Create Order Items
      for (const item of cart) {
        await tx.internalOrderItem.create({
          data: {
            orderId: order.id,
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
          }
        });
      }

      // Record direct payment if not charged to room
      if (paymentType === 'CARD' || paymentType === 'CASH') {
        await tx.payment.create({
          data: {
            bookingId: bookingId || null,
            orderId: order.id,
            folioId: targetFolioId,
            amount: totalAmount,
            currency: 'LKR',
            paymentMethod: paymentType === 'CARD' ? 'card' : 'cash',
            paymentProvider: 'POS',
            status: 'completed',
            capturedAt: new Date(),
          }
        });
      }

      return order;
    });

    return NextResponse.json({ success: true, orderId: posOrder.id });

  } catch (error) {
    console.error('POS Checkout Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

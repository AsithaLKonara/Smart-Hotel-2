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

      let targetInvoiceId = null;

      if (paymentType === 'ROOM_CHARGE' && bookingId) {
        const invoice = await tx.invoice.findFirst({
          where: { bookingId, status: { not: 'PAID' } },
          orderBy: { issuedAt: 'desc' }
        });
        
        if (invoice) {
          targetInvoiceId = invoice.id;
          
          // Add to InvoiceLineItems
          for (const item of cart) {
            await tx.invoiceLineItem.create({
              data: {
                invoiceId: invoice.id,
                description: `POS: ${item.name}`,
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: item.price * item.quantity,
                category: 'FOOD_AND_BEVERAGE',
                sourceModule: 'POS'
              }
            });
          }

          // Update Invoice Totals
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              subtotal: { increment: totalAmount },
              grandTotal: { increment: totalAmount } // For simplicity not calculating tax here
            }
          });
        }
      }

      const order = await tx.internalOrder.create({
        data: {
          outletId: defaultOutlet.id,
          invoiceId: targetInvoiceId,
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

      return order;
    });

    return NextResponse.json({ success: true, orderId: posOrder.id });

  } catch (error) {
    console.error('POS Checkout Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

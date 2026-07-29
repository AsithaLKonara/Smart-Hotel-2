import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getEffectivePropertyId } from '@/lib/server-rbac';

export async function POST(req: Request) {
  try {
    const { bookingId, folioId, cart, totalAmount, paymentType, settleFolioAmount = 0 } = await req.json();

    if ((!cart || cart.length === 0) && (!settleFolioAmount || settleFolioAmount <= 0)) {
      return NextResponse.json({ error: 'Cart is empty and no folio settlement amount specified' }, { status: 400 });
    }

    const effectivePropertyId = await getEffectivePropertyId(req);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let defaultOutlet = await tx.pOSOutlet.findFirst();
      if (!defaultOutlet) {
        defaultOutlet = await tx.pOSOutlet.create({
          data: { name: 'Main Restaurant', type: 'RESTAURANT' }
        });
      }

      let targetFolioId = folioId || null;

      if (!targetFolioId && bookingId) {
        const folio = await tx.folio.findFirst({
          where: { bookingId, status: { not: 'PAID' } },
          orderBy: { createdAt: 'desc' }
        });
        if (folio) targetFolioId = folio.id;
      }

      // Security check: Ensure the folio belongs to the effective property
      if (targetFolioId && effectivePropertyId !== 'all') {
        const folioCheck = await tx.folio.findUnique({ where: { id: targetFolioId } });
        if (!folioCheck || folioCheck.propertyId !== effectivePropertyId) {
          throw new Error('Unauthorized: Target folio does not belong to active property');
        }
      }

      let order = null;

      // 1. Process POS Cart items if present
      if (cart && cart.length > 0) {
        if (paymentType === 'ROOM_CHARGE' && targetFolioId) {
          for (const item of cart) {
            await tx.folioLineItem.create({
              data: {
                folioId: targetFolioId,
                transactionCodeId: '200-FB-REV',
                description: `POS: ${item.name}`,
                amount: item.price * item.quantity,
                category: 'FOOD_AND_BEVERAGE',
              }
            });
          }
        }

        order = await tx.internalOrder.create({
          data: {
            outletId: defaultOutlet.id,
            folioId: targetFolioId,
            status: 'COMPLETED',
            totalAmount: totalAmount || 0,
            paymentType,
          }
        });

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

          // Activate POS Recipe Stock Depletion & Cost of Goods Integration
          const invItem = await tx.inventoryItem.findFirst({
            where: { OR: [{ name: item.name }, { sku: item.sku || item.id }] },
            include: { stocks: true }
          });
          if (invItem && invItem.stocks && invItem.stocks.length > 0) {
            const primaryStock = invItem.stocks[0];
            await tx.inventoryStock.update({
              where: { id: primaryStock.id },
              data: { quantity: { decrement: item.quantity }, lastCountedAt: new Date() }
            });
            await tx.inventoryMovement.create({
              data: {
                itemId: invItem.id,
                type: 'POS_CONSUMPTION',
                quantity: -Number(item.quantity || 1),
                notes: `Consumed via POS Order #${order.id.substring(0, 8)} (${item.name} x${item.quantity})`
              }
            });
          }
        }

        if (paymentType === 'CARD' || paymentType === 'CASH') {
          await tx.payment.create({
            data: {
              bookingId: bookingId || null,
              orderId: order.id,
              folioId: targetFolioId,
              amount: totalAmount || 0,
              currency: 'USD',
              paymentMethod: paymentType === 'CARD' ? 'card' : 'cash',
              paymentProvider: 'POS',
              status: 'completed',
              capturedAt: new Date(),
            }
          });
        }
      }

      // 2. Process Folio Settlement if requested
      if (settleFolioAmount > 0 && targetFolioId) {
        await tx.payment.create({
          data: {
            bookingId: bookingId || null,
            folioId: targetFolioId,
            amount: settleFolioAmount,
            currency: 'USD',
            paymentMethod: paymentType === 'CARD' ? 'card' : 'cash',
            paymentProvider: 'TERMINAL',
            status: 'completed',
            capturedAt: new Date(),
          }
        });

        await tx.folioLineItem.create({
          data: {
            folioId: targetFolioId,
            transactionCodeId: '900-PAY',
            description: `Payment Received (${paymentType})`,
            amount: -settleFolioAmount,
            category: 'PAYMENT',
          }
        });

        // Recalculate Folio Balance to update status
        const currentFolio = await tx.folio.findUnique({
          where: { id: targetFolioId },
          include: { lineItems: true, payments: true }
        });

        if (currentFolio) {
          const totalCharges = currentFolio.lineItems.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);
          const totalPayments = currentFolio.payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
          const remainingBalance = totalCharges - totalPayments;

          if (remainingBalance <= 0) {
            await tx.folio.update({
              where: { id: targetFolioId },
              data: { status: 'PAID' }
            });
          }
        }
      }

      return { orderId: order?.id, folioId: targetFolioId };
    });

    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    console.error('POS Checkout Error:', error);
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

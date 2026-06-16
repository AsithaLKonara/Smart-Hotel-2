import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const PlaceOrderSchema = z.object({
  guestId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  invoiceId: z.string().uuid(),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })),
  specialRequests: z.string().optional(),
  userId: z.string().uuid().optional(),
});

export type PlaceOrderDTO = z.infer<typeof PlaceOrderSchema>;

export class OrderService {
  /**
   * Places an order and appends it to the guest's Invoice in a single transaction.
   */
  static async placeOrder(data: PlaceOrderDTO) {
    const validatedData = PlaceOrderSchema.parse(data);

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Calculate Total
      const totalAmount = validatedData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

      // 2. Verify Invoice exists and is open
      const invoice = await tx.invoice.findUnique({
        where: { id: validatedData.invoiceId },
      });

      if (!invoice) throw new Error("Invoice not found.");
      if (invoice.status === "PAID" || invoice.isLocked) throw new Error("Cannot add charges to a closed or locked invoice.");

      // 3. Create FoodOrder
      const order = await tx.foodOrder.create({
        data: {
          guestId: validatedData.guestId,
          roomId: validatedData.roomId,
          invoiceId: invoice.id,
          status: "PENDING",
          totalAmount,
          specialRequests: validatedData.specialRequests,
          items: {
            create: validatedData.items.map(item => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.unitPrice,
              subtotal: item.quantity * item.unitPrice,
            }))
          }
        },
      });

      // 4. Create InvoiceLineItem
      await tx.invoiceLineItem.create({
        data: {
          invoiceId: invoice.id,
          description: `F&B Order #${order.id.slice(-6)}`,
          quantity: 1,
          unitPrice: totalAmount,
          totalPrice: totalAmount,
          category: "FOOD_AND_BEVERAGE",
          sourceModule: "POS",
          createdByUserId: validatedData.userId,
        },
      });

      // 5. Update Invoice Total
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotal: invoice.subtotal + totalAmount,
          grandTotal: invoice.grandTotal + totalAmount,
          status: "PARTIAL" // Status changes from PAID to PARTIAL if new charges are added
        },
      });

      return order;
    });
  }
}

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const PlaceOrderSchema = z.object({
  guestId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  folioId: z.string().uuid(),
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

      // 2. Verify Folio exists and is open
      const folio = await tx.folio.findUnique({
        where: { id: validatedData.folioId },
      });

      if (!folio) throw new Error("Folio not found.");
      if (folio.status === "PAID") throw new Error("Cannot add charges to a closed or locked folio.");

      // 3. Create FoodOrder
      const order = await tx.foodOrder.create({
        data: {
          guestId: validatedData.guestId,
          roomId: validatedData.roomId,
          folioId: folio.id,
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

      // 4. Create FolioLineItem
      await tx.folioLineItem.create({
        data: {
          folioId: folio.id,
          description: `F&B Order #${order.id.slice(-6)}`,
          amount: totalAmount,
          category: "FOOD_AND_BEVERAGE",
          isRoutingEnabled: false,
          taxes: [],
        },
      });

      // Status updates for folio are not needed here since totals are dynamic

      return order;
    });
  }
}

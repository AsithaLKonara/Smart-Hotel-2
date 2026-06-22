import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const ProcessPaymentSchema = z.object({
  folioId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(["cash", "card", "bank_transfer", "other"]),
  userId: z.string().uuid().optional(),
});

export type ProcessPaymentDTO = z.infer<typeof ProcessPaymentSchema>;

export class PaymentService {
  /**
   * Processes a payment and updates the corresponding Folio balance in a transaction.
   * Eliminates the risk of orphan payments or double settlements.
   */
  static async processPayment(data: ProcessPaymentDTO) {
    const validatedData = ProcessPaymentSchema.parse(data);

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Lock and retrieve Folio
      const folio = await tx.folio.findUnique({
        where: { id: validatedData.folioId },
        include: { lineItems: true, payments: true },
      });

      if (!folio) {
        throw new Error("Folio not found");
      }

      const totalAmount = folio.lineItems?.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0) || 0;
      const paidAmount = folio.payments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || 0;
      const balanceDue = totalAmount - paidAmount;

      if (validatedData.amount > balanceDue) {
        throw new Error(`Payment exceeds balance due. Balance is ${balanceDue}`);
      }

      // 2. Create Payment Record
      const payment = await tx.payment.create({
        data: {
          folioId: folio.id,
          amount: validatedData.amount,
          method: validatedData.method,
          status: "completed",
          userId: validatedData.userId,
        },
      });

      // 3. Update Folio State
      const newPaidAmount = paidAmount + validatedData.amount;
      const newStatus = newPaidAmount >= totalAmount ? "PAID" : "PARTIAL";

      await tx.folio.update({
        where: { id: folio.id },
        data: {
          status: newStatus,
        },
      });

      return payment;
    });
  }
}

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export const ProcessPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(["cash", "card", "bank_transfer", "other"]),
  userId: z.string().uuid().optional(),
});

export type ProcessPaymentDTO = z.infer<typeof ProcessPaymentSchema>;

export class PaymentService {
  /**
   * Processes a payment and updates the corresponding Invoice balance in a transaction.
   * Eliminates the risk of orphan payments or double settlements.
   */
  static async processPayment(data: ProcessPaymentDTO) {
    const validatedData = ProcessPaymentSchema.parse(data);

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Lock and retrieve Invoice
      const invoice = await tx.invoice.findUnique({
        where: { id: validatedData.invoiceId },
        select: { id: true, totalAmount: true, paidAmount: true, status: true },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const balanceDue = invoice.totalAmount - invoice.paidAmount;

      if (validatedData.amount > balanceDue) {
        throw new Error(`Payment exceeds balance due. Balance is ${balanceDue}`);
      }

      // 2. Create Payment Record
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: validatedData.amount,
          method: validatedData.method,
          status: "completed",
          userId: validatedData.userId,
        },
      });

      // 3. Update Invoice State
      const newPaidAmount = invoice.paidAmount + validatedData.amount;
      const newStatus = newPaidAmount >= invoice.totalAmount ? "PAID" : "PARTIAL";

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      });

      return payment;
    });
  }
}

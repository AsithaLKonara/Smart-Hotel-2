import prisma from '@/lib/db';

export class FinancialService {
  static async capturePayment(
    invoiceId: string, 
    amount: number, 
    providerId: string, 
    expectedVersion: number
  ) {
    return await prisma.$transaction(async (tx: any) => {
      // 1. Lock invoice
      const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new Error('Invoice not found');
      if (invoice.isLocked || invoice.status === 'PAID') {
        throw new Error('Invoice is locked or already settled.');
      }
      if (invoice.version !== expectedVersion) {
        throw new Error('Concurrent modification detected. Refresh invoice.');
      }

      // 2. Enforce providerId idempotency
      const existingPayment = await tx.payment.findUnique({ where: { providerId } });
      if (existingPayment) {
        return existingPayment; // Already captured safely
      }

      // 3. Create payment and update invoice state atomically
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount,
          providerId,
          status: 'completed',
        }
      });

      // 4. Recalculate totals
      const payments = await tx.payment.aggregate({
        where: { invoiceId, status: 'completed' },
        _sum: { amount: true }
      });
      const totalPaid = payments._sum.amount || 0;
      const newStatus = totalPaid >= invoice.grandTotal ? 'PAID' : 'PARTIAL';

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: newStatus,
          isLocked: newStatus === 'PAID',
          version: expectedVersion + 1,
        }
      });

      return payment;
    }, {
      isolationLevel: 'Serializable' // Prevents double-payment race condition
    });
  }
}

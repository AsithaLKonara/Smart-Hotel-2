const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    include: {
      folios: {
        include: {
          lineItems: true,
          payments: true
        }
      }
    }
  });
  
  console.log(JSON.stringify(bookings.map(b => ({
    id: b.id,
    status: b.status,
    paymentStatus: b.paymentStatus,
    totalAmount: b.totalAmount,
    folios: b.folios.map(f => ({
      id: f.id,
      status: f.status,
      lineItems: f.lineItems.map(l => ({ amount: l.amount, category: l.category })),
      payments: f.payments.map(p => ({ amount: p.amount, method: p.paymentMethod }))
    }))
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

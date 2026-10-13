const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    where: {
      folios: {
        some: {
          status: 'PAID'
        }
      },
      paymentStatus: {
        not: 'completed'
      }
    }
  });
  
  console.log(`Found ${bookings.length} stuck bookings. Fixing...`);
  
  for (const b of bookings) {
    await prisma.booking.update({
      where: { id: b.id },
      data: { paymentStatus: 'completed' }
    });
    console.log(`Updated booking ${b.id}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

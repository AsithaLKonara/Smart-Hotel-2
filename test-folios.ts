import { prisma } from './lib/db';

async function main() {
  try {
    const folios = await prisma.folio.findMany({
      include: { 
        lineItems: true,
        payments: true,
        booking: {
          include: {
            guest: true,
            roomAssignments: {
              include: { room: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`Found ${folios.length} folios`);
    if (folios.length > 0) {
      console.log('Sample Folio:', folios[0].id, 'Status:', folios[0].status, 'Items:', folios[0].lineItems.length);
    }
  } catch (e) {
    console.error(e);
  }
}

main();

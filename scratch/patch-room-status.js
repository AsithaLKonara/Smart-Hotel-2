const { PrismaClient } = require('@prisma/client');

const connectionString = 'postgresql://postgres:dvuNukMUyU$a484@db.deulklnbpohityejtbhz.supabase.co:5432/postgres';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString
    }
  }
});

async function main() {
  console.log('🔌 Aligning room statuses with active checked-in bookings...');
  await prisma.$connect();

  const checkedInBookings = await prisma.booking.findMany({
    where: {
      status: 'CHECKED_IN'
    },
    include: {
      room: true
    }
  });

  console.log(`Found ${checkedInBookings.length} active CHECKED_IN bookings.`);

  for (const booking of checkedInBookings) {
    if (booking.room && booking.room.status !== 'OCCUPIED') {
      console.log(`Updating Room ${booking.room.number} status from ${booking.room.status} to OCCUPIED...`);
      await prisma.room.update({
        where: {
          id: booking.roomId
        },
        data: {
          status: 'OCCUPIED'
        }
      });
    }
  }

  console.log('✅ Room occupancy alignment completed successfully!');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ Room alignment patch failed:', err);
  process.exit(1);
});

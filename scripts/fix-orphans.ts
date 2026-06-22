import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const res = await prisma.$executeRaw`UPDATE "Task" SET "assignedTo" = NULL`;
  console.log('Updated tasks:', res);

  const res2 = await prisma.$executeRaw`UPDATE "Task" SET "roomId" = NULL WHERE "roomId" NOT IN (SELECT id FROM "Room")`;
  console.log('Orphaned room tasks:', res2);
  
  const res3 = await prisma.$executeRaw`UPDATE "Task" SET "bookingId" = NULL WHERE "bookingId" NOT IN (SELECT id FROM "Booking")`;
  console.log('Orphaned booking tasks:', res3);
  
  const res4 = await prisma.$executeRaw`UPDATE "Task" SET "createdBy" = NULL WHERE "createdBy" NOT IN (SELECT id FROM "User")`;
  console.log('Orphaned createdBy tasks:', res4);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

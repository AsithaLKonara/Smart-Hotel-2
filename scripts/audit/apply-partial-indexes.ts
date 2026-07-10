import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Applying Partial Indexes for DB-007...');

  try {
    // Drop existing standard indexes/constraints if they exist
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "User_email_key" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Room_number_key" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Booking_confirmationCode_key" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Booking_source_otaReference_key" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Booking_checkoutRequestId_key" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Payment_providerId_key" CASCADE;`);

    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "User_email_idx" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Room_number_idx" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Booking_confirmationCode_idx" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Booking_source_otaReference_idx" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Booking_checkoutRequestId_idx" CASCADE;`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Payment_providerId_idx" CASCADE;`);

    // Create partial unique indexes
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "User_email_key" ON "User"("email") WHERE "deletedAt" IS NULL;`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Room_number_key" ON "Room"("number") WHERE "deletedAt" IS NULL;`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Booking_confirmationCode_key" ON "Booking"("confirmationCode") WHERE "deletedAt" IS NULL;`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Booking_source_otaReference_key" ON "Booking"("source", "otaReference") WHERE "deletedAt" IS NULL;`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Booking_checkoutRequestId_key" ON "Booking"("checkoutRequestId") WHERE "deletedAt" IS NULL;`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX "Payment_providerId_key" ON "Payment"("providerId") WHERE "deletedAt" IS NULL;`);

    console.log('Successfully applied all partial indexes!');
  } catch (error) {
    console.error('Failed to apply indexes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

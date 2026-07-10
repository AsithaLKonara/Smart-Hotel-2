const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const queries = [
    `DROP INDEX IF EXISTS "Room_number_key" CASCADE;`,
    `DROP INDEX IF EXISTS "Room_number_idx" CASCADE;`,
    `CREATE UNIQUE INDEX "Room_number_key" ON "Room"("number") WHERE "deletedAt" IS NULL;`,
    
    `DROP INDEX IF EXISTS "Booking_confirmationCode_key" CASCADE;`,
    `DROP INDEX IF EXISTS "Booking_confirmationCode_idx" CASCADE;`,
    `CREATE UNIQUE INDEX "Booking_confirmationCode_key" ON "Booking"("confirmationCode") WHERE "deletedAt" IS NULL;`,
    
    `DROP INDEX IF EXISTS "Booking_source_otaReference_key" CASCADE;`,
    `DROP INDEX IF EXISTS "Booking_source_otaReference_idx" CASCADE;`,
    `CREATE UNIQUE INDEX "Booking_source_otaReference_key" ON "Booking"("source", "otaReference") WHERE "deletedAt" IS NULL;`,
    
    `DROP INDEX IF EXISTS "Booking_checkoutRequestId_key" CASCADE;`,
    `DROP INDEX IF EXISTS "Booking_checkoutRequestId_idx" CASCADE;`,
    `CREATE UNIQUE INDEX "Booking_checkoutRequestId_key" ON "Booking"("checkoutRequestId") WHERE "deletedAt" IS NULL;`,
    
    `DROP INDEX IF EXISTS "Payment_providerId_key" CASCADE;`,
    `DROP INDEX IF EXISTS "Payment_providerId_idx" CASCADE;`,
    `CREATE UNIQUE INDEX "Payment_providerId_key" ON "Payment"("providerId") WHERE "deletedAt" IS NULL;`
  ];
  for(let q of queries) {
    try {
      await prisma.$executeRawUnsafe(q);
      console.log("Success: " + q);
    } catch(e) {
      console.log("Failed: " + q + " -> " + e.message);
    }
  }
}
main();

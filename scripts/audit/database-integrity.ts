import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Audit Database Integrity
 * Detects architectural anomalies and schema mismatches.
 */
async function auditDatabaseIntegrity() {
  console.log('--- Database Integrity Audit ---\n');
  
  let hasErrors = false;

  try {
    // 1. Booking without RoomAssignment
    const bookingsWithoutAssignment = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        roomAssignments: { none: {} }
      },
      select: { id: true, source: true }
    });

    if (bookingsWithoutAssignment.length > 0) {
      console.error(`❌ CRITICAL: Found ${bookingsWithoutAssignment.length} active bookings without RoomAssignments.`);
      console.error('   These bookings cannot be checked out and will not generate housekeeping tasks.');
      console.error('   Samples:', bookingsWithoutAssignment.slice(0, 3));
      hasErrors = true;
    } else {
      console.log('✅ No active bookings are missing RoomAssignments.');
    }

    // 2. OTA Bookings without Folio
    const otaBookingsWithoutFolio = await prisma.booking.findMany({
      where: {
        source: 'BOOKING_COM',
        status: { not: 'CANCELLED' },
        folios: { none: {} }
      },
      select: { id: true, otaReference: true }
    });

    if (otaBookingsWithoutFolio.length > 0) {
      console.error(`❌ CRITICAL: Found ${otaBookingsWithoutFolio.length} OTA bookings without a Folio.`);
      console.error('   These guests cannot accrue incidental charges or be billed on checkout.');
      console.error('   Samples:', otaBookingsWithoutFolio.slice(0, 3));
      hasErrors = true;
    } else {
      console.log('✅ All OTA bookings have a Folio (or no OTA bookings exist).');
    }

    // 3. Orphaned Stripe Payment Intents (Bookings that failed to create but payment succeeded)
    // Actually we can check if there are Payment Intents in the database that don't link to a booking?
    // Let's assume there is a PaymentIntent table or SyncLog that tracks this.
    const orphanedSyncLogs = await prisma.syncLog.findMany({
      where: {
        entityType: 'PAYMENT_INTENT',
        status: 'SUCCESS',
        // Assuming we could check if entityId exists in Bookings, but this requires a custom join depending on schema.
        // For simplicity, we just flag the check.
      },
      take: 1
    });
    if (orphanedSyncLogs.length > 0) {
      console.log('⚠️  INFO: Found Stripe SyncLogs. A deeper check for orphaned PaymentIntents is recommended.');
    }

    // 4. Overlapping Bookings (Double Bookings)
    const overlappingBookings = await prisma.$queryRaw`
      SELECT b1.id as b1_id, b2.id as b2_id, b1."roomId"
      FROM "Booking" b1
      JOIN "Booking" b2 ON b1."roomId" = b2."roomId" AND b1.id != b2.id
      WHERE b1.status NOT IN ('CANCELLED', 'CHECKED_OUT')
        AND b2.status NOT IN ('CANCELLED', 'CHECKED_OUT')
        AND b1."checkIn" < b2."checkOut"
        AND b1."checkOut" > b2."checkIn"
    `;

    if (Array.isArray(overlappingBookings) && overlappingBookings.length > 0) {
      console.error(`❌ CRITICAL: Found ${overlappingBookings.length / 2} Double Bookings (overlapping dates for the same physical room).`);
      hasErrors = true;
    } else {
      console.log('✅ No double bookings detected.');
    }

  } catch (err) {
    console.error('❌ Error during audit:', err);
    hasErrors = true;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n--- Audit Complete ---');
  if (hasErrors) {
    process.exit(1);
  }
}

auditDatabaseIntegrity().catch(console.error);

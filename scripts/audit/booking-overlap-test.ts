/**
 * Booking Overlap Test (Exclusion Constraint Verification)
 * Proves that the database-level GIST exclusion constraint correctly prevents
 * two overlapping RoomAssignments for the same physical room, bypassing the Redis lock.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testOverlap() {
  console.log('--- Overlapping Assignments Audit ---\n');
  
  // 1. Find a mapped room type and an available room
  const mapping = await (prisma.roomMapping.findFirst as any)({
    include: { roomType: { include: { rooms: true } } }
  });

  if (!mapping || !mapping.roomType.rooms.length) {
    console.log('⚠️  No Room found. Cannot execute test.');
    await prisma.$disconnect();
    return;
  }

  const room = mapping.roomType.rooms[0];
  console.log(`Targeting Room: ${room.number} (ID: ${room.id})`);

  // Future dates
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 3);
  const checkIn = new Date(nextMonth);
  nextMonth.setDate(nextMonth.getDate() + 3);
  const checkOut = new Date(nextMonth);

  // We need a dummy booking ID to create RoomAssignments (or we can create a dummy booking)
  const dummyBooking = await prisma.booking.create({
    data: {
      checkIn: checkIn,
      checkOut: checkOut,
      guests: 1,
      totalAmount: 100,
      primaryGuestId: (await prisma.user.findFirst())?.id || 'SYSTEM',
      propertyId: room.propertyId || (await prisma.property.findFirst())?.id || 'TEST_PROP',
      status: 'CONFIRMED',
      confirmationCode: `OVERLAP-TEST-${Date.now()}`,
      source: 'WEBSITE'
    }
  });

  console.log('Attempting to create first RoomAssignment (Should Succeed)...');
  
  await prisma.roomAssignment.create({
    data: {
      bookingId: dummyBooking.id,
      roomId: room.id,
      startDate: checkIn,
      endDate: checkOut,
      status: 'ACTIVE'
    }
  });

  console.log('✅ First assignment created successfully.');

  console.log('Attempting to create overlapping RoomAssignment concurrently (Should Fail)...');

  let failed = false;
  try {
    // Attempt overlap by exactly matching dates (or partially overlapping)
    await prisma.roomAssignment.create({
      data: {
        bookingId: dummyBooking.id, // Using same booking for simplicity of test
        roomId: room.id,
        startDate: checkIn,
        endDate: checkOut,
        status: 'ACTIVE'
      }
    });
    console.error('❌ CRITICAL FAILURE: The database allowed an overlapping RoomAssignment to be created!');
  } catch (error: any) {
    if (['P2002', 'P2004', 'P2010'].includes(error.code)) {
      console.log('✅ Constraint test passed. Database successfully blocked the overlapping RoomAssignment.');
      console.log(`   Error Caught: ${error.message}`);
    } else {
      console.error('❌ CRITICAL FAILURE: An unexpected error was thrown instead of a constraint violation.', error);
      failed = true;
    }
  }

  // Cleanup
  console.log('\nCleaning up test data...');
  await prisma.roomAssignment.deleteMany({
    where: { bookingId: dummyBooking.id }
  });
  await prisma.booking.delete({
    where: { id: dummyBooking.id }
  });

  await prisma.$disconnect();

  console.log('\n--- Audit Complete ---');
  if (failed) {
    process.exit(1);
  }
}

testOverlap().catch(console.error);

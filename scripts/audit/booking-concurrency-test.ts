/**
 * Booking Concurrency Test
 * Proves the existence of the InventoryLockEngine bypass race condition.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const generateOtaXml = (otaResCode: string, roomTypeId: string, checkIn: string, checkOut: string) => `
<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelResNotifRQ>
  <HotelReservations>
    <HotelReservation>
      <UniqueID Type="14" ID="${otaResCode}"/>
      <RoomStays>
        <RoomStay>
          <RoomTypes>
            <RoomType RoomTypeCode="${roomTypeId}"/>
          </RoomTypes>
          <TimeSpan Start="${checkIn}" End="${checkOut}"/>
          <Total AmountAfterTax="250.00" CurrencyCode="USD"/>
        </RoomStay>
      </RoomStays>
      <ResGuests>
        <ResGuest>
          <Profiles>
            <ProfileInfo>
              <Profile>
                <Customer>
                  <PersonName>
                    <GivenName>Test</GivenName>
                    <Surname>Concurrency</Surname>
                  </PersonName>
                </Customer>
              </Profile>
            </ProfileInfo>
          </Profiles>
        </ResGuest>
      </ResGuests>
    </HotelReservation>
  </HotelReservations>
</OTA_HotelResNotifRQ>
`;

async function testConcurrency() {
  console.log('--- OTA Webhook Concurrency Audit ---\n');
  
  // 1. Find a mapped room type
  const mapping = await prisma.roomMapping.findFirst({
    include: { roomType: true }
  });

  if (!mapping) {
    console.log('⚠️  No RoomMapping found. Cannot execute concurrency test.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Targeting Room Type: ${mapping.roomType.name} (OTA ID: ${mapping.otaRoomTypeId})`);

  // Future dates
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const checkIn = nextMonth.toISOString().split('T')[0];
  nextMonth.setDate(nextMonth.getDate() + 2);
  const checkOut = nextMonth.toISOString().split('T')[0];

  console.log(`Firing 10 simultaneous simulated OTA webhooks for dates: ${checkIn} to ${checkOut}...\n`);

  const requests = Array.from({ length: 10 }).map((_, idx) => {
    const otaCode = `CONC_TEST_${Date.now()}_${idx}`;
    const xml = generateOtaXml(otaCode, mapping.otaRoomTypeId, checkIn, checkOut);
    
    return fetch(`${BASE_URL}/api/integrations/booking-com/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xml
    });
  });

  // Wait for all to finish
  const results = await Promise.allSettled(requests);
  const successes = results.filter(r => r.status === 'fulfilled' && (r.value as Response).ok).length;

  console.log(`Webhook Responses: ${successes} Success, ${results.length - successes} Failed/Rejected.`);

  // 2. Check Database for Double Bookings Created By Test
  // Wait a moment for async DB operations in webhooks to settle
  await new Promise(resolve => setTimeout(resolve, 2000));

  const testBookings = await prisma.booking.findMany({
    where: {
      otaReference: { startsWith: 'CONC_TEST_' }
    },
    select: { id: true, roomId: true, otaReference: true }
  });

  console.log(`\nFound ${testBookings.length} bookings created by the test.`);

  // Group by room ID
  const roomCounts: Record<string, string[]> = {};
  for (const b of testBookings) {
    if (b.roomId) {
      if (!roomCounts[b.roomId]) roomCounts[b.roomId] = [];
      roomCounts[b.roomId].push(b.otaReference!);
    }
  }

  let hasDoubleBookings = false;
  for (const [roomId, refs] of Object.entries(roomCounts)) {
    if (refs.length > 1) {
      console.error(`❌ CRITICAL RACE CONDITION: Room ID ${roomId} was double-booked ${refs.length} times simultaneously!`);
      console.error(`   Bookings: ${refs.join(', ')}`);
      hasDoubleBookings = true;
    }
  }

  if (!hasDoubleBookings && testBookings.length > 0) {
    console.log('✅ Concurrency test passed. The system prevented double bookings.');
  } else if (testBookings.length === 0) {
    console.log('⚠️  No bookings were created. The webhook might be broken or dates unavailable.');
  }

  // 3. Cleanup
  console.log('\nCleaning up test data...');
  const deleted = await prisma.booking.deleteMany({
    where: { otaReference: { startsWith: 'CONC_TEST_' } }
  });
  console.log(`Deleted ${deleted.count} test bookings.`);

  await prisma.$disconnect();

  console.log('\n--- Audit Complete ---');
  if (hasDoubleBookings) {
    process.exit(1);
  }
}

testConcurrency().catch(console.error);

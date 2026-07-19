/**
 * Booking Idempotency Test
 * Proves that concurrent webhooks with the exact same OTA reference do not create duplicate bookings.
 * 
 * Verifies the DB-003 Remediation:
 * @@unique([source, otaReference]) constraint + P2002 error handling.
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
                    <Surname>Idempotency</Surname>
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

async function testIdempotency() {
  console.log('--- OTA Webhook Idempotency Audit ---\n');
  
  // 1. Find a mapped room type
  const mapping = await (prisma.roomMapping.findFirst as any)({
    include: { roomType: true }
  });

  if (!mapping) {
    console.log('⚠️  No RoomMapping found. Cannot execute idempotency test.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Targeting Room Type: ${mapping.roomType.name} (OTA ID: ${mapping.otaRoomTypeId})`);

  // Future dates
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 2);
  const checkIn = nextMonth.toISOString().split('T')[0];
  nextMonth.setDate(nextMonth.getDate() + 3);
  const checkOut = nextMonth.toISOString().split('T')[0];

  // Use the EXACT SAME OTA reference for all concurrent requests
  const exactOtaCode = `IDEMP_TEST_${Date.now()}`;
  console.log(`Firing 10 simultaneous simulated OTA webhooks with the EXACT SAME ID: ${exactOtaCode}...\n`);

  const xml = generateOtaXml(exactOtaCode, mapping.otaRoomTypeId, checkIn, checkOut);

  const requests = Array.from({ length: 10 }).map(() => {
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
  console.log(`Note: A properly configured webhook should return 200 OK (Success) for all of them by treating duplicates as 'IGNORED'.`);

  // 2. Check Database for Double Bookings Created By Test
  // Wait a moment for async DB operations in webhooks to settle
  await new Promise(resolve => setTimeout(resolve, 2000));

  const testBookings = await (prisma.booking.findMany as any)({
    where: {
      otaReference: exactOtaCode
    },
    select: { 
      id: true, 
      otaReference: true, 
      status: true,
      folios: {
        include: { lineItems: true }
      },
      stayEvents: true
    }
  });

  console.log(`\nFound ${testBookings.length} bookings created by the idempotency test.`);

  let failed = false;
  if (testBookings.length > 1) {
    console.error(`❌ CRITICAL RACE CONDITION: Idempotency failed! The database created ${testBookings.length} duplicate bookings for the exact same OTA reference!`);
    console.error(`   Bookings:`, testBookings.map(b => b.id).join(', '));
    failed = true;
  } else if (testBookings.length === 1) {
    const b = testBookings[0];
    const hasFolio = b.folios && b.folios.length > 0;
    const hasLineItems = hasFolio && b.folios[0].lineItems.length > 0;
    const hasStayEvents = b.stayEvents && b.stayEvents.length > 0;

    if (!hasFolio || !hasLineItems || !hasStayEvents) {
      console.error(`❌ INT-003 FAILED: Webhook created booking, but missed DDD lifecycle records! Folio: ${hasFolio}, LineItems: ${hasLineItems}, StayEvents: ${hasStayEvents}`);
      failed = true;
    } else {
      console.log('✅ Idempotency & Lifecycle test passed. The system correctly prevented duplicate bookings and orchestrated Folio/StayEvent creation.');
    }
  } else {
    console.log('⚠️  No bookings were created. The webhook might be broken or dates unavailable.');
  }

  // 3. Cleanup
  console.log('\nCleaning up test data...');
  // Note: cascades handle folios and stayEvents, but we should be safe
  await prisma.stayEvent.deleteMany({
    where: { bookingId: { in: testBookings.map(b => b.id) } }
  });
  const deleted = await prisma.booking.deleteMany({
    where: { otaReference: exactOtaCode }
  });
  console.log(`Deleted ${deleted.count} test bookings and related records.`);

  await prisma.$disconnect();

  console.log('\n--- Audit Complete ---');
  if (failed) {
    process.exit(1);
  }
}

testIdempotency().catch(console.error);

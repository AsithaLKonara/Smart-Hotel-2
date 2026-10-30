import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/db';
import { loginAs } from '../utils/auth-helpers';

test.describe.serial('Domain 2 Booking: Availability & Concurrency Locks', () => {
  let targetRoomId: string;
  let targetRoomNumber: string;
  let propertyId: string;

  test.beforeAll(async () => {
    // Pick an available room from Grand Ocean Resort
    const room = await prisma.room.findFirst({
      where: {
        propertyId: '579ecf1a-5350-42ea-af32-c10397417589',
        status: 'AVAILABLE'
      },
      include: {
        roomType: true,
        property: true
      }
    });

    if (!room) {
      throw new Error('No available room found in Grand Ocean Resort for testing.');
    }

    targetRoomId = room.id;
    targetRoomNumber = room.number;
    propertyId = room.propertyId;
  });

  test('Availability API correctly returns available room and specifications', async ({ request }) => {
    const checkIn = '2028-06-10T14:00:00.000Z';
    const checkOut = '2028-06-12T10:00:00.000Z';

    const res = await request.get(`/api/rooms/check-availability?checkIn=${checkIn}&checkOut=${checkOut}&propertyId=${propertyId}`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.availableRooms)).toBe(true);

    const found = data.availableRooms.find((r: any) => r.id === targetRoomId);
    expect(found).toBeDefined();
    expect(found.number).toBe(targetRoomNumber);
    expect(found.roomType).toBeDefined();
    expect(Number(found.roomType.baseRate)).toBeGreaterThan(0);
  });

  test('Double Booking Prevention - Strict PostgreSQL Row Locks & Concurrency', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST');

    const concurrentRequests = 5;
    // Generate a unique pristine date slot in the future to avoid collision with prior test runs
    const futureDays = Math.floor(Math.random() * 300) + 1500;
    const start = new Date(Date.now() + futureDays * 86400000);
    const end = new Date(start.getTime() + 3 * 86400000);
    const uniqueCheckIn = start.toISOString();
    const uniqueCheckOut = end.toISOString();

    const payload = {
      roomId: targetRoomId,
      checkIn: uniqueCheckIn,
      checkOut: uniqueCheckOut,
      guests: 2,
      guestName: 'Concurrency Test Guest',
      guestEmail: 'concurrency.tester@smarthotel.local',
      guestPhone: '+1-555-0199',
      paymentMethod: 'pay_later'
    };

    const responses = await Promise.all(
      Array.from({ length: concurrentRequests }).map(() =>
        page.request.post('/api/bookings', {
          data: payload,
          timeout: 35000
        })
      )
    );

    const statuses = responses.map(r => r.status());
    const bodies = await Promise.all(responses.map(async r => {
      try { return await r.json(); } catch { return await r.text(); }
    }));
    console.log('CONCURRENT_RESPONSES:', { statuses, bodies });

    // Exactly ONE request must succeed (201 Created)
    const successes = statuses.filter(s => s === 201).length;
    // The other requests must be rejected with 409 Conflict, 400 Bad Request, or 429 Rate Limited
    const rejected = statuses.filter(s => s === 409 || s === 400 || s === 429).length;

    expect(statuses.length).toBe(concurrentRequests);
    expect(successes).toBe(1);
    expect(rejected).toBe(concurrentRequests - 1);

    // Verify availability API now omits this room for the overlapping dates
    const availRes = await page.request.get(`/api/rooms/check-availability?checkIn=${uniqueCheckIn}&checkOut=${uniqueCheckOut}&propertyId=${propertyId}`);
    expect(availRes.status()).toBe(200);
    const availData = await availRes.json();
    const stillAvailable = availData.availableRooms.some((r: any) => r.id === targetRoomId);
    expect(stillAvailable).toBe(false);
  });
});

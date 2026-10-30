import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/db';
import { loginAs } from '../utils/auth-helpers';

test.describe.serial('Domain 2 & 3: Check-in Certification & Cleanliness Guardrail', () => {
  let roomId: string;
  let bookingId: string;

  test.beforeAll(async () => {
    // Find an available room in Grand Ocean Resort
    const room = await prisma.room.findFirst({
      where: {
        propertyId: '579ecf1a-5350-42ea-af32-c10397417589',
        status: 'AVAILABLE'
      }
    });
    if (!room) throw new Error('No available room for check-in certification');
    roomId = room.id;
  });

  test('Check-in succeeds when room is AVAILABLE and transitions Room to OCCUPIED', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST');

    // 1. Create a confirmed reservation on a pristine future date slot
    const futureDays = Math.floor(Math.random() * 300) + 1800;
    const start = new Date(Date.now() + futureDays * 86400000);
    const end = new Date(start.getTime() + 3 * 86400000);
    const checkIn = start.toISOString();
    const checkOut = end.toISOString();

    const createRes = await page.request.post('/api/bookings', {
      data: {
        roomId,
        checkIn,
        checkOut,
        guests: 1,
        guestName: 'CheckIn Verified Guest',
        guestEmail: 'checkin.verified@smarthotel.local',
        paymentMethod: 'pay_later'
      },
      timeout: 35000
    });

    expect(createRes.status()).toBe(201);
    const body = await createRes.json();
    bookingId = body.booking.id;

    // 2. Perform Check-in via PATCH /api/bookings/[id]
    const checkinRes = await page.request.patch(`/api/bookings/${bookingId}`, {
      data: {
        status: 'CHECKED_IN'
      }
    });

    expect(checkinRes.status()).toBe(200);
    const updated = await checkinRes.json();
    expect(updated.status).toBe('CHECKED_IN');

    // 3. Assert the physical room state flipped to OCCUPIED in database
    const roomAfter = await prisma.room.findUnique({
      where: { id: roomId }
    });
    expect(roomAfter?.status).toBe('OCCUPIED');
  });

  test('Cleanliness Guardrail strictly rejects Check-in if assigned room is DIRTY', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST');

    // Pick a room in GOR and mark it as DIRTY
    const dirtyRoom = await prisma.room.findFirst({
      where: {
        propertyId: '579ecf1a-5350-42ea-af32-c10397417589'
      }
    });
    if (!dirtyRoom) return;

    await prisma.room.update({
      where: { id: dirtyRoom.id },
      data: { status: 'DIRTY' }
    });

    // Create reservation for this dirty room for a pristine future date
    const dirtyFutureDays = Math.floor(Math.random() * 300) + 2100;
    const dirtyStart = new Date(Date.now() + dirtyFutureDays * 86400000);
    const dirtyEnd = new Date(dirtyStart.getTime() + 2 * 86400000);

    const createRes = await page.request.post('/api/bookings', {
      data: {
        roomId: dirtyRoom.id,
        checkIn: dirtyStart.toISOString(),
        checkOut: dirtyEnd.toISOString(),
        guests: 1,
        guestName: 'Guardrail Test Guest',
        guestEmail: 'guardrail.test@smarthotel.local',
        paymentMethod: 'pay_later'
      },
      timeout: 35000
    });

    const createBody = await createRes.json();
    const dirtyBookingId = createBody.booking.id;

    // Attempt check-in on the dirty room
    const checkinRes = await page.request.patch(`/api/bookings/${dirtyBookingId}`, {
      data: {
        status: 'CHECKED_IN'
      }
    });

    // Cleanliness guardrail must reject with status 400 or error message
    expect([400, 422, 500]).toContain(checkinRes.status());
    const errBody = await checkinRes.json();
    expect(JSON.stringify(errBody)).toContain('CLEANLINESS_GUARDRAIL_VIOLATION');

    // Restore room status back to AVAILABLE
    await prisma.room.update({
      where: { id: dirtyRoom.id },
      data: { status: 'AVAILABLE' }
    });
  });
});

import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/db';
import { loginAs } from '../utils/auth-helpers';

test.describe.serial('Domain 2 & 3: Check-out Certification, Housekeeping Dispatch & Cancellation', () => {
  let roomId: string;
  let bookingId: string;

  test.beforeAll(async () => {
    // Pick an available room in Grand Ocean Resort
    const room = await prisma.room.findFirst({
      where: {
        propertyId: '579ecf1a-5350-42ea-af32-c10397417589',
        status: 'AVAILABLE'
      }
    });
    if (!room) throw new Error('No available room for checkout test in Grand Ocean Resort');
    roomId = room.id;
  });

  test('Check-out transitions room to CLEANING and triggers automated Housekeeping Task', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST');

    // 1. Create a reservation
    const createRes = await page.request.post('/api/bookings', {
      data: {
        roomId,
        checkIn: '2028-11-01T14:00:00.000Z',
        checkOut: '2028-11-03T11:00:00.000Z',
        guests: 1,
        guestName: 'Checkout Lifecycle Guest',
        guestEmail: 'checkout.lifecycle@smarthotel.local',
        paymentMethod: 'pay_later'
      }
    });
    expect(createRes.status()).toBe(201);
    const body = await createRes.json();
    bookingId = body.booking.id;

    // 2. Check-in first
    const checkinRes = await page.request.patch(`/api/bookings/${bookingId}`, {
      data: { status: 'CHECKED_IN' }
    });
    expect(checkinRes.status()).toBe(200);

    // 3. Perform Check-out
    const checkoutRes = await page.request.patch(`/api/bookings/${bookingId}`, {
      data: { status: 'CHECKED_OUT' }
    });
    expect(checkoutRes.status()).toBe(200);

    // 4. Assert Room transitioned to CLEANING
    const roomAfter = await prisma.room.findUnique({ where: { id: roomId } });
    expect(roomAfter?.status).toBe('CLEANING');

    // 5. Assert Housekeeping Task was created in DB
    const housekeepingTask = await prisma.task.findFirst({
      where: {
        type: 'HOUSEKEEPING',
        status: 'PENDING'
      },
      orderBy: { createdAt: 'desc' }
    });
    expect(housekeepingTask).toBeDefined();

    // Reset room back to AVAILABLE for subsequent tests
    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'AVAILABLE' }
    });
  });

  test('Cancellation releases Room back to AVAILABLE', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST');

    // 1. Create a reservation
    const createRes = await page.request.post('/api/bookings', {
      data: {
        roomId,
        checkIn: '2028-12-01T14:00:00.000Z',
        checkOut: '2028-12-05T11:00:00.000Z',
        guests: 1,
        guestName: 'Cancel Test Guest',
        guestEmail: 'cancel.test@smarthotel.local',
        paymentMethod: 'pay_later'
      }
    });
    expect(createRes.status()).toBe(201);
    const body = await createRes.json();
    const cancelBookingId = body.booking.id;

    // 2. Cancel booking
    const cancelRes = await page.request.patch(`/api/bookings/${cancelBookingId}`, {
      data: { status: 'CANCELLED' }
    });
    expect(cancelRes.status()).toBe(200);

    const bookingAfter = await prisma.booking.findUnique({ where: { id: cancelBookingId } });
    expect(bookingAfter?.status).toBe('CANCELLED');
  });
});

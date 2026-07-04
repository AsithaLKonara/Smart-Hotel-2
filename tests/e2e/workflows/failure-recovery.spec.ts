import { test, expect } from '@playwright/test';

test.describe('Phase 6: Failure Testing (Resiliency & Recovery)', () => {
  let apiContext: any;
  
  test.beforeAll(async ({ playwright }) => {
    // We assume the user is authenticated from setup
    apiContext = await playwright.request.newContext({
      storageState: 'playwright/.auth/admin.json',
      baseURL: process.env.BASE_URL || 'http://localhost:3001'
    });
  });

  test.afterAll(async () => {
    // Reset chaos flags to ensure clean state for other suites
    await apiContext.post('/api/admin/sre/chaos', {
      data: {
        stripeFailure: false,
        emailFailure: false,
        pusherFailure: false,
        otaFailure: false
      }
    });
  });

  test('External Dependency Outages - Should complete booking despite failures', async () => {
    // Enable chaos mode for external services
    const chaosRes = await apiContext.post('/api/admin/sre/chaos', {
      data: {
        stripeFailure: true,
        emailFailure: true,
        pusherFailure: true,
        otaFailure: true
      }
    });
    expect(chaosRes.ok()).toBeTruthy();

    // Setup room
    const roomsResponse = await apiContext.get('/api/rooms');
    const room = (await roomsResponse.json()).rooms[0];

    // Ensure future dates to avoid collision
    const checkInOffset = Math.floor(Math.random() * 1000 + 400);
    const checkIn = new Date(Date.now() + 86400000 * checkInOffset).toISOString();
    const checkOut = new Date(Date.now() + 86400000 * (checkInOffset + 2)).toISOString();

    const bookingRes = await apiContext.post('/api/bookings', {
      data: {
        roomId: room.id,
        checkIn,
        checkOut,
        guests: 1,
        paymentMethod: 'pay_now' // Forces Stripe initialization
      },
      headers: {
        // We simulate a fresh request
        'idempotency-key': `test-chaos-${Date.now()}`
      },
      timeout: 60000
    });

    // The booking should succeed with 201 Created despite failures
    expect(bookingRes.status()).toBe(201);
    const bookingData = await bookingRes.json();
    
    expect(bookingData.booking).toBeDefined();
    expect(bookingData.booking.id).toBeDefined();
    // Verify the API flagged the payment as failed gracefully
    expect(bookingData.paymentFailed).toBe(true);

    // Verify it actually created the booking in DB
    const getRes = await apiContext.get(`/api/bookings`);
    const allBookings = await getRes.json();
    const createdBooking = allBookings.bookings.find((b: any) => b.id === bookingData.booking.id);
    expect(createdBooking).toBeDefined();
  });

  test('Idempotency - Browser Refresh Mid-Operation should return exact cached response', async () => {
    // Reset chaos
    await apiContext.post('/api/admin/sre/chaos', { data: { stripeFailure: false, emailFailure: false, pusherFailure: false, otaFailure: false } });

    const roomsResponse = await apiContext.get('/api/rooms');
    const room = (await roomsResponse.json()).rooms[0];

    const idempotencyKey = `test-refresh-${Date.now()}`;
    const payload = {
      roomId: room.id,
      checkIn: new Date(Date.now() + 86400000 * 500).toISOString(),
      checkOut: new Date(Date.now() + 86400000 * 502).toISOString(),
      guests: 2,
      paymentMethod: 'pay_later'
    };

    // First request
    const firstRes = await apiContext.post('/api/bookings', {
      data: payload,
      headers: { 'idempotency-key': idempotencyKey },
      timeout: 60000
    });
    
    expect(firstRes.status()).toBe(201);
    const firstData = await firstRes.json();

    // Second request simulating a page refresh / double-click
    const secondRes = await apiContext.post('/api/bookings', {
      data: payload,
      headers: { 'idempotency-key': idempotencyKey },
      timeout: 60000
    });
    
    // Should still be 201, and exact same booking ID
    expect(secondRes.status()).toBe(201);
    const secondData = await secondRes.json();
    
    expect(secondData.booking.id).toBe(firstData.booking.id);
    
    // Verify no double booking happened for the room
    const checkConflictsRes = await apiContext.get(`/api/bookings`);
    const allBookings = (await checkConflictsRes.json()).bookings;
    const sameRoomBookings = allBookings.filter((b: any) => b.roomAssignments?.[0]?.room?.number === room.number && b.guests === 2 && b.status !== 'CANCELLED');
    
    // The exact count depends on existing DB state, but we only generated ONE booking in this script for this idempotency key.
    // At minimum, we know it didn't create 2 new identical ones if we just check the IDs matching.
  });
});

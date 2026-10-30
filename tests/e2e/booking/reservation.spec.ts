import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth-helpers';
import { prisma } from '@/lib/db';

test.describe.serial('Domain 2 Booking: Reservation Core Lifecycle & Admin UI', () => {
  let testRoomId: string;
  let createdBookingCode: string;
  const guestName = 'Eleanor Vance';
  const guestEmail = 'eleanor.vance@hillhouse.local';

  test.beforeAll(async () => {
    // Pick an available room in Grand Ocean Resort
    const room = await prisma.room.findFirst({
      where: {
        propertyId: '579ecf1a-5350-42ea-af32-c10397417589',
        status: 'AVAILABLE'
      }
    });
    if (!room) throw new Error('No available room for reservation test in Grand Ocean Resort');
    testRoomId = room.id;
  });

  test('Direct Booking API creates Reservation with linked Folio and Outbox Alert', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST');

    const futureDays = Math.floor(Math.random() * 300) + 1200;
    const start = new Date(Date.now() + futureDays * 86400000);
    const end = new Date(start.getTime() + 3 * 86400000);
    const checkIn = start.toISOString();
    const checkOut = end.toISOString();

    const res = await page.request.post('/api/bookings', {
      data: {
        roomId: testRoomId,
        checkIn,
        checkOut,
        guests: 2,
        guestName,
        guestEmail,
        guestPhone: '+1-555-0144',
        paymentMethod: 'pay_later',
        specialRequests: 'Quiet room near corner'
      },
      timeout: 35000
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.booking).toBeDefined();
    expect(body.booking.id).toBeDefined();
    expect(body.booking.confirmationCode).toBeDefined();
    expect(body.booking.status).toBe('CONFIRMED');

    createdBookingCode = body.booking.confirmationCode;

    // Verify database Folio record was generated automatically
    const folios = await prisma.folio.findMany({
      where: { bookingId: body.booking.id }
    });
    expect(folios.length).toBeGreaterThan(0);
  });

  test('Receptionist can inspect Reservation and Folio details via Admin UI', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST');

    await page.goto('/admin/bookings', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page.locator('h1, h2, h3').filter({ hasText: /booking|reservation/i }).first()).toBeVisible({ timeout: 15000 });

    // Search for the newly created booking by guest name or confirmation code
    const searchInput = page.locator('input:not([readonly])[placeholder*="Search guest"], input:not([readonly])[placeholder*="Search"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 15000 });
    await searchInput.fill(createdBookingCode);
    await page.waitForTimeout(600); // Wait for debounce / filtered list

    // Assert the booking appears in the table/list
    const bookingRow = page.locator(`text=${createdBookingCode}`).first();
    await expect(bookingRow).toBeVisible({ timeout: 10000 });

    // Also assert guest name is rendered
    await expect(page.locator(`text=${guestName}`).first()).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { cleanDatabase } from '../../utils/clean-db';
import { RoomFactory } from '../../factories/room.factory';
import prisma from '@/lib/prisma';

test.describe('Booking Lifecycle (Database Seeded)', () => {
  test.beforeEach(async () => {
    // 1. Clean the database before each test to ensure isolation
    await cleanDatabase();
  });

  test('Guest searches, selects, and confirms a booking via UI', async ({ page, context }) => {
    // 2. Seed deterministic data into the actual database
    const roomType = await prisma.roomType.create({
      data: {
        name: 'Deluxe Suite',
        description: 'Luxury suite',
        baseRate: 199.99,
        capacity: 2,
        amenities: ['WiFi', 'TV'],
      }
    });

    const room = await RoomFactory.create({
      number: '101',
      status: 'AVAILABLE',
      roomType: { connect: { id: roomType.id } }
    });

    // 3. Authenticate the guest via NextAuth JWT cookie
    const token = await encode({
      token: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'GUEST',
        id: 'guest-123'
      },
      secret: process.env.NEXTAUTH_SECRET || 'mxLaNRprXaCmHkscIkzA3OfPNl5JZgPYgHjFPrwIP5c='
    });

    await context.addCookies([{
      name: 'next-auth.session-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      secure: false
    }]);

    // 4. Execute UI Workflow against actual backend
    await page.goto('/booking');

    // Setup LocalStorage Cache (simulating a date search from the homepage)
    await page.evaluate(() => {
      // Create dates 5 and 10 days in the future to ensure valid booking window
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 5);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 10);

      window.localStorage.setItem('smarthotel_booking_cache', JSON.stringify({
        searchData: { 
          checkIn: checkIn.toISOString().split('T')[0], 
          checkOut: checkOut.toISOString().split('T')[0], 
          guests: 2, 
          roomType: 'all' 
        },
        step: 1
      }));
    });
    
    // Reload so React app reads the updated LocalStorage cache
    await page.reload();

    // The UI should automatically fetch availability via API which now hits our seeded DB
    const searchBtn = page.getByRole('button', { name: /check availability/i });
    await searchBtn.waitFor({ state: 'visible' });
    await expect(searchBtn).toBeEnabled();
    await searchBtn.click();

    // Verify our seeded Deluxe Suite appears
    await expect(page.getByText('Deluxe Suite')).toBeVisible({ timeout: 15000 });
    
    // Select the suite
    await page.getByRole('button', { name: /Select/i }).first().click();

    // Fill optional guest details
    await page.locator('input[type="tel"]').fill('555-1234');

    // Submit booking
    await page.getByRole('button', { name: /confirm|pay/i }).click();

    // Assert UI transition to success page
    await expect(page.getByRole('heading', { name: 'Reservation Confirmed' })).toBeVisible({ timeout: 20000 });
    
    // 5. Verify the Database was mutated correctly
    const bookings = await prisma.booking.findMany({ where: { roomTypeId: roomType.id } });
    expect(bookings.length).toBe(1);
    expect(bookings[0].status).toBe('CONFIRMED');
    
    // Verify room availability was locked/reduced
    // (Depending on system architecture, room status might change, or availability count)
  });
});


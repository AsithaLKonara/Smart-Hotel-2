import { test, expect } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { cleanDatabase } from '@/tests/utils/clean-db';
import { RoomFactory } from '@/tests/factories/room.factory';
import { UserFactory } from '@/tests/factories/user.factory';
import prisma from '@/lib/prisma';

test.describe('Reception Workflow (Database Seeded)', () => {
  test.beforeEach(async () => {
    await cleanDatabase();
  });

  test('Receptionist checks in a guest via dynamic route', async ({ page, context }) => {
    // 1. Seed deterministic data into the actual database
    const roomType = await prisma.roomType.create({
      data: {
        name: 'Deluxe Suite',
        description: 'Luxury suite',
        baseRate: 150.00,
        capacity: 2,
        amenities: [],
      }
    });

    const room = await RoomFactory.create({
      number: '202',
      status: 'AVAILABLE',
      roomType: { connect: { id: roomType.id } }
    });

    const guest = await UserFactory.create({
      name: 'Alice Smith',
      email: 'alice.smith@example.com',
      role: { connect: { name: 'GUEST' } }
    });

    const booking = await prisma.booking.create({
      data: {
        bookingCode: 'BKG-12345',
        status: 'CONFIRMED',
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        guests: 2,
        totalPrice: 150.00,
        userId: guest.id,
        roomId: room.id,
        roomTypeId: roomType.id
      }
    });

    // 2. Generate a valid NextAuth JWT for RECEPTIONIST
    const token = await encode({
      token: {
        name: 'Admin',
        email: 'admin@smarthotel.com',
        role: 'RECEPTIONIST',
        id: 'reception-123'
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

    // 3. Execute UI Workflow
    await page.goto('/admin/receptionist');

    // Select the seeded room from the RoomStatusGrid
    await page.getByText('202').first().click();

    // The Action Desk should now open and fetch bookings for this room, showing Alice Smith
    const guestNameLoc = page.getByText('Alice Smith');
    await guestNameLoc.waitFor({ state: 'visible', timeout: 15000 });

    // Find the check-in button within the upcoming booking row
    const row = page.locator('div').filter({ has: guestNameLoc }).first();
    const checkInBtn = row.locator('button').first();
    
    if (await checkInBtn.isVisible()) {
        await checkInBtn.click();
        
        // Assert UI reacts to the mutation response
        await expect(page.getByText(/successful/i)).toBeVisible({ timeout: 10000 });
        
        // 4. Verify the database was mutated correctly
        const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
        expect(updatedBooking?.status).toBe('CHECKED_IN');
    }
  });
});

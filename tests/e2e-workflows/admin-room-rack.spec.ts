import { test, expect } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { cleanDatabase } from '@/tests/utils/clean-db';
import { RoomFactory } from '@/tests/factories/room.factory';
import prisma from '@/lib/prisma';

test.describe('Admin Room Rack Workflow (Database Seeded)', () => {
  test.beforeEach(async () => {
    // 1. Clean the database before each test
    await cleanDatabase();
  });

  test('Admin views rooms, filters, and edits a room status', async ({ page, context }) => {
    // 2. Seed data into the actual database
    const roomType = await prisma.roomType.create({
      data: {
        name: 'Presidential',
        description: 'Top floor',
        baseRate: 500.00,
        capacity: 4,
        amenities: [],
      }
    });

    const room = await RoomFactory.create({
      number: '101',
      status: 'AVAILABLE',
      roomType: { connect: { id: roomType.id } }
    });

    // 3. Generate NextAuth JWT for a MANAGER
    const token = await encode({
      token: {
        name: 'Hotel Manager',
        email: 'manager@smarthotel.com',
        role: 'MANAGER',
        id: 'manager-123'
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

    // 4. Go to Admin Rooms page
    await page.goto('/admin/rooms');

    // 5. Verify initial load (Next.js server components will fetch directly from DB)
    await expect(page.getByRole('heading', { name: 'Room Management' })).toBeVisible();
    await expect(page.getByText('Room 101')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('AVAILABLE', { exact: true })).toBeVisible();

    // 6. Open Edit Modal
    await page.getByRole('button', { name: /edit/i }).click();

    // 7. Change status to MAINTENANCE
    await page.getByRole('dialog').locator('select').nth(1).selectOption('MAINTENANCE');

    // 8. Save
    await page.getByRole('button', { name: /update room/i }).click();

    // 9. Verify the updated status in the UI
    await expect(page.getByText('MAINTENANCE', { exact: true })).toBeVisible({ timeout: 10000 });

    // 10. Verify the DB was actually updated
    const updatedRoom = await prisma.room.findUnique({ where: { id: room.id } });
    expect(updatedRoom?.status).toBe('MAINTENANCE');
  });
});

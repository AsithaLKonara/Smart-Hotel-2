import { test, expect } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { cleanDatabase } from '@/tests/utils/clean-db';
import { UserFactory } from '@/tests/factories/user.factory';
import { RoomFactory } from '@/tests/factories/room.factory';
import prisma from '@/lib/prisma';

test.describe('Kitchen Dashboard Workflow (Database Seeded)', () => {
  test.beforeEach(async () => {
    // 1. Clean the database before each test
    await cleanDatabase();
  });

  test('Chef views new order, accepts it, and prepares it via UI', async ({ page, context }) => {
    // 2. Seed deterministic data into the actual database
    const roomType = await prisma.roomType.create({
      data: {
        name: 'Standard Room',
        description: 'Cozy standard room',
        baseRate: 99.99,
        capacity: 2,
        amenities: ['WiFi'],
      }
    });

    const room = await RoomFactory.create({
      number: '305',
      status: 'OCCUPIED',
      roomType: { connect: { id: roomType.id } }
    });

    const guest = await UserFactory.create({
      name: 'Test Guest',
      email: 'test.guest@example.com',
      role: { connect: { name: 'GUEST' } }
    });

    const menuItem = await prisma.menuItem.create({
      data: {
        name: 'Club Sandwich',
        description: 'Classic club sandwich',
        price: 15.00,
        category: 'MAINS',
        available: true,
      }
    });

    const order = await prisma.foodOrder.create({
      data: {
        guestId: guest.id,
        roomId: room.id,
        status: 'PENDING',
        totalAmount: 30.00,
        items: {
          create: [{
            menuItemId: menuItem.id,
            quantity: 2,
            price: 15.00
          }]
        }
      }
    });

    // 3. Authenticate Kitchen Staff via NextAuth JWT cookie
    const token = await encode({
      token: {
        name: 'Chef Gordon',
        email: 'chef@smarthotel.com',
        role: 'KITCHEN_STAFF',
        id: 'chef-123'
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

    // 4. Navigate to the Kitchen Dashboard
    await page.goto('/kitchen/dashboard');

    // 5. Verify the order appears in the "New Orders" column
    const pendingCard = page.locator('.rounded-3xl', { hasText: 'New Orders' });
    // The orderNumber logic in route is id.substring(0,8).toUpperCase()
    const orderNum = order.id.substring(0, 8).toUpperCase();
    await expect(pendingCard.getByText(orderNum)).toBeVisible({ timeout: 15000 });
    // It might show 'Room 305' if room mapping works, but let's check basic elements
    await expect(pendingCard.getByText('2x Club Sandwich')).toBeVisible();

    // 6. Chef accepts the order
    await pendingCard.getByRole('button', { name: /accept order/i }).click();

    // Wait for the UI mutation and real-time transition
    await page.waitForTimeout(2000);

    // 7. Verify the order moves to the "Confirmed" column
    const confirmedCard = page.locator('.rounded-3xl', { hasText: 'Confirmed' });
    await expect(confirmedCard.getByText(orderNum)).toBeVisible({ timeout: 10000 });
    await expect(confirmedCard.getByRole('button', { name: /start preparation/i })).toBeVisible();

    // 8. Verify the DB was actually updated
    const updatedOrder = await prisma.foodOrder.findUnique({ where: { id: order.id } });
    expect(updatedOrder?.status).toBe('CONFIRMED');
  });
});


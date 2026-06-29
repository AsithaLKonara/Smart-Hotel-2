import { test, expect } from '@playwright/test';
import { encode } from 'next-auth/jwt';

test.describe('Dining & Tracking Workflow (Mocked APIs)', () => {
  test('Guest orders food and views tracking page', async ({ page, context }) => {
    // 1. Generate NextAuth JWT for a GUEST
    const token = await encode({
      token: {
        name: 'Guest Diner',
        email: 'diner@example.com',
        role: 'GUEST',
        roleName: '', id: 'mock-id', permissions: []},
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

    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        json: {
          user: { name: 'Guest Diner', email: 'diner@example.com', role: 'GUEST', roleName: '', id: 'mock-id', permissions: []},
          expires: new Date(Date.now() + 86400000).toISOString()
        }
      });
    });

    // 2. Intercept Active Booking (required for roomNumber)
    await page.route('**/api/bookings?status=CHECKED_IN', async route => {
      await route.fulfill({
        json: {
          bookings: [
            {
              id: 'booking-777',
              room: { number: '501' }
            }
          ]
        }
      });
    });

    // 3. Intercept Menu
    await page.route('**/api/restaurant/menu', async route => {
      await route.fulfill({
        json: [
          {
            id: 'menu-1',
            name: 'Wagyu Burger',
            description: 'Premium beef',
            price: 45,
            category: 'Mains',
            available: true,
            preparationTime: 20
          }
        ]
      });
    });

    // 4. Intercept Order Submission
    await page.route('**/api/restaurant/orders', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          json: {
            order: { id: 'order-999' }
          }
        });
      } else {
        await route.continue();
      }
    });

    // 5. Intercept Tracking Page Order Fetch
    await page.route('**/api/restaurant/orders/order-999', async route => {
      await route.fulfill({
        json: {
          id: 'order-999',
          orderNumber: 'KITCH-999',
          status: 'PREPARING',
          totalAmount: 45,
          createdAt: new Date().toISOString(),
          items: [
            {
              id: 'item-1',
              quantity: 1,
              unitPrice: 45,
              menu: { name: 'Wagyu Burger' }
            }
          ]
        }
      });
    });

    // 6. Navigate to Dining Dashboard
    await page.goto('/dashboard/dining');

    // Wait for the Menu Items to load
    await expect(page.getByText('Wagyu Burger')).toBeVisible();

    // 7. Add to Suite (Cart)
    await page.getByRole('button', { name: /add to suite/i }).click();

    // 8. Verify Cart
    const cartTotal = page.locator('text=Grand Total').locator('..').locator('span').nth(1);
    await expect(cartTotal).toHaveText('$45.00');

    // 9. Checkout
    await page.getByRole('button', { name: /finalize room order/i }).click();

    // 10. Verify redirect to tracking page
    await expect(page).toHaveURL(/.*\/dashboard\/dining\/tracking\/order-999/);
    await expect(page.getByText('Wagyu Burger')).toBeVisible();
    await expect(page.getByText('PREPARING', { exact: true })).toBeVisible();
  });
});

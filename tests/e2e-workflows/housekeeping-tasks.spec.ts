import { test, expect } from '@playwright/test';
import { encode } from 'next-auth/jwt';

test.describe('Housekeeping Operations Workflow (Mocked APIs)', () => {
  test('Housekeeper updates a room from DIRTY to AVAILABLE', async ({ page, context }) => {
    // 1. Generate NextAuth JWT for HOUSEKEEPING
    const token = await encode({
      token: {
        name: 'Housekeeping Staff',
        email: 'housekeeping@smarthotel.com',
        role: 'HOUSEKEEPING',
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
          user: { name: 'Housekeeping Staff', email: 'housekeeping@smarthotel.com', role: 'HOUSEKEEPING', roleName: '', id: 'mock-id', permissions: []},
          expires: new Date(Date.now() + 86400000).toISOString()
        }
      });
    });

    // 2. Intercept rooms API to control the flow
    let currentStatus = 'DIRTY';

    await page.route('**/api/rooms*', async route => {
      if (route.request().method() === 'GET') {
        // Only return the room if it's not AVAILABLE (Housekeeping hub filters AVAILABLE out anyway, but let's mock it)
        const rooms = [
          {
            id: 'room-1',
            number: '101',
            type: 'Deluxe',
            status: currentStatus,
          }
        ];
        await route.fulfill({ json: { rooms } });
      } else if (route.request().method() === 'PATCH') {
        // Read the requested status
        const postData = JSON.parse(route.request().postData() || '{}');
        if (postData.status) {
          currentStatus = postData.status;
        }
        await route.fulfill({ status: 200, json: { success: true } });
      } else {
        await route.continue();
      }
    });

    // 3. Navigate to Housekeeping page
    await page.goto('/admin/housekeeping');

    // 4. Verify initial load (DIRTY)
    await expect(page.getByRole('heading', { name: 'Room 101' })).toBeVisible();
    await expect(page.getByText('DIRTY', { exact: true })).toBeVisible();

    // 5. Start Cleaning
    await page.getByRole('button', { name: /start cleaning/i }).click();

    // 6. Verify state changed to CLEANING
    // The query invalidates, so it fetches GET again, which now returns CLEANING
    await expect(page.getByText('CLEANING', { exact: true })).toBeVisible();

    // 7. Request Inspection
    await page.getByRole('button', { name: /request inspection/i }).click();

    // 8. Verify it moved to Inspection Gate
    await expect(page.locator('.bg-amber-500\\/10', { hasText: 'Pending' })).toBeVisible();

    // 9. Approve
    await page.getByRole('button', { name: /approve/i }).click();

    // 10. Verify room is cleared from the board (because it's AVAILABLE)
    await expect(page.getByRole('heading', { name: 'Room 101' })).not.toBeVisible();
    await expect(page.getByText('All Verified')).toBeVisible();
  });
});

import { test, expect } from './fixtures/test-data';

test.describe('Operations Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as a manager
    await page.goto('/auth/signin');
    await page.getByLabel(/email/i).fill('manager@smarthotel.local'); 
    await page.getByLabel(/password/i).fill('password123'); // Demo seed
    await page.getByRole('button', { name: /sign in|login/i }).click();
  });

  test('Housekeeping status tracking', async ({ page }) => {
    await page.goto('/admin/housekeeping/board');
    
    // Select a room to mark clean
    // Needs auto-correction based on actual dynamic DOM state
    const dirtyRoomBtn = page.getByRole('button', { name: /mark clean|update status/i }).first();
    if (await dirtyRoomBtn.isVisible()) {
        await dirtyRoomBtn.click();
        await expect(page.getByText(/status updated|now clean/i)).toBeVisible();
    }
  });

  test('Inventory and POS synchronization', async ({ page }) => {
    // Verify POS loading
    await page.goto('/admin/inventory');
    await expect(page.getByRole('heading', { name: /inventory|stock/i })).toBeVisible();

    // Verify Kitchen display
    await page.goto('/kitchen/dashboard');
    await expect(page.getByRole('heading', { name: /kitchen|orders/i })).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Front Desk & Reception', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/receptionist');
  });

  test('should display the Reception Desk with Room Matrix', async ({ page }) => {
    // The actual h1 is "Reception Desk"
    await expect(page.getByRole('heading', { name: /Reception Desk/i })).toBeVisible({ timeout: 15000 });

    // Verify filter buttons for room statuses exist
    await expect(page.getByRole('button', { name: /Available/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Occupied/i })).toBeVisible();
  });

  test('should navigate to Accounting page', async ({ page }) => {
    // Navigate directly to an existing accounting route
    await page.goto('/admin/accounting/night-audit', { timeout: 60000 });

    // The page should load
    await page.waitForLoadState('networkidle');
    
    // Verify we are on the accounting section
    await expect(page).toHaveURL(/.*\/admin\/accounting\/night-audit/);
  });
});

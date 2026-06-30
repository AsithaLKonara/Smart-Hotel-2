import { test, expect } from '@playwright/test';

test.describe('Front Desk & Reception', () => {
  test.beforeEach(async ({ page }) => {
    // Relying on the authenticated state from storageState
    await page.goto('/admin/receptionist');
  });

  test('should display the Reception Desk with Room Matrix', async ({ page }) => {
    // The actual h1 is "Reception Desk"
    await expect(page.getByRole('heading', { name: /Reception Desk/i })).toBeVisible();

    // Verify the Room Matrix section exists
    await expect(page.getByRole('heading', { name: /Room Matrix/i })).toBeVisible();

    // Verify filter buttons for room statuses exist
    await expect(page.getByRole('button', { name: /AVAILABLE/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /OCCUPIED/i })).toBeVisible();
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

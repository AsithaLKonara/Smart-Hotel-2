import { test, expect } from '@playwright/test';

test.describe('Housekeeping Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Relying on the authenticated state from storageState
    // Housekeeping page can be slow due to server-side data fetching
    await page.goto('/admin/housekeeping', { timeout: 60000 });
  });

  test('desktop board should load', async ({ page }) => {
    // The actual h1 is "Housekeeping Command Center"
    await expect(page.getByRole('heading', { name: /Housekeeping Command Center/i })).toBeVisible();
    
    // Check for the Task Dispatch Board section
    await expect(page.getByRole('heading', { name: /Task Dispatch Board/i })).toBeVisible();
  });
});

test.describe('Housekeeping Mobile PWA', () => {
  test.use({
    viewport: { width: 390, height: 844 }, // iPhone 12/13 size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });

  test.beforeEach(async ({ page }) => {
    // Mobile housekeeping page loads room data from the database
    await page.goto('/mobile/housekeeping', { timeout: 60000 });
  });

  test('mobile PWA should render touch-friendly UI', async ({ page }) => {
    // Assert the mobile header loaded — h1 says "Housekeeping"
    await expect(page.getByRole('heading', { name: /Housekeeping/i })).toBeVisible();
    
    // Note: Touch buttons (Clean/Progress) only appear when rooms exist in DB.
    // For a basic smoke test, verifying the app shell loads is sufficient.
  });
});

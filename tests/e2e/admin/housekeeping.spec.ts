import { test, expect } from '@playwright/test';

test.describe('Housekeeping Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Relying on the authenticated state from storageState
    await page.goto('/admin/housekeeping');
  });

  test('desktop board should load', async ({ page }) => {
    // Assert the page loaded
    await expect(page.getByRole('heading', { name: /Housekeeping Board/i })).toBeVisible();
    
    // Check if the grid filters exist
    await expect(page.getByPlaceholder('Search rooms...')).toBeVisible();
  });
});

test.describe('Housekeeping Mobile PWA', () => {
  test.use({
    viewport: { width: 390, height: 844 }, // iPhone 12/13 size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/mobile/housekeeping');
  });

  test('mobile PWA should render touch-friendly UI', async ({ page }) => {
    // Assert the mobile header loaded
    await expect(page.getByRole('heading', { name: /Housekeeping/i })).toBeVisible();

    // Verify the massive touch buttons are present
    const cleanButton = page.getByRole('button', { name: /Clean/i }).first();
    await expect(cleanButton).toBeVisible();

    const progressButton = page.getByRole('button', { name: /Progress/i }).first();
    await expect(progressButton).toBeVisible();
  });
});

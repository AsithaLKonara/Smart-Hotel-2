import { test, expect } from '@playwright/test';

test.describe('SmartHotel OS E2E Validation', () => {
  test('Homepage loads correctly', async ({ page }) => {
    // Navigate to homepage
    const response = await page.goto('/');
    
    // Check if the server is throwing 500s
    expect(response?.status()).toBeLessThan(400);

    // Check for essential UI elements
    await expect(page.locator('body')).toBeVisible();
  });
});

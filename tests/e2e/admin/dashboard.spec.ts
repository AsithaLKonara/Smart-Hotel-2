import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the admin dashboard
    // The storageState automatically logs us in
    await page.goto('/admin/dashboard');
  });

  test('should display the Property Switcher for authorized roles', async ({ page }) => {
    // Look for the property switcher button (default: Grand Palace Hotel (HQ))
    const propertySwitcher = page.getByRole('button', { name: /Grand Palace Hotel/i });
    
    // Ensure the switcher is visible on the dashboard
    await expect(propertySwitcher).toBeVisible();

    // Click it to open the dropdown
    await propertySwitcher.click();

    // Verify properties are listed
    await expect(page.getByRole('menuitem', { name: /Grand Palace Resort & Spa/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Grand Palace Express/i })).toBeVisible();
  });

  test('global hotkeys should navigate correctly', async ({ page }) => {
    // Test Alt+C (Check-in/Front Desk)
    await page.keyboard.press('Alt+c');
    await expect(page).toHaveURL(/.*\/admin\/receptionist/);

    // Navigate back to trigger another hotkey
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Test Alt+H (Housekeeping)
    await page.keyboard.press('Alt+h');
    await expect(page).toHaveURL(/.*\/admin\/housekeeping/);
  });
});

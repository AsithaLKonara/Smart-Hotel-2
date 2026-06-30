import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the admin dashboard
    // The storageState automatically logs us in
    await page.goto('/admin/dashboard', { timeout: 60000 });
  });

  test('should display the Admin Command Deck with KPI cards', async ({ page }) => {
    // The dashboard heading is "Admin Command Deck"
    await expect(page.getByRole('heading', { name: /Admin Command Deck/i })).toBeVisible({ timeout: 30000 });

    // Verify the KPI stat cards are present
    await expect(page.getByText('Revenue', { exact: true })).toBeVisible();
    await expect(page.getByText('Bookings', { exact: true })).toBeVisible();
    await expect(page.getByText('Occupancy', { exact: true })).toBeVisible();
    await expect(page.getByText('Service Score', { exact: true })).toBeVisible();

    // Verify the Sync Data button exists
    await expect(page.getByRole('button', { name: /Sync Data/i })).toBeVisible();
  });

  test('global hotkeys should navigate correctly', async ({ page }) => {
    // Wait for dashboard to fully load before pressing hotkeys
    await expect(page.getByRole('heading', { name: /Admin Command Deck/i })).toBeVisible({ timeout: 30000 });

    // Test Alt+C (Check-in/Front Desk)
    await page.keyboard.press('Alt+c');
    await expect(page).toHaveURL(/.*\/admin\/receptionist/, { timeout: 30000 });

    // Navigate back to trigger another hotkey
    await page.goto('/admin/dashboard', { timeout: 60000 });
    await expect(page.getByRole('heading', { name: /Admin Command Deck/i })).toBeVisible({ timeout: 30000 });

    // Test Alt+H (Housekeeping)
    await page.keyboard.press('Alt+h');
    await expect(page).toHaveURL(/.*\/admin\/housekeeping/, { timeout: 30000 });
  });
});

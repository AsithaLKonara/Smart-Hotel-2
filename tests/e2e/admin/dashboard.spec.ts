import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth-helpers';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'SUPER_ADMIN');
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
  });

  test('should display the Admin Command Deck with KPI cards', async ({ page }) => {
    // The dashboard heading is "Admin Command Deck"
    await expect(page.getByRole('heading', { name: /Admin Command Deck/i })).toBeVisible({ timeout: 35000 });

    // Verify the KPI stat cards are present
    await expect(page.getByText('Total Revenue', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Total Bookings', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Occupancy Rate', { exact: true }).first()).toBeVisible();

    // Verify the Sync Data button exists
    await expect(page.getByRole('button', { name: /Sync Data/i })).toBeVisible();
  });

  test('global hotkeys should navigate correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Admin Command Deck/i })).toBeVisible({ timeout: 35000 });

    // Test Alt+C (Check-in/Front Desk)
    await page.keyboard.press('Alt+c');
    await expect(page).toHaveURL(/.*\/admin\/receptionist/, { timeout: 30000 });

    // Navigate back to trigger another hotkey
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await expect(page.getByRole('heading', { name: /Admin Command Deck/i })).toBeVisible({ timeout: 35000 });

    // Test Alt+H (Housekeeping)
    await page.keyboard.press('Alt+h');
    await expect(page).toHaveURL(/.*\/admin\/housekeeping/, { timeout: 30000 });
  });
});

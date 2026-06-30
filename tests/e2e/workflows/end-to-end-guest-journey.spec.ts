import { test, expect } from '@playwright/test';

// Guests do not require the admin storageState.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('End-to-End Guest Journey Workflow', () => {
  test('Complete lifecycle: Homepage -> Check Availability -> Booking Wizard', async ({ page }) => {
    // 1. Land on the homepage
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /The Art of Luxury/i })).toBeVisible();

    // 2. Click "Check Availability" — navigates to /booking
    await page.getByRole('button', { name: /Check Availability/i }).click();
    await expect(page).toHaveURL(/.*\/booking/);

    // 3. Verify the booking wizard loaded
    await expect(page.getByRole('heading', { name: /Secure Your Stay/i })).toBeVisible();

    // 4. Verify the first step of the wizard (Plan Your Arrival)
    await expect(page.getByRole('heading', { name: /Plan Your Arrival/i })).toBeVisible();
  });
});

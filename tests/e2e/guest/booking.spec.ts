import { test, expect } from '@playwright/test';

// Guests do not require the admin storageState. We can clear it.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Guest Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the public homepage
    await page.goto('/');
  });

  test('should allow a guest to search for availability', async ({ page }) => {
    // Look for the Check Availability button on the hero section
    await expect(page.getByRole('button', { name: /Check Availability/i })).toBeVisible();

    // Click "Check Availability" — it navigates to /booking
    await page.getByRole('button', { name: /Check Availability/i }).click();

    // The system navigates to /booking (the booking wizard)
    await expect(page).toHaveURL(/.*\/booking/);

    // Verify the booking page loaded with its heading
    await expect(page.getByRole('heading', { name: /Secure Your Stay/i })).toBeVisible();
  });
});

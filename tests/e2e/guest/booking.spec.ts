import { test, expect } from '@playwright/test';

// Guests do not require the admin storageState. We can clear it.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Guest Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the public homepage
    await page.goto('/');
  });

  test('should allow a guest to search for availability', async ({ page }) => {
    // Look for the Booking Widget on the homepage
    await expect(page.getByRole('button', { name: /Check Availability/i })).toBeVisible();

    // The user flow:
    // 1. Enter dates (Skipping explicit calendar clicks for this smoke test)
    // 2. Select guests
    // 3. Click Check Availability
    await page.getByRole('button', { name: /Check Availability/i }).click();

    // The system should navigate to /rooms or display the availability drawer
    // In our implementation, it usually navigates to /rooms
    await expect(page).toHaveURL(/.*\/rooms/);

    // Verify rooms are listed
    await expect(page.getByRole('heading', { name: /Available Rooms/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Book Now/i }).first()).toBeVisible();
  });
});

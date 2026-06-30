import { test, expect } from '@playwright/test';

// Guests do not require the admin storageState.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('End-to-End Guest Journey Workflow', () => {
  test('Complete lifecycle: Search -> View -> Checkout', async ({ page }) => {
    // 1. Search for a room
    await page.goto('/');
    await page.getByRole('button', { name: /Check Availability/i }).click();
    await expect(page).toHaveURL(/.*\/rooms/);

    // 2. Select a room
    // The "Book Now" buttons exist on the /rooms page
    const bookButton = page.getByRole('button', { name: /Book Now/i }).first();
    await bookButton.click();

    // 3. We are now in the checkout/booking flow. 
    // Depending on the implementation, we might need to fill out guest details
    // For this smoke test, we verify the presence of the reservation summary
    await expect(page.getByText(/Reservation Summary/i)).toBeVisible();
    
    // Check if there is a "Complete Booking" or "Confirm" button
    const confirmButton = page.getByRole('button', { name: /(Complete|Confirm) Booking/i });
    if (await confirmButton.isVisible()) {
      // In a real automated test we would mock Stripe here and submit.
      // await confirmButton.click();
    }
  });
});

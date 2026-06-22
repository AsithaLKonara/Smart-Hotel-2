import { test, expect } from './fixtures/test-data';

test.describe('Booking Flows', () => {
  test('Create a successful booking', async ({ page, generateDates }) => {
    await page.goto('/booking');
    
    // Select dates (7 days from now, for 3 nights)
    const { checkIn, checkOut } = generateDates(7, 3);
    
    // Assuming standard date inputs or calendar widget
    // Note: Inputs do not have accessible labels, using type selectors
    await page.locator('input[type="date"]').first().fill(checkIn.toISOString().split('T')[0]);
    await page.locator('input[type="date"]').nth(1).fill(checkOut.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /check availability/i }).click();

    // Select first available room
    await page.getByRole('button', { name: /book|select/i }).first().click();

    // Fill guest details
    await page.getByLabel(/first name/i).fill('Test');
    await page.getByLabel(/last name/i).fill('Guest');
    await page.getByLabel(/email/i).fill(`test-${Date.now()}@example.com`);
    await page.getByLabel(/phone/i).fill('+1234567890');

    // Confirm booking
    await page.getByRole('button', { name: /confirm reservation/i }).click();

    // Verify confirmation page
    await expect(page.getByText(/booking confirmed|success/i)).toBeVisible({ timeout: 15000 });
  });

  test('Booking validation prevents empty fields', async ({ page }) => {
    await page.goto('/booking-flow'); // or whichever step is the direct form
    
    // Submit empty form
    await page.getByRole('button', { name: /confirm reservation/i }).click();

    // Verify validation errors
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });
});

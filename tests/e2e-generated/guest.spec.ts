import { test, expect } from './fixtures/test-data';

test.describe('Guest Portal Workflows', () => {
  test('Guest registration', async ({ page, uniqueEmail }) => {
    await page.goto('/auth/signup');
    
    // Fill registration
    await page.getByLabel(/first name/i).fill('New');
    await page.getByLabel(/last name/i).fill('Guest');
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByLabel(/password/i).fill('GuestPass123!');
    
    await page.getByRole('button', { name: /create account|register/i }).click();
    
    // Should login automatically or redirect to signin
    await expect(page.url()).not.toMatch(/signup/);
  });

  test('Guest booking history access', async ({ page }) => {
    // Authenticate as an existing guest
    await page.goto('/auth/signin');
    await page.getByLabel(/email/i).fill('guest@example.com'); // standard demo guest
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // View bookings
    await page.goto('/my-bookings');
    await expect(page.getByRole('heading', { name: /my bookings|reservations/i })).toBeVisible();
  });
});

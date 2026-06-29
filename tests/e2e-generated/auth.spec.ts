import { test, expect } from './fixtures/test-data';

test.describe('Authentication Flows', () => {
  test('Successful login with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/signin');
    
    // Fill credentials using the exact labels from the UI
    await page.getByLabel(/staff email/i).fill('admin@smarthotel.com');
    await page.getByLabel(/access key/i).fill('SmartHotel@2025!Admin');
    
    // Click submit
    await page.getByRole('button', { name: /initialize session/i }).click();
    
    // Verify successful redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Failed login with invalid credentials', async ({ page, uniqueEmail }) => {
    await page.goto('/auth/signin');
    
    await page.getByLabel(/staff email/i).fill(uniqueEmail);
    await page.getByLabel(/access key/i).fill('wrongpassword');
    
    await page.getByRole('button', { name: /initialize session/i }).click();
    
    // Verify error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/.*signin/);
  });

  test('Session expiration and protected route redirect', async ({ page }) => {
    // Attempt to access protected route without session
    await page.goto('/admin/dashboard');
    
    // Should automatically redirect to signin
    await expect(page).toHaveURL(/.*signin.*/);
  });

  test('Logout flow', async ({ page }) => {
    // First login
    await page.goto('/auth/signin');
    await page.getByLabel(/email/i).fill('admin@smarthotel.local');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Click user menu then logout
    await page.getByRole('button', { name: /user menu|profile/i }).click();
    await page.getByRole('menuitem', { name: /sign out|logout/i }).click();

    // Verify redirected back to home or signin
    await expect(page).toHaveURL(/.*(signin|\/)$/);
  });
});

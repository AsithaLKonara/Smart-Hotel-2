import { test, expect } from './fixtures/test-data';

// Dynamically generate access control tests for a sample of protected routes
const adminRoutes = [
  '/admin/dashboard',
  '/admin/rooms',
  '/admin/staff',
  '/admin/settings'
];

test.describe('Role-Based Access Control (RBAC)', () => {
  test.describe('Unauthenticated Access', () => {
    for (const route of adminRoutes) {
      test(`Denies unauthenticated access to ${route}`, async ({ page }) => {
        await page.goto(route);
        // Expect a redirect to sign in
        await expect(page).toHaveURL(/.*signin.*/);
      });
    }
  });

  test.describe('Unauthorized Role Access (GUEST)', () => {
    test.beforeEach(async ({ page }) => {
      // Login as guest (using standard credentials based on assumptions)
      await page.goto('/auth/signin');
      await page.getByLabel(/email/i).fill('guest@smarthotel.local'); 
      await page.getByLabel(/password/i).fill('password123'); // Assume demo seed
      await page.getByRole('button', { name: /sign in|login/i }).click();
      await expect(page).toHaveURL(/.*dashboard.*/);
    });

    for (const route of adminRoutes) {
      test(`Denies GUEST role access to ${route}`, async ({ page }) => {
        const response = await page.goto(route);
        // Depending on app architecture, might be a 403 status, a "Not Authorized" message, or redirect
        if (response?.status() === 403) {
          expect(response.status()).toBe(403);
        } else {
          // If it loads, expect an unauthorized banner or redirect away
          const isRedirected = !page.url().includes(route);
          const hasErrorText = await page.getByText(/unauthorized|access denied/i).isVisible();
          expect(isRedirected || hasErrorText).toBeTruthy();
        }
      });
    }
  });
});

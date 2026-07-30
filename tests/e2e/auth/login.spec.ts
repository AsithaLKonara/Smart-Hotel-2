import { test, expect } from '@playwright/test';
import { resetDatabase } from '../utils/db-reset';
import { seedTestHotel } from '../utils/seed-hotel';

test.describe.serial('Phase 1: Authentication E2E Pipeline', () => {
  // Phase 0: Ensure the database is completely clean and seeded before the auth tests run
  test.beforeAll(async () => {
    // In a highly parallelized CI environment, we would lock the DB during this phase.
    await resetDatabase();
    await seedTestHotel();
  });

  test('Valid Login Flow creates session and redirects to dashboard', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Attempt login with seeded Super Admin credentials
    await page.fill('input[name="email"]', 'admin@smarthotel.local');
    await page.fill('input[name="password"]', 'EnterpriseTest123!');
    await page.click('button[type="submit"]');

    // Wait for NextAuth to create the session and redirect
    await page.waitForURL('/admin/dashboard');
    expect(page.url()).toContain('/admin/dashboard');

    // Verify Session Security Flags on the NextAuth cookie
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('next-auth.session-token'));
    
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBeTruthy();
    expect(sessionCookie?.sameSite).toBe('Lax');
    // Note: Secure flag is true only if accessed via HTTPS, so we conditionally assert or mock
  });

  test('Invalid Login Flow actively rejects unknown emails', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.fill('input[name="email"]', 'ghost@smarthotel.local');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Verify no redirect occurs and an error message appears
    await expect(page.locator('text=Sign in failed')).toBeVisible();
    expect(page.url()).toContain('/auth/login');
  });

  test('Invalid Login Flow actively rejects wrong passwords for valid users', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Use the valid Manager email, but wrong password
    await page.fill('input[name="email"]', 'manager@smarthotel.local');
    await page.fill('input[name="password"]', 'Hacked123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Sign in failed')).toBeVisible();
    expect(page.url()).toContain('/auth/login');
  });
});

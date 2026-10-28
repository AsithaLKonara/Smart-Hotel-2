import { test, expect } from '@playwright/test';

test.describe('Stealth Cardless Login & Disabled Public Web Verification', () => {
  // Do NOT use stored authentication state so we can test the unauthenticated journey
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
  });

  test('Public Web Disabled: Visiting root / and public marketing routes redirects to /auth/signin', async ({ page }) => {
    // 1. Root / must redirect to /auth/signin
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/auth\/signin/);

    // 2. Public marketing /rooms must redirect to /auth/signin
    await page.goto('/rooms', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/auth\/signin/);

    // 3. Public /booking must redirect to /auth/signin
    await page.goto('/booking', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('2-Column Cardless Stealth Login Page Anatomy & Authentication Flow', async ({ page }) => {
    await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' });

    // 1. Verify 2-Column Cardless Viewport Architecture
    const viewport = page.locator('.min-h-screen.w-full.bg-\\[\\#090A0C\\]').first();
    await expect(viewport).toBeVisible();

    // 2. Verify Left Column (Brand, Telemetry, and Simulator Profiles)
    await expect(page.locator('text=SMARTHOTEL').first()).toBeVisible();
    await expect(page.locator('text=SPACE').first()).toBeVisible();
    await expect(page.locator('text=Cluster 01 Online').first()).toBeVisible();
    await expect(page.locator('text=Stealth Industrial').first()).toBeVisible();
    await expect(page.locator('text=Host Node Diagnostics').first()).toBeVisible();
    await expect(page.locator('text=Quick Simulator Authentication').first()).toBeVisible();

    // 3. Verify Right Column (Cardless Form & Inputs)
    await expect(page.locator('text=Console Authorization').first()).toBeVisible();
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // 4. Test Simulator Auto-Population
    const superAdminBtn = page.locator('button:has-text("Super Admin")').first();
    await expect(superAdminBtn).toBeVisible();
    await superAdminBtn.click();

    // Check that email and password fields are filled
    await expect(emailInput).toHaveValue('admin@smarthotel.com');
    await expect(passwordInput).toHaveValue('SmartHotel@2025!Admin');

    // 5. Test Submit Button and Successful Authentication
    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // After login, page should redirect to admin dashboard
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 30000 });
    await expect(page.locator('text=Admin Command Deck').first()).toBeVisible({ timeout: 20000 });
  });
});

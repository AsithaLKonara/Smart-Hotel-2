import { test, expect } from '@playwright/test';

test.describe('Phase 2 RBAC: Manager Certification', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Manager has operational access but is blocked from System Admin namespaces', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'manager@smarthotel.local');
    await page.fill('input[name="password"]', 'EnterpriseTest123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('/admin/dashboard');

    // 1. Allowed Operational Access (Night Audit / Accounting)
    await page.goto('/admin/accounting/night-audit');
    await expect(page.locator('text=/Access Denied/i')).not.toBeVisible();

    // 2. Blocked UI Access (Roles & Permissions)
    await page.goto('/admin/roles');
    await page.waitForLoadState('domcontentloaded');
    // We expect the middleware to aggressively redirect managers away from /admin/roles
    await expect(page).not.toHaveURL(/.*\/admin\/roles/);

    // 3. Blocked API Access (System Configuration)
    const apiRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/roles', { method: 'GET' });
      return res.status;
    });
    // Strict 403 Forbidden is expected for managers trying to hit system config
    expect(apiRes).toBe(403);
  });
});

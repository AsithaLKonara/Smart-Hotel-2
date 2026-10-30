import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth-helpers';

test.describe('Phase 2 RBAC: Manager Certification', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Manager has operational access but is blocked from System Admin namespaces', async ({ page }) => {
    // 1. Authenticate as Manager
    await loginAs(page, 'MANAGER');
    await expect(page).toHaveURL(/.*\/admin\//);

    // 2. Allowed Operational Access (Night Audit / Accounting)
    await page.goto('/admin/accounting/night-audit');
    await expect(page).toHaveURL(/.*\/admin\/accounting\/night-audit/);
    await expect(page.locator('text=/Access Denied/i')).not.toBeVisible();

    // 3. Blocked UI Access (Roles & Permissions - Super Admin only)
    await page.goto('/admin/roles');
    await page.waitForLoadState('domcontentloaded');
    // Middleware redirects managers away from /admin/roles (to /unauthorized)
    await expect(page).not.toHaveURL(/.*\/admin\/roles$/);

    // 4. Blocked API Access (System Configuration)
    const apiRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/roles', { method: 'GET' });
      return res.status;
    });
    // Strict 403 Forbidden is expected for managers trying to hit system config
    expect(apiRes).toBe(403);
  });
});

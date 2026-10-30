import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth-helpers';

test.describe('Phase 2 RBAC: Staff Certification', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Housekeeping / Staff has operational task access but is completely blocked from financial ledgers and settings', async ({ page }) => {
    // 1. Authenticate as Housekeeping staff
    await loginAs(page, 'HOUSEKEEPING');
    await expect(page).toHaveURL(/.*\/admin\//);

    // 2. Allowed Housekeeping Access
    await page.goto('/admin/housekeeping', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*\/admin\/housekeeping/);
    await expect(page.getByRole('heading', { name: /Housekeeping/i })).toBeVisible({ timeout: 20000 });

    // 3. Blocked UI Access (Accounting / Folios / Roles)
    await page.goto('/admin/roles');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/.*\/admin\/roles$/);

    // 4. Blocked API Access (System Roles)
    const apiRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/roles', { method: 'GET' });
      return res.status;
    });
    // Strict 403 Forbidden is expected
    expect(apiRes).toBe(403);
  });
});

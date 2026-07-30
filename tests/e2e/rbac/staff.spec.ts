import { test, expect } from '@playwright/test';

test.describe('Phase 2 RBAC: Staff Certification', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Staff has task access but is completely blocked from operational and financial ledgers', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'staff@smarthotel.local');
    await page.fill('input[name="password"]', 'EnterpriseTest123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('/admin/tasks'); // Dashboard and Bookings blocked, redirects to tasks

    // 1. Blocked UI Access (Bookings)
    await page.goto('/admin/bookings');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/.*\/admin\/bookings/);

    // 2. Blocked API Access (Folios / Finance)
    const apiRes = await page.evaluate(async () => {
      const res = await fetch('/api/folios/123/adjustments', { method: 'POST' });
      return res.status;
    });
    // Strict 403 Forbidden is expected
    expect(apiRes).toBe(403);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Phase 2 RBAC: Receptionist Certification', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Receptionist has booking access but is blocked from Payroll and System Admin', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'reception@smarthotel.local');
    await page.fill('input[name="password"]', 'EnterpriseTest123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('/admin/bookings'); // Dashboard is blocked, redirects to bookings

    // 1. Allowed Front-Desk Access (CRM, Bookings)
    await page.goto('/admin/crm/guests');
    await expect(page.locator('text=/Access Denied/i')).not.toBeVisible();

    // 2. Blocked UI Access (Executive Dashboard)
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/.*\/admin\/dashboard/);

    // 3. Blocked API Access (HR / Payroll)
    const apiRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/hr/payroll/run', { method: 'GET' });
      return res.status;
    });
    // Strict 403 Forbidden is expected for receptionists attempting payroll lookups
    expect(apiRes).toBe(403);
  });
});

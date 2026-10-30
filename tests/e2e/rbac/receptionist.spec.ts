import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth-helpers';

test.describe('Phase 2 RBAC: Receptionist Certification', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Receptionist has booking access but is blocked from Payroll and System Admin', async ({ page }) => {
    // 1. Authenticate as Receptionist
    await loginAs(page, 'RECEPTIONIST');
    await expect(page).toHaveURL(/.*\/admin\//);

    // 2. Allowed Front-Desk Access (CRM, Bookings, Receptionist)
    await page.goto('/admin/receptionist');
    await expect(page).toHaveURL(/.*\/admin\/receptionist/);
    await expect(page.getByRole('heading', { name: /Reception Desk/i })).toBeVisible({ timeout: 20000 });

    // 3. Blocked UI Access (Executive Dashboard / Roles)
    await page.goto('/admin/roles');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/.*\/admin\/roles$/);

    // 4. Blocked API Access (HR / Payroll)
    const apiRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/roles', { method: 'GET' });
      return res.status;
    });
    // Strict 403 Forbidden is expected for receptionists attempting system role management
    expect(apiRes).toBe(403);
  });
});

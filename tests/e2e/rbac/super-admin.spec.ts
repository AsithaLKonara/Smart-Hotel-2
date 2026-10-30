import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth-helpers';

test.describe('Phase 2 RBAC: Super Admin Certification', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Super Admin has unrestricted global access across all administrative namespaces', async ({ page }) => {
    // 1. Authenticate as Super Admin
    await loginAs(page, 'SUPER_ADMIN');
    await expect(page).toHaveURL(/.*\/admin\//);

    // 2. Verify highly privileged UI access (Roles & Governance)
    await page.goto('/admin/roles');
    await expect(page.getByRole('heading', { name: /Team Directory|Staff/i })).toBeVisible({ timeout: 20000 });
    await expect(page).toHaveURL(/.*\/admin\/staff/);

    // 3. Verify highly privileged API access
    const apiRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/rbac/roles');
      return res.status;
    });
    
    // Super admin must not be blocked (200 OK)
    expect(apiRes).toBe(200);
  });
});

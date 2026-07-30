import { test, expect } from '@playwright/test';

test.describe('Phase 2 RBAC: Super Admin Certification', () => {
  // We use isolated state because RBAC is hyper-sensitive to session bleeding
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Super Admin has unrestricted global access', async ({ page }) => {
    // 1. Authenticate
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@smarthotel.local');
    await page.fill('input[name="password"]', 'EnterpriseTest123!');
    await page.click('button[type="submit"]');

    await page.waitForURL('/admin/dashboard');

    // 2. Verify highly privileged UI access (Roles & Organization Settings)
    await page.goto('/admin/roles');
    await expect(page.locator('text=/Access Denied/i')).not.toBeVisible();
    await expect(page).toHaveURL(/.*\/admin\/roles/);

    // 3. Verify highly privileged API access (Audit Logs / SRE)
    const apiRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/observability/traces');
      return res.status;
    });
    
    // SRE endpoint is deprecated (returns 410), but crucially it should NOT return 401 or 403
    expect([401, 403]).not.toContain(apiRes);
  });
});

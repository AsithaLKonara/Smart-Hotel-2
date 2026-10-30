import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth-helpers';

test.describe('Phase 2 RBAC: Guest Certification & Privilege Escalation', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Guest is hard-blocked from all internal API namespaces and administrative UIs', async ({ page }) => {
    // 1. Authenticate as Guest
    await loginAs(page, 'GUEST');

    // Guests should route to a guest portal/dashboard, NOT /admin/*
    await expect(page).not.toHaveURL(/.*\/admin\//);

    // 2. IDOR / UI Escalation Attack: Guest manually enters URL to hit /admin/bookings or /admin/roles
    await page.goto('/admin/bookings');
    await page.waitForLoadState('domcontentloaded');
    // The middleware MUST intercept and redirect guest away from /admin (to /unauthorized or /dashboard)
    await expect(page).not.toHaveURL(/.*\/admin\/bookings$/);

    // 3. Privilege Escalation Attack: Guest sends raw fetch to internal admin API
    const apiRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/roles', { method: 'GET' });
      return res.status;
    });
    
    // The RBAC middleware must aggressively enforce a 403 Forbidden on the backend admin API
    expect(apiRes).toBe(403);
  });
});

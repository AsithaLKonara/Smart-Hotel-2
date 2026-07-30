import { test, expect } from '@playwright/test';

test.describe('Phase 2 RBAC: Guest Certification & Privilege Escalation', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Guest is hard-blocked from all internal API namespaces and administrative UIs', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'guest@smarthotel.local');
    await page.fill('input[name="password"]', 'EnterpriseTest123!');
    await page.click('button[type="submit"]');

    // Guests should route to a guest portal, not /admin/*
    await page.waitForLoadState('networkidle');
    await expect(page.url()).not.toContain('/admin');

    // 1. IDOR / UI Escalation Attack: Guest manually modifies URL to hit the Receptionist view
    await page.goto('/admin/bookings');
    await page.waitForLoadState('domcontentloaded');
    // The middleware MUST intercept and boot the guest back out of /admin
    await expect(page).not.toHaveURL(/.*\/admin\/bookings/);

    // 2. Privilege Escalation Attack: Guest sends raw fetch to protected API
    const apiRes = await page.evaluate(async () => {
      const res = await fetch('/api/bookings', { method: 'GET' });
      return res.status;
    });
    
    // The RBAC middleware must aggressively enforce a 403 Forbidden on the backend API
    expect(apiRes).toBe(403);
  });
});

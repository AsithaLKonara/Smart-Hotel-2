import { expect } from '@playwright/test';
import { test } from '../fixtures/auth';

test.describe('Autonomous Coverage: /admin/staff', () => {
  test('should load without critical errors as UNAUTHENTICATED', async ({ page, loginAs }) => {
    await loginAs('UNAUTHENTICATED');
    
    // Catch console errors
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const response = await page.goto('/admin/staff', { waitUntil: 'domcontentloaded' });
    
    // We expect either a success or a redirect to login (if protected)
    if (response) {
      const status = response.status();
      // 200 = Success, 401/403/302 = Auth/Redirect expected behavior
      expect([200, 302, 304, 307, 308, 401, 403, 404]).toContain(status);
    }
    
    // Check if there are catastrophic react errors
    const reactError = errors.find(e => e.includes('Minified React error') || e.includes('Application error'));
    expect(reactError).toBeUndefined();
  });

  // Example of a role-based test. The engine will iteratively expand this.
  test('should load without critical errors as SUPER_ADMIN', async ({ page, loginAs }) => {
    await loginAs('SUPER_ADMIN');
    
    const response = await page.goto('/admin/staff', { waitUntil: 'domcontentloaded' });
    if (response) {
      expect([200, 302, 304, 404]).toContain(response.status());
    }
  });
});

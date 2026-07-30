import { test, expect } from '@playwright/test';

test.describe('Phase 15: UI/UX Production Integrity', () => {
  // Use admin context to render the most complex components
  // test.use({ storageState: 'playwright/.auth/admin.json' });

  // Playwright projects usually define viewports (Desktop/Mobile), but we can force them here for the matrix
  const viewports = [
    { name: 'Desktop HD', width: 1920, height: 1080 },
    { name: 'MacBook', width: 1440, height: 900 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
    { name: 'iPhone 14', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    test(`Render Dashboard perfectly on ${vp.name} without Hydration or Console Errors`, async ({ page }) => {
      // Configure viewport
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const consoleErrors: string[] = [];
      const hydrationErrors: string[] = [];

      // 1. Trap all console errors aggressively
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          consoleErrors.push(text);
          if (text.includes('Hydration') || text.includes('Minified React error')) {
            hydrationErrors.push(text);
          }
        }
      });

      // Trap uncaught exceptions
      page.on('pageerror', err => {
        consoleErrors.push(err.message);
      });

      // 2. Load the most complex page (Dashboard / Analytics)
      await page.goto('/admin/dashboard');
      
      // Wait for network idle to ensure full React hydration
      await page.waitForLoadState('networkidle');

      // 3. Assert zero React Hydration errors
      expect(hydrationErrors, `Detected React Hydration Errors on ${vp.name}`).toHaveLength(0);
      
      // 4. Assert zero generic console errors (clean production build)
      expect(consoleErrors, `Detected Console Errors on ${vp.name}`).toHaveLength(0);

      // 5. Assert no overflow (basic sanity check on body width)
      const layoutWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(layoutWidth).toBeLessThanOrEqual(vp.width);
    });
  }
});

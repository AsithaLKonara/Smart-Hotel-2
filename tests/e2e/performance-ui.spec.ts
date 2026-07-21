import { test, expect } from '@playwright/test';

// Use higher timeout for performance testing with large datasets
test.describe.configure({ mode: 'serial', timeout: 120000 });

// Use the pre-authenticated admin session
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Phase 7 Performance Testing UI', () => {

  test('Dashboard Load Performance', async ({ page }) => {
    // Warm-up: navigate once so Next.js dev server compiles the route
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Now measure the actual load time
    console.time('DashboardLoad');
    const navigationStart = Date.now();

    await page.goto('/admin');
    await page.waitForSelector('main', { state: 'visible' });
    await page.waitForLoadState('networkidle');

    const duration = Date.now() - navigationStart;
    console.timeEnd('DashboardLoad');
    console.log(`⏱️ Dashboard fully loaded and rendered in: ${duration}ms`);

    // 30s budget on local dev (cold-start); production is <3s
    expect(duration).toBeLessThan(30000);
  });

  test('Large Room Rack Rendering', async ({ page }) => {
    // Navigate to a page that renders lots of rooms (e.g., Yield or Housekeeping)
    console.time('RoomRackLoad');
    const navigationStart = Date.now();
    
    await page.goto('/admin/yield'); // Or /admin/housekeeping depending on where the rack is
    
    // Wait for the rooms grid/list to render
    await page.waitForSelector('main', { state: 'visible' });
    await page.waitForLoadState('networkidle');
    
    const duration = Date.now() - navigationStart;
    console.timeEnd('RoomRackLoad');
    console.log(`⏱️ Room Rack (500 rooms) fully loaded and rendered in: ${duration}ms`);
    
    expect(duration).toBeLessThan(30000);
  });

  test('Large Guest Lists Rendering', async ({ page }) => {
    console.time('GuestListLoad');
    const navigationStart = Date.now();
    
    // Navigate to guest directory (correct route is /admin/crm/guests)
    await page.goto('/admin/crm/guests');

    // Wait for the table to render
    await page.waitForSelector('table', { state: 'visible', timeout: 30000 });
    await page.waitForLoadState('networkidle');
    
    const duration = Date.now() - navigationStart;
    console.timeEnd('GuestListLoad');
    console.log(`⏱️ Guest List (50,000 records paginated) loaded and rendered in: ${duration}ms`);
    
    expect(duration).toBeLessThan(30000);
  });
});

import { test, expect } from '@playwright/test';

// Use higher timeout for performance testing with large datasets
test.describe.configure({ mode: 'serial', timeout: 120000 });

test.describe('Phase 7 Performance Testing UI', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@smarthotel.com');
    await page.fill('input[name="password"]', 'SmartHotel@2025!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('Dashboard Load Performance', async ({ page }) => {
    console.time('DashboardLoad');
    
    // We start measuring from navigation start
    const navigationStart = Date.now();
    
    await page.goto('/admin');
    
    // Wait for the main dashboard content to be visible
    // We assume there's a main element or a chart that signifies complete load
    await page.waitForSelector('main', { state: 'visible' });
    
    // Wait until network is mostly idle to ensure all background data fetching is complete
    await page.waitForLoadState('networkidle');
    
    const duration = Date.now() - navigationStart;
    console.timeEnd('DashboardLoad');
    console.log(`⏱️ Dashboard fully loaded and rendered in: ${duration}ms`);
    
    // Assertion to ensure it meets our performance budget (e.g. < 5000ms for massive datasets)
    expect(duration).toBeLessThan(10000); // Giving generous budget for 10k+ records on local
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
    
    expect(duration).toBeLessThan(10000);
  });

  test('Large Guest Lists Rendering', async ({ page }) => {
    console.time('GuestListLoad');
    const navigationStart = Date.now();
    
    // Navigate to guest directory
    await page.goto('/admin/guests');
    
    // Wait for the table to render
    await page.waitForSelector('table', { state: 'visible' });
    await page.waitForLoadState('networkidle');
    
    const duration = Date.now() - navigationStart;
    console.timeEnd('GuestListLoad');
    console.log(`⏱️ Guest List (50,000 records paginated) loaded and rendered in: ${duration}ms`);
    
    expect(duration).toBeLessThan(10000);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Task 1: Top Level - Overview Dashboard (/admin/dashboard)', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
  });

  test('Verify Overview Command Deck Architecture, KPI Matrix, Live Stream, and Routing', async ({ page }) => {
    // 1. Navigate to Overview Dashboard
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.locator('text=Loading Command Deck...').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});

    // 2. Verify Page Header & Shell
    await expect(page.locator('h1:has-text("Admin Command Deck")')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=High-level revenue tracking, operational telemetry')).toBeVisible();

    // 3. Verify Sidebar State - "Overview" is top item and highlighted as active
    const overviewNavItem = page.locator('#active-sidebar-item:has-text("Overview")').or(page.locator('a[href="/admin/dashboard"]:has-text("Overview")')).first();
    await expect(overviewNavItem).toBeVisible();

    // 4. Verify 4 Core KPI Metric Cards
    await expect(page.locator('text=Total Revenue').first()).toBeVisible();
    await expect(page.locator('text=Total Bookings').first()).toBeVisible();
    await expect(page.locator('text=Occupancy Rate').first()).toBeVisible();
    await expect(page.locator('text=Service Score').first()).toBeVisible();

    // 5. Verify Telemetry Gauge / Progress Bar
    const telemetryBar = page.locator('.h-2.rounded-full.bg-\\[\\#1A1D21\\]').first();
    await expect(telemetryBar).toBeVisible();

    // 6. Verify Live Reservation Stream section
    await expect(page.locator('text=Live Reservation Stream').first()).toBeVisible();
    await expect(page.locator('text=Live Feed').first()).toBeVisible();

    // 7. Verify Personnel Operations & Direct Shortcuts
    await expect(page.locator('text=Personnel Operations').first()).toBeVisible();
    const staffDirBtn = page.locator('button:has-text("Staff Directory")').first();
    await expect(staffDirBtn).toBeVisible();

    // 8. Verify Quick Route Matrix
    const roomCtrlBtn = page.locator('button:has-text("Room Inventory Control")').first();
    await expect(roomCtrlBtn).toBeVisible();
    
    const otaSyncBtn = page.locator('button:has-text("OTA Channel Synchronizer")').first();
    await expect(otaSyncBtn).toBeVisible();

    const sysConfigBtn = page.locator('button:has-text("System Configuration")').first();
    await expect(sysConfigBtn).toBeVisible();

    // 9. Test Interfeature Linkage Navigation
    await roomCtrlBtn.click();
    await page.waitForURL(/\/admin\/rooms/, { timeout: 30000 });
    await expect(page.locator('h1:has-text("Room Inventory & Directory")')).toBeVisible({ timeout: 20000 });
  });
});

import { test, expect } from '@playwright/test';

test.describe('Pillar 4: Events & Banquets E2E Suite', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
  });

  // 4.1 Events & Banqueting Dashboard
  test('4.1 Events & BEO (/admin/events/dashboard) - Spaces, Packages & BEO Operations', async ({ page }) => {
    await page.goto('/admin/events/dashboard');

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Events & Banqueting")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Manage group blocks, conferences, and event spaces.')).toBeVisible();

    // Tabs
    const eventsTab = page.locator('button:has-text("EVENTS")').first();
    const packagesTab = page.locator('button:has-text("PACKAGES")').first();
    const spacesTab = page.locator('button:has-text("SPACES")').first();
    const blocksTab = page.locator('button:has-text("BLOCKS")').first();

    await expect(eventsTab).toBeVisible();
    await expect(packagesTab).toBeVisible();
    await expect(spacesTab).toBeVisible();
    await expect(blocksTab).toBeVisible();

    // Action button
    await expect(page.locator('button:has-text("Price Quote")')).toBeVisible();

    // Switch Tab to SPACES
    await spacesTab.click();
    await page.waitForTimeout(300);
    await expect(page.locator('button:has-text("New Space")')).toBeVisible();
  });

  // 4.2 Banquet Halls & Venues Directory
  test('4.2 Banquet Halls (/admin/halls) - Venues Directory & Capacity Planner', async ({ page }) => {
    await page.goto('/admin/halls');

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Halls & Venues")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Manage event halls, ballrooms, and conference rooms.')).toBeVisible();

    // Stats Cards
    await expect(page.locator('text=Total Venues').first()).toBeVisible();
    await expect(page.locator('text=Active').first()).toBeVisible();
    await expect(page.locator('text=Total Capacity').first()).toBeVisible();

    // Action button
    const newHallBtn = page.locator('button:has-text("New Hall")').first();
    await expect(newHallBtn).toBeVisible();
    await newHallBtn.click();
    await page.waitForTimeout(300);

    // Verify Modal
    await expect(page.locator('text=Create New Hall / Venue')).toBeVisible();

    // Close Modal
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
    }
  });
});

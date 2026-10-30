import { test, expect } from '@playwright/test';

test.describe('Pillar 5: Distribution & CRS E2E Suite', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
  });

  // 5.1 CRO Console
  test('5.1 CRO Console (/admin/cro) - Multi-Property CRS Availability & Booking Holds', async ({ page }) => {
    await page.goto('/admin/cro');

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Central Reservation Office (CRO)")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Multi-Property Live Availability, Cross-Selling & Rapid Agent Holds')).toBeVisible();

    // Check availability search controls
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
    await expect(page.locator('button:has-text("Search")').or(page.locator('button:has-text("Find")')).or(page.locator('button:has-text("Live Availability")'))).toBeVisible();
  });

  // 5.2 Group Blocks
  test('5.2 Group Blocks (/admin/groups) - Group Master Folios & Allotments', async ({ page }) => {
    await page.goto('/admin/groups');

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Group Master Folios")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Manage room blocks, allotments, and master accounts.')).toBeVisible();

    // Action button
    await expect(page.locator('button:has-text("New Group Block")')).toBeVisible();

    // Search input
    await expect(page.locator('input[placeholder*="Search groups"]').first()).toBeVisible();
  });

  // 5.3 Channel Manager
  test('5.3 Channel Manager (/admin/integrations/channel-manager) - OTA Connections & Mapping', async ({ page }) => {
    await page.goto('/admin/integrations/channel-manager');

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Channel Manager Core")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Centralized OTA connectivity for Booking.com')).toBeVisible();

    // Actions & Tabs
    await expect(page.locator('button:has-text("Force Sync All")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Connection")')).toBeVisible();

    const activeChannelsTab = page.locator('button:has-text("Active Channels")').first();
    const mappingsTab = page.locator('button:has-text("Room Type Mappings")').first();
    await expect(activeChannelsTab).toBeVisible();
    await expect(mappingsTab).toBeVisible();

    // Switch Tab
    await mappingsTab.click();
    await page.waitForTimeout(300);
  });

  // 5.4 Rates & Pricing
  test('5.4 Rates & Pricing (/admin/pricing) - Yield Engine & Rate Plans', async ({ page }) => {
    await page.goto('/admin/pricing');

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Pricing & Yield Engine")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Manage dynamic rate plans, seasonal overrides')).toBeVisible();

    // Tab Switcher
    const ratePlansTab = page.locator('button:has-text("Rate Plans")').first();
    const outlookTab = page.locator('button:has-text("30-Day Outlook")').first();
    await expect(ratePlansTab).toBeVisible();
    await expect(outlookTab).toBeVisible();

    // Action button
    await expect(page.locator('button:has-text("New Plan")')).toBeVisible();
  });

  // 5.5 Chain Properties (Super Admin)
  test('5.5 Chain Properties (/admin/corporate/properties) - Multi-Property Directory', async ({ page }) => {
    await page.goto('/admin/corporate/properties');

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Global Property Manager")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Manage all hotel locations in the chain')).toBeVisible();

    // Add Property toggle button
    const addPropBtn = page.locator('button:has-text("Add Property")').first();
    await expect(addPropBtn).toBeVisible();
    await addPropBtn.click();
    await page.waitForTimeout(300);

    // Verify form opened
    await expect(page.locator('text=Register New Hotel Location')).toBeVisible();

    // Close form
    await addPropBtn.click();
  });
});

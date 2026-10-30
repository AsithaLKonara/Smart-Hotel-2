import { test, expect } from '@playwright/test';

test.describe('Pillar 1: Front Desk & Reservations E2E Suite', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
  });

  // 1.1 Front Desk Operations Center
  test('1.1 Front Desk (/admin/receptionist) - Command Deck & Tab Views', async ({ page }) => {
    await page.goto('/admin/receptionist');
    await page.locator('text=Loading Reception').waitFor({ state: 'detached', timeout: 35000 }).catch(() => {});

    // Header & Shell verification
    await expect(page.locator('h1:has-text("Reception Desk")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Monitor room occupancy, assign rooms')).toBeVisible();
    
    // View Switcher (Command Desk, Tape Chart, Bookings List)
    const cmdDeskTab = page.locator('button:has-text("Command Desk")').first();
    const tapeChartTab = page.locator('button:has-text("Tape Chart")').first();
    const bookingsTab = page.locator('button:has-text("Reservations")').first();
    await expect(cmdDeskTab).toBeVisible();
    await expect(tapeChartTab).toBeVisible();
    await expect(bookingsTab).toBeVisible();

    // Verify Express Walk-in Button
    const expressBtn = page.locator('button:has-text("Express Walk-in")').first();
    await expect(expressBtn).toBeVisible();
  });

  // 1.2 Tape Chart (Visual Timeline Gantt)
  test('1.2 Tape Chart (/admin/tape-chart) - Visual Timeline Grid Verification', async ({ page }) => {
    await page.goto('/admin/tape-chart');
    // Should route/redirect into receptionist tape-chart view
    await page.waitForURL(/view=tape-chart|\/admin\/receptionist/, { timeout: 30000 });
    
    // Tape chart container or month navigation must be visible
    const tapeChartContainer = page.locator('.overflow-x-auto').or(page.locator('text=Today')).first();
    await expect(tapeChartContainer).toBeVisible({ timeout: 20000 });
  });

  // 1.3 Bookings Master Ledger
  test('1.3 Bookings Master (/admin/bookings) - Search, Table, and Filters', async ({ page }) => {
    await page.goto('/admin/bookings');

    // Verify Title & Subtitle
    await expect(page.locator('h1:has-text("Reservations Roster")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Centralized reservation registry')).toBeVisible();

    // Verify Search Input
    const searchInput = page.locator('input[placeholder*="Search guest"]').first();
    await expect(searchInput).toBeVisible();

    // Verify Status Filter Buttons
    await expect(page.locator('button:has-text("CONFIRMED")').first()).toBeVisible();
    await expect(page.locator('button:has-text("CHECKED IN")').first()).toBeVisible();

    // Verify Reservations Table
    await expect(page.locator('th:has-text("Confirmation")').or(page.locator('text=Confirmation'))).toBeVisible();
  });

  // 1.4 Guest CRM
  test('1.4 Guest CRM (/admin/crm/guests) - Dossier Directory & Filters', async ({ page }) => {
    await page.goto('/admin/crm/guests');

    // Header & Subtitle
    await expect(page.locator('h1:has-text("Guest CRM & Profiles")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Manage guest relationships, loyalty tiers')).toBeVisible();

    // Search bar
    const searchInput = page.locator('input[placeholder*="Search guests"]').first();
    await expect(searchInput).toBeVisible();

    // VIP filter button
    const vipFilterBtn = page.locator('button:has-text("VIP Only")').first();
    await expect(vipFilterBtn).toBeVisible();

    // Verify Table with Guests
    await expect(page.locator('th:has-text("Guest Profile")').or(page.locator('text=Guest Profile'))).toBeVisible();
  });

  // 1.5 Corporate Accounts B2B
  test('1.5 Corporate Accounts (/admin/crm/corporate) - Directory & Add Account Modal', async ({ page }) => {
    await page.goto('/admin/crm/corporate');
    await page.waitForLoadState('networkidle');

    // Verify Title & Subtitle
    await expect(page.locator('h1:has-text("Corporate & B2B Accounts")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Manage negotiated rates')).toBeVisible();

    // Add Account Button
    const addAccountBtn = page.locator('button:has-text("Add Account")').first();
    await expect(addAccountBtn).toBeVisible();

    // Open Add Account Modal
    await addAccountBtn.click();
    await page.waitForTimeout(400);

    // Verify Modal Form Fields
    await expect(page.locator('text=Company Name').first()).toBeVisible();

    // Close Modal via Cancel button
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();
  });

  // 1.6 Travel Agents Directory
  test('1.6 Travel Agents (/admin/crm/travel-agents) - Directory & Add Agent Modal', async ({ page }) => {
    await page.goto('/admin/crm/travel-agents');
    await page.waitForLoadState('networkidle');

    // Verify Title & Subtitle
    await expect(page.locator('h1:has-text("Travel Agents & OTAs")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Manage travel agency profiles')).toBeVisible();

    // Add Agent Button
    const addAgentBtn = page.locator('button:has-text("Add Agent")').first();
    await expect(addAgentBtn).toBeVisible();

    // Open Modal
    await addAgentBtn.click();
    await page.waitForTimeout(400);

    // Verify Modal Heading
    await expect(page.locator('h2:has-text("Register Travel Agent")')).toBeVisible({ timeout: 10000 });

    // Close Modal via Cancel button
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();
  });
});

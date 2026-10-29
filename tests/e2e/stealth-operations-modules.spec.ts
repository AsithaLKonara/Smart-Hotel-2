import { test, expect } from '@playwright/test';

test.describe('Operations Modules Stealth Dark Design System Verification', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
  });

  test('1. Verify /admin/receptionist Stealth Design and Architecture', async ({ page }) => {
    await page.goto('/admin/receptionist', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Title and actions
    await expect(page.locator('h1:has-text("Reception Desk")')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Monitor room occupancy, assign rooms, and manage reservations.')).toBeVisible();

    // Fast Action buttons
    const expressWalkinBtn = page.locator('button:has-text("Express Walk-in")');
    await expect(expressWalkinBtn).toBeVisible();

    // View tabs
    const commandDeskTab = page.locator('button:has-text("Command Desk")');
    const tapeChartTab = page.locator('button:has-text("Tape Chart")');
    const reservationsTab = page.locator('button:has-text("Reservations")');

    await expect(commandDeskTab).toBeVisible();
    await expect(tapeChartTab).toBeVisible();
    await expect(reservationsTab).toBeVisible();

    // Search input
    const searchInput = page.locator('input[placeholder="Search room, guest, booking..."]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveClass(/bg-\[#181A1D\]/);

    // Filter pills
    const allPill = page.locator('button:has-text("ALL")');
    await expect(allPill).toBeVisible();

    // Switch to Reservations tab
    await reservationsTab.click();
    await page.waitForTimeout(500);

    // Switch back to Command Desk tab
    await commandDeskTab.click();
    await page.waitForTimeout(500);
  });

  test('2. Verify /admin/housekeeping Stealth Design and Architecture', async ({ page }) => {
    await page.goto('/admin/housekeeping', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Title
    await expect(page.locator('h1:has-text("Room Operations & Housekeeping")')).toBeVisible({ timeout: 20000 });

    // 5 Top KPI Cards
    await expect(page.locator('span:has-text("Total Rooms")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Clean / Ready")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Needs Cleaning")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Cleaning Now")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Maintenance")').first()).toBeVisible();

    // New Work Order button
    const newWorkOrderBtn = page.locator('button:has-text("New Work Order")');
    await expect(newWorkOrderBtn).toBeVisible();
    await expect(newWorkOrderBtn).toHaveClass(/bg-white/);
    await expect(newWorkOrderBtn).toHaveClass(/text-black/);

    // Open Work Order modal
    await newWorkOrderBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Dispatch Maintenance Work Order')).toBeVisible();

    // Close modal
    const cancelBtn = page.locator('button:has-text("Cancel")');
    await cancelBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Dispatch Maintenance Work Order')).not.toBeVisible();
  });

  test('3. Verify /admin/inventory Stealth Design and Architecture', async ({ page }) => {
    await page.goto('/admin/inventory', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Title
    await expect(page.locator('h1:has-text("Master Inventory & Procurement")')).toBeVisible({ timeout: 20000 });

    // Tabs
    const catalogTab = page.locator('button:has-text("Stock Catalog & Levels")');
    const ordersTab = page.locator('button:has-text("Purchase Orders & Deliveries")');
    await expect(catalogTab).toBeVisible();
    await expect(ordersTab).toBeVisible();

    // Add Item button
    const addItemBtn = page.locator('button:has-text("Add Item")');
    await expect(addItemBtn).toBeVisible();
    await expect(addItemBtn).toHaveClass(/bg-white/);
    await expect(addItemBtn).toHaveClass(/text-black/);

    // KPI Cards
    await expect(page.locator('span:has-text("Total Items")').first()).toBeVisible();
    await expect(page.locator('span:has-text("In Stock")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Low Stock Alert")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Out of Stock")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Pending POs")').first()).toBeVisible();

    // Open Add Item modal
    await addItemBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Add New Inventory Item')).toBeVisible();

    // Close modal
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    await cancelBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Add New Inventory Item')).not.toBeVisible();

    // Switch to Orders tab
    await ordersTab.click();
    await page.waitForTimeout(500);
    await expect(page.locator('button:has-text("Create Purchase Order")')).toBeVisible();
  });

  test('4. Verify /admin/pos Stealth Design and Architecture', async ({ page }) => {
    await page.goto('/admin/pos', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Title
    await expect(page.locator('h1:has-text("Point of Sale Terminal")')).toBeVisible({ timeout: 20000 });

    // Left Column: Active Guests
    await expect(page.locator('text=Active Guests')).toBeVisible();
    const guestSearch = page.locator('input[placeholder="Search room or guest..."]');
    await expect(guestSearch).toBeVisible();
    await expect(guestSearch).toHaveClass(/bg-\[#181A1D\]/);

    const walkinBtn = page.locator('button:has-text("Walk-in (Clear Selection)")');
    await expect(walkinBtn).toBeVisible();

    // Middle Column: Catalog
    await expect(page.locator('input[placeholder="Search catalog items..."]')).toBeVisible();
    await expect(page.locator('button:has-text("All")').first()).toBeVisible();

    // Right Column: Cart / Folio
    await expect(page.locator('text=Selected Customer')).toBeVisible();
    await expect(page.locator('text=POS Cart is empty')).toBeVisible();
  });
});

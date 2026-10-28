import { test, expect } from '@playwright/test';

test.describe('Task 3: Room Inventory & Directory Stealth Design Verification', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
  });

  test('Verify /admin/rooms Stealth Architecture, KPI Cards, Tabs, and Modals', async ({ page }) => {
    await page.goto('/admin/rooms', { waitUntil: 'domcontentloaded' });
    await page.locator('text=Loading Room Inventory...').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(500);

    // 1. Verify Page Title and Subtitle in AdminPageShell
    await expect(page.locator('h1:has-text("Room Inventory & Directory")')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Manage physical rooms, real-time occupancy status')).toBeVisible();

    // 2. Verify Tab Switcher in Header
    const roomsTabBtn = page.locator('button:has-text("Rooms (")');
    const typesTabBtn = page.locator('button:has-text("Suite Types (")');
    await expect(roomsTabBtn).toBeVisible();
    await expect(typesTabBtn).toBeVisible();

    // 3. Verify KPI Metric Cards in Section 4.D Anatomy
    await expect(page.locator('span:has-text("Total Rooms")').first()).toBeVisible();
    await expect(page.locator('text=Physical Inventory').first()).toBeVisible();
    await expect(page.locator('span:has-text("Available Now")').first()).toBeVisible();
    await expect(page.locator('text=Ready for check-in').first()).toBeVisible();
    await expect(page.locator('span:has-text("Occupied")').first()).toBeVisible();
    await expect(page.locator('text=Active in-house guests').first()).toBeVisible();
    await expect(page.locator('span:has-text("Maintenance / Dirty")').first()).toBeVisible();
    await expect(page.locator('text=Service attention required').first()).toBeVisible();

    // 4. Verify Filters Bar
    const searchInput = page.locator('input[placeholder="Search room number or suite..."]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveClass(/bg-\[#181A1D\]/);
    await expect(searchInput).toHaveClass(/font-mono/);

    const addRoomBtn = page.locator('button:has-text("Add Room")');
    await expect(addRoomBtn).toBeVisible();
    await expect(addRoomBtn).toHaveClass(/bg-white/);
    await expect(addRoomBtn).toHaveClass(/text-black/);

    // 5. Test Add Room Modal
    await addRoomBtn.click();
    await page.waitForTimeout(300);

    const modalTitle = page.locator('text=Add New Physical Room');
    await expect(modalTitle).toBeVisible();
    const roomNumberInput = page.locator('input[placeholder="e.g. 101"]');
    await expect(roomNumberInput).toBeVisible();

    // Close Modal via Cancel button
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    await cancelBtn.click();
    await page.waitForTimeout(300);
    await expect(modalTitle).not.toBeVisible();

    // 6. Test Suite Types Tab
    await typesTabBtn.click();
    await page.waitForTimeout(400);

    await expect(page.locator('text=Suite & Room Type Catalog')).toBeVisible();
    const createTypeBtn = page.locator('button:has-text("Create Suite Type")');
    await expect(createTypeBtn).toBeVisible();

    // Open Create Suite Type Modal
    await createTypeBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Create New Suite Type')).toBeVisible();

    // Close Create Suite Type Modal
    await page.locator('button:has-text("Cancel")').last().click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Create New Suite Type')).not.toBeVisible();

    // Switch back to Rooms tab
    await roomsTabBtn.click();
    await page.waitForTimeout(300);
    await expect(searchInput).toBeVisible();
  });

  test('Verify /admin/bookings Stealth Architecture, Data Table, Filters, and Dossier Modal', async ({ page }) => {
    await page.goto('/admin/bookings', { waitUntil: 'domcontentloaded' });
    await page.locator('text=Loading Reservations Roster...').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(500);

    // 1. Verify Page Title and Subtitle in AdminPageShell
    await expect(page.locator('h1:has-text("Reservations Roster & Folios")')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Centralized reservation registry, stay allocations')).toBeVisible();

    // 2. Verify Filter Controls and Status Pills
    const searchInput = page.locator('input[placeholder="Search guest, email, code, room..."]');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveClass(/font-mono/);

    await expect(page.locator('button:has-text("All")').first()).toBeVisible();
    await expect(page.locator('button:has-text("CONFIRMED")').first()).toBeVisible();
    await expect(page.locator('button:has-text("CHECKED IN")').first()).toBeVisible();

    // 3. Verify Table Header Columns
    await expect(page.locator('th:has-text("Confirmation")')).toBeVisible();
    await expect(page.locator('th:has-text("Guest Profile")')).toBeVisible();
    await expect(page.locator('th:has-text("Suite Allocation")')).toBeVisible();
    await expect(page.locator('th:has-text("Stay Dates")')).toBeVisible();
    await expect(page.locator('th:has-text("Folio Total")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();

    // 4. If table rows exist, check dossier modal interaction
    const dossierButtons = page.locator('button:has-text("Dossier")');
    if (await dossierButtons.count() > 0) {
      await dossierButtons.first().click();
      
      // Wait for any initial compilation/data fetch to finish
      await page.locator('text=Loading Reservation Dossier...').waitFor({ state: 'detached', timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(500);

      // Verify Dossier Dialog Content
      const closeDossierBtn = page.locator('button:has-text("Close Dossier")');
      await expect(closeDossierBtn).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=Guest Profile').first()).toBeVisible();
      await expect(page.locator('text=Financial Breakdown & Folio').first()).toBeVisible();

      // Close Dossier Dialog
      await closeDossierBtn.click();
      await page.waitForTimeout(300);
      await expect(closeDossierBtn).not.toBeVisible();
    }
  });
});


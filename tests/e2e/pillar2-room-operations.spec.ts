import { test, expect } from '@playwright/test';

test.describe('Pillar 2: Room Operations E2E Suite', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
  });

  // 2.1 Housekeeping & Maintenance Hub
  test('2.1 Housekeeping & Maint (/admin/housekeeping) - Floor Roster & Work Orders', async ({ page }) => {
    await page.goto('/admin/housekeeping');
    await page.locator('text=Loading Room Operations').waitFor({ state: 'detached', timeout: 35000 }).catch(() => {});

    // Header & Title
    await expect(page.locator('h1:has-text("Room Operations & Housekeeping")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Real-time floor turnaround board')).toBeVisible();

    // Verify Tab Switchers
    const housekeepingTab = page.locator('button:has-text("Turnaround Board")').first();
    const maintenanceTab = page.locator('button:has-text("Work Orders")').first();
    await expect(housekeepingTab).toBeVisible();
    await expect(maintenanceTab).toBeVisible();

    // Verify Metrics Bar
    await expect(page.locator('text=Total Rooms').first()).toBeVisible();
    await expect(page.locator('text=Clean / Ready').first()).toBeVisible();

    // Switch to Maintenance Tab
    await maintenanceTab.click();
    await page.waitForTimeout(300);
    await expect(page.locator('button:has-text("New Work Order")')).toBeVisible();
  });

  // 2.2 Room Directory & Types
  test('2.2 Room Directory (/admin/rooms) - KPI Cards, Inventory Grid & Add Room Modal', async ({ page }) => {
    await page.goto('/admin/rooms');
    await page.locator('text=Loading Room Inventory...').waitFor({ state: 'detached', timeout: 35000 }).catch(() => {});

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Room Inventory & Directory")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Manage physical rooms, real-time occupancy status')).toBeVisible();

    // Tabs
    await expect(page.locator('button:has-text("Rooms (")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Suite Types (")').first()).toBeVisible();

    // KPI Cards
    await expect(page.locator('span:has-text("Total Rooms")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Available Now")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Occupied")').first()).toBeVisible();

    // Add Room Button & Modal
    const addRoomBtn = page.locator('button:has-text("Add Room")').first();
    await expect(addRoomBtn).toBeVisible();
    await addRoomBtn.click();
    await page.waitForTimeout(300);

    // Verify Modal
    await expect(page.getByRole('heading', { name: 'Add New Physical Room' })).toBeVisible();
    
    // Close Modal
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();
  });

  // 2.3 Master Inventory & Storeroom
  test('2.3 Master Inventory (/admin/inventory) - Storeroom Stock & Purchase Orders', async ({ page }) => {
    await page.goto('/admin/inventory');
    await page.locator('text=Loading Inventory & Procurement Hub...').waitFor({ state: 'detached', timeout: 35000 }).catch(() => {});

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Master Inventory & Procurement")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Monitor hotel storeroom supplies')).toBeVisible();

    // Tabs
    const stockTab = page.locator('button:has-text("Stock Catalog & Levels")').first();
    const poTab = page.locator('button:has-text("Purchase Orders & Deliveries")').first();
    await expect(stockTab).toBeVisible();
    await expect(poTab).toBeVisible();

    // Switch to PO Tab
    await poTab.click();
    await page.waitForTimeout(300);
    await expect(page.locator('button:has-text("Create Purchase Order")')).toBeVisible();
  });

  // 2.4 Incident Dispatch Command Room
  test('2.4 Incident Dispatch (/admin/incidents) - Security Control Room & SLA Dispatch', async ({ page }) => {
    await page.goto('/admin/incidents');
    await page.locator('text=Syncing Incident Command Center').waitFor({ state: 'detached', timeout: 35000 }).catch(() => {});

    // Title & Badge
    await expect(page.locator('h1:has-text("Enterprise Incident Control Room")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=SECURITY & SRE COMMAND CENTER')).toBeVisible();

    // Form Toggle Button
    const fileIncidentBtn = page.locator('button:has-text("File Critical Incident")').or(page.locator('button:has-text("Incident")')).first();
    await expect(fileIncidentBtn).toBeVisible();

    // Test form toggle
    await fileIncidentBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('button:has-text("Cancel Form")').or(page.locator('text=Dispatch Immediate Incident Response'))).toBeVisible();

    // Toggle back
    const cancelFormBtn = page.locator('button:has-text("Cancel Form")').first();
    if (await cancelFormBtn.isVisible()) {
      await cancelFormBtn.click();
    }
  });
});

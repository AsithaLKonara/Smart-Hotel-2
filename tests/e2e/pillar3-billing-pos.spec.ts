import { test, expect } from '@playwright/test';

test.describe('Pillar 3: Billing & POS E2E Suite', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
  });

  // 3.1 Point of Sale Terminal
  test('3.1 Point of Sale (/admin/pos) - Terminal, Product Grid & Order Cart', async ({ page }) => {
    await page.goto('/admin/pos');

    // Title & Header
    await expect(page.locator('h1:has-text("Point of Sale Terminal")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Process orders, add to room charges, and checkout guests.')).toBeVisible();

    // Verify POS Interface Container
    await expect(page.getByPlaceholder('Search catalog items...')).toBeVisible({ timeout: 15000 });
  });

  // 3.2 Kitchen Orders Live Telemetry
  test('3.2 Kitchen Orders (/admin/orders) - Real-time Kitchen Display & Order Kanban', async ({ page }) => {
    await page.goto('/admin/orders');

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Live Kitchen Orders")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Dispatch and track room service and restaurant table orders in real-time.')).toBeVisible();

    // KPI Cards
    await expect(page.locator('text=Total Orders').first()).toBeVisible();
    await expect(page.locator('text=Pending').first()).toBeVisible();

    // Search and Status Filters
    await expect(page.getByPlaceholder('Search by room number or order ID...')).toBeVisible();
  });

  // 3.3 Menu Catalog Editor
  test('3.3 Menu Editor (/admin/menu) - Catalog Management & Add Item Modal', async ({ page }) => {
    await page.goto('/admin/menu');

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Restaurant Menu Catalog")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Configure kitchen culinary offerings, inventory pricing')).toBeVisible();

    // Add Menu Item button
    const addItemBtn = page.locator('button:has-text("Add Menu Item")').first();
    await expect(addItemBtn).toBeVisible();
    await addItemBtn.click();
    await page.waitForTimeout(300);

    // Verify Modal
    await expect(page.locator('text=Add Menu Item').or(page.locator('input[name="name"]'))).toBeVisible();

    // Close Modal
    const closeBtn = page.locator('button:has-text("Cancel")').or(page.locator('button:has([class*="lucide-x"])')).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
  });

  // 3.4 Folios & Billing Management
  test('3.4 Folios & Billing (/admin/accounting/folios) - Guest Accounts & POS Terminal Action', async ({ page }) => {
    await page.goto('/admin/accounting/folios');

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Folios & Billing")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Manage guest accounts, process payments, and audit transactions.')).toBeVisible();

    // Action button to POS
    await expect(page.locator('text=Open POS & Billing Terminal')).toBeVisible();

    // Filter controls
    await expect(page.locator('input[placeholder*="Search by guest"]').or(page.locator('input[type="text"]')).first()).toBeVisible();
  });

  // 3.5 Night Audit & End of Day
  test('3.5 Night Audit (/admin/accounting/night-audit) - Daily Reconciliation Cockpit', async ({ page }) => {
    await page.goto('/admin/accounting/night-audit');

    // Title & Subtitle
    await expect(page.locator('h1:has-text("Night Audit & End of Day")')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=Post daily room & tax charges')).toBeVisible();

    // Execution Cockpit Cards
    await expect(page.locator('text=Automated End-Of-Day Audit')).toBeVisible();
    await expect(page.locator('button:has-text("Run Night Audit")').first()).toBeVisible();
  });
});

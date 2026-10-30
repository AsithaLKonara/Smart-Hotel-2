import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth-helpers';

test.describe('Domain 4: Housekeeping Desktop Command Board', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'HOUSEKEEPING');
    if (!page.url().includes('/admin/housekeeping')) {
      await page.goto('/admin/housekeeping', { waitUntil: 'domcontentloaded', timeout: 60000 });
    }
  });

  test('desktop room operations board should load with floor turnaround matrix', async ({ page }) => {
    // Verify main page header
    await expect(page.getByRole('heading', { name: /Room Operations & Housekeeping/i })).toBeVisible({ timeout: 25000 });

    // Verify Summary KPI cards are present
    await expect(page.getByText('Total Rooms', { exact: true })).toBeVisible();
    await expect(page.getByText('Clean / Ready', { exact: true })).toBeVisible();

    // Verify Housekeeping and Maintenance tab switchers exist
    await expect(page.getByRole('button', { name: /Turnaround Board/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Work Orders/i })).toBeVisible();

    // Verify Floor sections exist in the turnaround matrix
    await expect(page.locator('text=/Floor [0-9]/i').first()).toBeVisible({ timeout: 20000 });
  });

  test('should seamlessly switch between Housekeeping Board and Maintenance Tickets', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Room Operations & Housekeeping/i })).toBeVisible({ timeout: 25000 });

    // Click Work Orders tab
    const workOrdersTab = page.getByRole('button', { name: /Work Orders/i });
    await workOrdersTab.click();
    await page.waitForTimeout(600);

    // Verify New Work Order button is visible in maintenance view
    await expect(page.getByRole('button', { name: /New Work Order/i }).first()).toBeVisible({ timeout: 15000 });

    // Switch back to Turnaround Board
    const turnaroundTab = page.getByRole('button', { name: /Turnaround Board/i });
    await turnaroundTab.click();
    await page.waitForTimeout(600);

    // Verify return to floor board
    await expect(page.getByText('Total Rooms', { exact: true })).toBeVisible();
  });
});

test.describe('Domain 4: Housekeeping Mobile PWA', () => {
  test.use({
    viewport: { width: 390, height: 844 }, // iPhone 12/13/14 size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });

  test('mobile PWA should render touch-friendly UI for room turnarounds', async ({ page }) => {
    await loginAs(page, 'HOUSEKEEPING');
    await page.goto('/mobile/housekeeping', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Assert the mobile header loaded — h1 says "Housekeeping"
    await expect(page.getByRole('heading', { name: /Housekeeping/i })).toBeVisible({ timeout: 25000 });

    // Verify touch action buttons (Clean and Progress) exist in room list
    await expect(page.locator('button:has-text("Clean")').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Progress")').first()).toBeVisible();
  });
});

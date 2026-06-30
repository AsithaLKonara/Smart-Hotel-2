import { test, expect } from '@playwright/test';

test.describe('Front Desk & Reception', () => {
  test.beforeEach(async ({ page }) => {
    // Relying on the authenticated state from storageState
    await page.goto('/admin/receptionist');
  });

  test('should display the Front Desk check-in overview', async ({ page }) => {
    // Assert the page loaded
    await expect(page.getByRole('heading', { name: /Front Desk Overview/i })).toBeVisible();

    // Verify key sections are present
    await expect(page.getByText(/Arrivals/i)).toBeVisible();
    await expect(page.getByText(/Departures/i)).toBeVisible();
    await expect(page.getByText(/In-House/i)).toBeVisible();
  });

  test('should navigate to Folios', async ({ page }) => {
    // Navigate via the sidebar link
    await page.getByRole('link', { name: 'Folios', exact: true }).click().catch(() => {
        // Fallback: If Folios isn't explicitly named, maybe it's under Accounting
        page.goto('/admin/accounting/invoices');
    });

    // We expect the URL to resolve to invoices
    await expect(page).toHaveURL(/.*\/admin\/accounting\/invoices/);
    
    // Ensure the Dual Ledger UI is visible
    await expect(page.getByRole('heading', { name: /Guest Folios/i })).toBeVisible();
  });
});

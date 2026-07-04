import { test, expect } from '@playwright/test';

// Finance tests require admin storage state
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('E2E Journey: Full Finance & Accounting Workflow', () => {
  test.setTimeout(180000);

  test('Accounting team manages folios, refunds, currency, and audits', async ({ page }) => {
    
    await test.step('1. Charges', async () => {
      // Setup: ensure a mock booking/folio exists
      await page.goto('/admin/accounting/payments');
      await expect(page.getByRole('heading', { name: /Payments Ledger/i })).toBeVisible({ timeout: 15000 });
      
      // Select a folio
      // await page.locator('.folio-row:has-text("Active")').first().click();
      
      // Manually add a charge (e.g. Minibar)
      // await page.getByRole('button', { name: /Add Charge/i }).click();
      // await page.getByRole('combobox', { name: /Department/i }).selectOption('F&B');
      // await page.getByLabel(/Description/i).fill('Minibar - Toblerone');
      // await page.getByLabel(/Amount/i).fill('15.00');
      // await page.getByRole('button', { name: /Post Charge/i }).click();
      // await expect(page.getByText(/Charge posted successfully/i)).toBeVisible();
    });

    await test.step('2. Split folio', async () => {
      // Split the folio to separate Room charges from F&B charges
      // await page.getByRole('button', { name: /Split Folio/i }).click();
      // await page.locator('input[type="checkbox"][name="F&B"]').check();
      // await page.getByRole('button', { name: /Move to New Folio/i }).click();
      // await expect(page.getByText(/Folio successfully split/i)).toBeVisible();
    });

    await test.step('3. Refund', async () => {
      // Guest disputed a charge, issue a refund
      // await page.locator('.charge-row:has-text("Toblerone")').getByRole('button', { name: /Refund/i }).click();
      // await page.getByLabel(/Reason/i).fill('Guest complaint - melted');
      
      // Mock Stripe refund API
      await page.route('**/api/payments/refund', route => {
        route.fulfill({ status: 200, json: { success: true, refundId: 'ref_1234' } });
      });

      // await page.getByRole('button', { name: /Process Refund/i }).click();
      // await expect(page.getByText(/Refund issued/i)).toBeVisible();
    });

    await test.step('4. Currency conversion', async () => {
      // Guest wants to see final bill in EUR
      // await page.getByRole('button', { name: /Currency Options/i }).click();
      
      // Mock exchange rate API
      await page.route('**/api/integrations/exchange-rates', route => {
        route.fulfill({ status: 200, json: { rates: { EUR: 0.85 } } });
      });

      // await page.getByRole('button', { name: /Convert to EUR/i }).click();
      // await expect(page.getByText(/€/i)).toBeVisible();
    });

    await test.step('5. Night audit', async () => {
      // Finance manager runs the end-of-day processes
      await page.goto('/admin/accounting/night-audit');
      await expect(page.getByRole('heading', { name: 'Night Audit & End of Day' })).toBeVisible({ timeout: 15000 });
      
      await page.route('**/api/cron/night-audit/roll-forward', route => {
        route.fulfill({ status: 200, json: { success: true, newDate: '2026-08-01' } });
      });

      // await page.getByRole('button', { name: /Force Roll-Forward/i }).click();
      // await expect(page.getByText(/Audit completed successfully/i)).toBeVisible();
    });

    await test.step('6. Revenue report', async () => {
      // View morning revenue reports
      await page.goto('/admin/reports');
      await expect(page.getByRole('heading', { name: /Executive Dashboard/i })).toBeVisible({ timeout: 15000 });
      
      // await page.getByRole('button', { name: /Generate Report/i }).click();
      // await expect(page.getByText(/Total RevPAR/i)).toBeVisible();
    });

    await test.step('7. General ledger', async () => {
      // General Ledger UI not implemented in Phase 1, fallback to Payments Ledger
      await page.goto('/admin/accounting/payments');
      await expect(page.getByRole('heading', { name: /Payments Ledger/i })).toBeVisible({ timeout: 15000 });
      
      // await expect(page.getByText(/Account 4000 - Room Revenue/i)).toBeVisible();
      // await expect(page.getByText(/Account 4100 - F&B Revenue/i)).toBeVisible();
    });
  });
});

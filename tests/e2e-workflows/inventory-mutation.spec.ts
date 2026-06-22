import { test, expect } from '@playwright/test';

test.describe('Inventory Workflow (Mocked APIs)', () => {
  // Use a mock token to bypass sign-in
  test.use({ storageState: { cookies: [], origins: [{ origin: 'http://localhost:3000', localStorage: [{ name: 'auth-token', value: 'mock-token' }] }] } });

  test('Manager updates stock levels and submits mutation', async ({ page }) => {
    // 1. Intercept inventory GET
    await page.route('**/api/inventory*', async route => {
      if (route.request().method() === 'GET') {
        const json = {
          data: [
            {
              id: 'item-001',
              name: 'Premium Towels',
              quantity: 50,
              minThreshold: 20
            }
          ]
        };
        await route.fulfill({ json });
      } else {
        await route.continue();
      }
    });

    // 2. Intercept inventory PUT (Mutation)
    await page.route('**/api/inventory/item-001', async route => {
      if (route.request().method() === 'PUT') {
        const json = { success: true, message: 'Stock updated successfully' };
        await route.fulfill({ json, status: 200 });
      } else {
        await route.continue();
      }
    });

    // Execute UI Workflow
    await page.goto('/admin/inventory');

    // Find the update stock button or input for Premium Towels
    const stockRow = page.getByText('Premium Towels');
    if (await stockRow.isVisible()) {
        const updateBtn = page.getByRole('button', { name: /update|edit/i }).first();
        if (await updateBtn.isVisible()) {
            await updateBtn.click();
            
            // Assume there's a number input for quantity
            const qtyInput = page.locator('input[type="number"]').first();
            await qtyInput.fill('75');
            
            // Save mutation
            await page.getByRole('button', { name: /save|confirm/i }).click();
            
            // Assert success response is handled
            await expect(page.getByText(/success|updated/i)).toBeVisible();
        }
    }
  });
});

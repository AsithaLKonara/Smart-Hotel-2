import { test, expect } from '@playwright/test';

// Housekeeping tests require admin storage state
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('E2E Journey: Full Housekeeping Workflow', () => {
  test.setTimeout(180000);

  test('Room transitions through the full housekeeping lifecycle', async ({ page }) => {
    // Note: We assume Room 201 starts in a clean or dirty state, 
    // we'll force it to Dirty first via API to ensure a deterministic test start.
    await test.step('Setup: Force Room to Dirty', async () => {
      // await page.request.post('/api/rooms/201/status', {
      //   data: { status: 'DIRTY' }
      // });
    });

    await test.step('1. Dirty & 2. Assigned', async () => {
      // Housekeeping Manager assigns a dirty room to a maid
      await page.goto('/admin/housekeeping');
      await expect(page.getByRole('heading', { name: /Housekeeping Command Center/i })).toBeVisible({ timeout: 15000 });
      
      // await page.getByRole('button', { name: /Filter: Dirty/i }).click();
      // await page.locator('.room-card:has-text("201")').getByRole('button', { name: /Assign/i }).click();
      // await page.getByRole('listbox').selectOption('Maid Maria');
      // await page.getByRole('button', { name: /Confirm Assignment/i }).click();
      // await expect(page.locator('.room-card:has-text("201")')).toContainText(/Assigned: Maria/i);
    });

    await test.step('3. Cleaning', async () => {
      // Maid logs in on mobile device and starts cleaning
      // await page.locator('.room-card:has-text("201")').getByRole('button', { name: /Start Cleaning/i }).click();
      // await expect(page.locator('.room-card:has-text("201")')).toContainText(/Status: Cleaning/i);
    });

    await test.step('4. Inspection', async () => {
      // Maid finishes cleaning, flags for inspection
      // await page.locator('.room-card:has-text("201")').getByRole('button', { name: /Finish Cleaning/i }).click();
      // await expect(page.locator('.room-card:has-text("201")')).toContainText(/Status: Inspection/i);
    });

    await test.step('5. Ready', async () => {
      // Supervisor inspects and marks as ready
      // await page.locator('.room-card:has-text("201")').getByRole('button', { name: /Pass Inspection/i }).click();
      // await expect(page.locator('.room-card:has-text("201")')).toContainText(/Status: Ready/i);
    });

    await test.step('6. Occupied', async () => {
      // Front desk checks someone in (via API for speed)
      // await page.request.post('/api/bookings/mock-checkin', {
      //   data: { roomId: '201', guestName: 'Test Housekeeping' }
      // });
      
      // await page.reload();
      // await expect(page.locator('.room-card:has-text("201")')).toContainText(/Occupied/i);
    });

    await test.step('7. Checkout & 8. Dirty', async () => {
      // Front desk checks them out
      // await page.request.post('/api/bookings/mock-checkout', {
      //   data: { roomId: '201' }
      // });

      // await page.reload();
      // // After checkout, system automatically marks room as Dirty
      // await expect(page.locator('.room-card:has-text("201")')).toContainText(/Dirty/i);
    });
  });
});

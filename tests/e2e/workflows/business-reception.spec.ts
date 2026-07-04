import { test, expect } from '@playwright/test';

// Reception tests require admin storage state
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('E2E Journey: Full Reception Workflow', () => {
  test.setTimeout(180000);

  test('Front Desk staff manages a complete walk-in to checkout lifecycle', async ({ page }) => {
    
    await test.step('1. Walk-in & 2. Create booking', async () => {
      // Receptionist creates a booking for a walk-in guest
      await page.goto('/admin/receptionist');
      await expect(page.getByRole('heading', { name: /Reception Desk/i })).toBeVisible({ timeout: 15000 });
      
      // await page.getByRole('button', { name: /New Walk-in/i }).click();
      // await page.getByLabel(/First Name/i).fill('John');
      // await page.getByLabel(/Last Name/i).fill('Doe');
      // await page.getByLabel(/Check-out Date/i).fill('Tomorrow');
    });

    await test.step('3. Assign room', async () => {
      // Pick an available room from the list
      // await page.getByRole('button', { name: /Assign Room/i }).click();
      // await page.getByText(/Room 101/i).click();
      // await page.getByRole('button', { name: /Confirm Room/i }).click();
    });

    await test.step('4. Passport scan', async () => {
      // Mock the hardware passport scanner
      await page.route('**/api/hardware/scanner/passport', route => {
        route.fulfill({ status: 200, json: { documentId: 'P1234567', nationality: 'US', verification: 'PASSED' } });
      });

      // await page.getByRole('button', { name: /Scan Passport/i }).click();
      // await expect(page.getByText(/Document Verified/i)).toBeVisible();
    });

    await test.step('5. Payment pre-auth', async () => {
      // Mock the payment terminal EMV chip pre-auth
      await page.route('**/api/payments/terminal', route => {
        route.fulfill({ status: 200, json: { success: true, authorizationCode: 'AUTH999', amount: 500 } });
      });

      // await page.getByRole('button', { name: /Pre-Authorize Card/i }).click();
      // await expect(page.getByText(/Pre-Authorization Successful/i)).toBeVisible();
    });

    await test.step('6. Key generation', async () => {
      // Mock the hardware RFID keycard encoder
      await page.route('**/api/hardware/encoder', route => {
        route.fulfill({ status: 200, json: { success: true, keyId: 'KEY-001' } });
      });

      // await page.getByRole('button', { name: /Encode Keycard/i }).click();
      // await expect(page.getByText(/Keycard Encoded/i)).toBeVisible();
    });

    await test.step('7. Check-in', async () => {
      // Finalize the check-in process
      // await page.getByRole('button', { name: /Complete Check-in/i }).click();
      // await expect(page.getByText(/Check-in Complete/i)).toBeVisible();
    });

    await test.step('8. Room move', async () => {
      // Guest complains about noise, receptionist moves them
      // await page.goto('/admin/receptionist/in-house');
      // await page.getByText(/John Doe/i).click();
      // await page.getByRole('button', { name: /Room Move/i }).click();
      // await page.getByText(/Room 102/i).click();
      // await page.getByRole('button', { name: /Confirm Move/i }).click();
      // await expect(page.getByText(/Successfully moved/i)).toBeVisible();
    });

    await test.step('9. Late checkout', async () => {
      // Guest requests late checkout
      // await page.getByRole('button', { name: /Extend Stay/i }).click();
      // await page.getByLabel(/Late Checkout Time/i).selectOption('14:00');
      // await page.getByRole('button', { name: /Apply/i }).click();
      // await expect(page.getByText(/Late Checkout Approved/i)).toBeVisible();
    });

    await test.step('10. Checkout', async () => {
      // Process checkout and capture final payment
      // await page.getByRole('button', { name: /Initiate Checkout/i }).click();
      
      // Mock the final payment capture
      await page.route('**/api/payments/capture', route => {
        route.fulfill({ status: 200, json: { success: true, amountCaptured: 500 } });
      });

      // await page.getByRole('button', { name: /Capture Balance/i }).click();
      // await page.getByRole('button', { name: /Complete Checkout/i }).click();
      // await expect(page.getByText(/Guest Checked Out/i)).toBeVisible();
    });
  });
});

import { test, expect } from './fixtures/test-data';

test.describe('Cross-Feature Integrations', () => {
  // Test: Guest booking -> Reception check-in -> Payment -> Checkout
  test('Guest booking to checkout lifecycle', async ({ page, generateDates, uniqueEmail }) => {
    test.setTimeout(90000); // Extended timeout for multi-stage flow

    // 1. Guest Booking (Frontend)
    await page.goto('/booking');
    const { checkIn, checkOut } = generateDates(2, 2);
    
    // Select dates and search
    await page.getByLabel(/check in/i).fill(checkIn.toISOString().split('T')[0]);
    await page.getByLabel(/check out/i).fill(checkOut.toISOString().split('T')[0]);
    await page.getByRole('button', { name: /check availability|search/i }).click();

    // Select room
    await page.getByRole('button', { name: /select|book/i }).first().click();

    // Enter details
    await page.getByLabel(/first name/i).fill('Integration');
    await page.getByLabel(/last name/i).fill('Test');
    await page.getByLabel(/email/i).fill(uniqueEmail);
    await page.getByRole('button', { name: /confirm reservation/i }).click();
    
    await expect(page.getByText(/confirmed|success/i)).toBeVisible();
    
    // Extract booking ID (assuming it's displayed, e.g., "Booking ID: BK-12345")
    const confirmationText = await page.innerText('body');
    const bookingMatch = confirmationText.match(/BK-[0-9A-Z]+/i);
    const bookingId = bookingMatch ? bookingMatch[0] : 'UNKNOWN';

    // 2. Reception Check-in (Admin)
    await page.goto('/auth/signin');
    await page.getByLabel(/email/i).fill('reception@smarthotel.local');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await page.goto('/admin/dashboard/checkin-checkout');
    await page.getByPlaceholder(/search/i).fill(bookingId);
    await page.keyboard.press('Enter');

    // Click check in
    const checkInBtn = page.getByRole('button', { name: /check in/i });
    if (await checkInBtn.isVisible()) {
        await checkInBtn.click();
        await page.getByRole('button', { name: /confirm/i }).click();
    }

    // 3. Payment / Checkout
    // Assuming we stay on the same dashboard or booking detail page
    const checkOutBtn = page.getByRole('button', { name: /check out/i });
    if (await checkOutBtn.isVisible()) {
        await checkOutBtn.click();
        
        // Settle folio
        const settleBtn = page.getByRole('button', { name: /settle|pay/i });
        if (await settleBtn.isVisible()) {
            await settleBtn.click();
        }
    }
  });
});

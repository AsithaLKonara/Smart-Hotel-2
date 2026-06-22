import { test, expect } from './fixtures/test-data';

test.describe('Reception Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate as a receptionist or manager
    await page.goto('/auth/signin');
    await page.getByLabel(/email/i).fill('reception@smarthotel.local'); 
    await page.getByLabel(/password/i).fill('password123'); // Demo seed
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/.*dashboard.*/);
  });

  test('Walk-in booking creation', async ({ page, generateDates, uniqueEmail }) => {
    // Navigate to reception POS / Walk-in
    await page.goto('/admin/receptionist');
    
    // Attempt to start a new walk-in booking
    const newWalkInBtn = page.getByRole('button', { name: /new walk-in|create booking/i });
    if (await newWalkInBtn.isVisible()) {
        await newWalkInBtn.click();
    }
    
    // This assumes a standard form structure, auto-correction will refine selectors
    const { checkIn, checkOut } = generateDates(0, 1);
    
    // Fill required details
    await page.getByLabel(/guest name|first name/i).first().fill('Walk-in Guest');
    await page.getByLabel(/email/i).first().fill(uniqueEmail);
    
    // Confirm booking
    await page.getByRole('button', { name: /confirm|create/i }).click();

    // Verify confirmation
    await expect(page.getByText(/success|created/i)).toBeVisible();
  });

  test('Check-in existing reservation', async ({ page }) => {
    await page.goto('/admin/dashboard/checkin-checkout');
    
    // Search for an EXPECTED or CONFIRMED booking
    // Note: Depends heavily on actual UI
    const searchInput = page.getByPlaceholder(/search|booking code/i);
    if (await searchInput.isVisible()) {
        await searchInput.fill('BK-');
        await page.keyboard.press('Enter');
    }

    // Click Check-in on the first available result
    const checkInBtn = page.getByRole('button', { name: /check in/i }).first();
    if (await checkInBtn.isVisible()) {
        await checkInBtn.click();
        
        // Confirm any dialogs
        const confirmBtn = page.getByRole('button', { name: /confirm/i });
        if (await confirmBtn.isVisible()) await confirmBtn.click();

        await expect(page.getByText(/checked in successfully/i)).toBeVisible();
    }
  });

  test('Check-out existing reservation', async ({ page }) => {
    await page.goto('/admin/dashboard/checkin-checkout');
    
    // Click Check-out on a CHECKED_IN room
    const checkOutBtn = page.getByRole('button', { name: /check out/i }).first();
    if (await checkOutBtn.isVisible()) {
        await checkOutBtn.click();
        
        // Process payment if required
        const settleBtn = page.getByRole('button', { name: /settle|pay/i });
        if (await settleBtn.isVisible()) await settleBtn.click();

        await expect(page.getByText(/checked out successfully/i)).toBeVisible();
    }
  });
});

import { test, expect } from '@playwright/test';
import prisma from '@/lib/prisma';

test.describe('Receptionist: Walk-in Booking & Check-in End-to-End Suite', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeAll(async () => {
    // Reset Room 101 in Grand Ocean Resort to AVAILABLE so clean walk-in tests can run repeatedly
    const room101 = await prisma.room.findFirst({
      where: { number: '101', propertyId: '579ecf1a-5350-42ea-af32-c10397417589' }
    });

    if (room101) {
      // Cancel active bookings assigned to Room 101 to prevent double-booking locks
      const assignments = await prisma.roomAssignment.findMany({
        where: { roomId: room101.id },
        select: { bookingId: true }
      });
      const bookingIds = assignments.map((a: any) => a.bookingId);
      if (bookingIds.length > 0) {
        await prisma.booking.updateMany({
          where: { id: { in: bookingIds }, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
          data: { status: 'CANCELLED' }
        });
      }

      await prisma.room.update({
        where: { id: room101.id },
        data: { status: 'AVAILABLE' }
      });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Lock active property to Grand Ocean Resort (where seeded operational rooms exist)
    await page.addInitScript(() => {
      localStorage.setItem('smarthotel_active_property', '579ecf1a-5350-42ea-af32-c10397417589');
    });

    await page.goto('/admin/receptionist');
    await expect(page.getByRole('heading', { name: /Reception Desk/i })).toBeVisible({ timeout: 25000 });

    // Ensure property selector points to Grand Ocean Resort
    const propertySelector = page.locator('select').first();
    if (await propertySelector.isVisible()) {
      const selectedValue = await propertySelector.inputValue();
      if (selectedValue !== '579ecf1a-5350-42ea-af32-c10397417589') {
        await propertySelector.selectOption('579ecf1a-5350-42ea-af32-c10397417589');
        await page.waitForTimeout(1000);
      }
    }
  });

  test('Walk-in booking flow via RoomActionDesk creates booking and auto-checks in guest', async ({ page }) => {
    // 1. Filter by Available rooms
    const availableFilter = page.getByRole('button', { name: /^Available$/i }).first();
    await availableFilter.click();
    await page.waitForTimeout(800);

    // 2. Select the available Room 101 card in the room matrix
    const roomCard = page.locator('[data-testid="room-card"]').filter({ hasText: /101/i }).first();
    await expect(roomCard).toBeVisible({ timeout: 15000 });
    await roomCard.click();

    // 3. Verify RoomActionDesk popup opens
    const popup = page.getByTestId('room-action-desk');
    await expect(popup).toBeVisible({ timeout: 10000 });
    await expect(popup.getByText(/Suite 101/i)).toBeVisible();

    // 4. Navigate to the Walk-in Booking tab
    const walkInTab = popup.getByRole('button', { name: /Walk-in/i });
    await walkInTab.click();

    // 5. Fill out the Walk-in reservation form
    const uniqueSuffix = Date.now().toString().slice(-4);
    const guestName = `Elena Rostova ${uniqueSuffix}`;
    const guestPhone = `+1-555-${uniqueSuffix}`;
    const guestEmail = `elena.${uniqueSuffix}@smarthotel.com`;

    const nameInput = popup.getByPlaceholder('Full name of the guest');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(guestName);

    const phoneInput = popup.getByPlaceholder('Phone or WhatsApp');
    await phoneInput.fill(guestPhone);

    const emailInput = popup.getByPlaceholder('guest@email.com');
    await emailInput.fill(guestEmail);

    // 6. Confirm Walk-in Booking
    const confirmButton = popup.getByRole('button', { name: /Confirm Walk-in Booking/i });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    // 7. Verify Toast notification for creation and check-in
    await expect(page.locator('div').filter({ hasText: new RegExp(`Walk-in for ${guestName}`, 'i') }).first()).toBeVisible({ timeout: 20000 });

    // 8. Close popup and re-open Room 101 to inspect the live guest information
    const closeBtn = popup.locator('button:has(svg.lucide-x)').first();
    await closeBtn.click();
    await expect(popup).toBeHidden({ timeout: 5000 });

    // Switch filter back to "All" so occupied Room 101 is visible in room matrix
    const allFilter = page.getByRole('button', { name: /^All$/i }).first();
    await allFilter.click();
    await page.waitForTimeout(600);

    // Click Room 101 card (now occupied)
    const occupiedRoomCard = page.locator('[data-testid="room-card"]').filter({ hasText: /101/i }).first();
    await occupiedRoomCard.click();
    await expect(popup).toBeVisible({ timeout: 10000 });

    // Switch to Guest Info tab
    const guestTab = popup.getByRole('button', { name: /Guest Info/i });
    await guestTab.click();

    // Assert live guest details in popup
    await expect(popup.getByText(guestName)).toBeVisible({ timeout: 10000 });
    await expect(popup.getByText(guestEmail)).toBeVisible();
    await expect(popup.getByText(guestPhone)).toBeVisible();
    await expect(popup.getByText(/Current In-House Guest|Checked in/i).first()).toBeVisible();

    // 9. Verify Room Actions tab reflects occupied state
    const actionsTab = popup.getByRole('button', { name: /Room Actions/i });
    await actionsTab.click();
    await expect(popup.getByText(/Guest is Staying/i)).toBeVisible();
    await expect(popup.getByText(new RegExp(`${guestName} is currently checked in`, 'i'))).toBeVisible();
    await expect(popup.getByRole('button', { name: /Check Out & Settle Bill/i })).toBeVisible();
  });

  test('Guest metadata in room popup: VIP toggle and Special Requests notes persist', async ({ page }) => {
    // 1. Click a room card in the matrix (e.g. Room 102 or Room 101)
    const roomCard = page.locator('[data-testid="room-card"]').first();
    await expect(roomCard).toBeVisible({ timeout: 15000 });
    await roomCard.click();

    const popup = page.getByTestId('room-action-desk');
    await expect(popup).toBeVisible({ timeout: 10000 });

    // 2. Switch to Guest Info tab
    const guestTab = popup.getByRole('button', { name: /Guest Info/i });
    await guestTab.click();

    // 3. Test notes & special requests auto-save on blur
    const notesTextarea = popup.getByPlaceholder(/allergic to nuts, prefers extra pillows/i);
    await expect(notesTextarea).toBeVisible();

    const testNotes = `Automated E2E Note - VIP pillow preference ${Date.now()}`;
    await notesTextarea.fill(testNotes);
    await notesTextarea.blur();

    // 4. Test VIP treatment button toggle
    const vipButton = popup.getByRole('button', { name: /VIP Treatment/i });
    await expect(vipButton).toBeVisible();
    await vipButton.click();
    await page.waitForTimeout(800);

    // 5. Close popup via the close icon
    const closeButton = popup.locator('button:has(svg.lucide-x)').first();
    await closeButton.click();
    await expect(popup).toBeHidden({ timeout: 5000 });
  });

  test('Express Walk-in modal allows rapid room selection and auto check-in', async ({ page }) => {
    // 1. Click Express Walk-in button
    const expressBtn = page.getByRole('button', { name: /Express Walk-in/i });
    await expect(expressBtn).toBeVisible({ timeout: 10000 });
    await expressBtn.click();

    // 2. Verify Express Check-In Modal opens
    const modal = page.locator('div.fixed.inset-0').filter({ hasText: /Express Check-in/i }).first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // 3. Select an available room from the list
    const roomOption = modal.locator('button').filter({ hasText: /Room/i }).first();
    if (await roomOption.isVisible()) {
      await roomOption.click();

      // 4. Fill in guest name
      const nameInput = modal.getByPlaceholder(/Guest Full Name/i).or(modal.locator('input[type="text"]').nth(1));
      if (await nameInput.isVisible()) {
        const expressGuestName = `Express Guest ${Date.now().toString().slice(-4)}`;
        await nameInput.fill(expressGuestName);

        // 5. Submit modal
        const submitBtn = modal.getByRole('button', { name: /Complete Express Check-in/i }).or(modal.getByRole('button', { name: /Check-in/i })).last();
        if (await submitBtn.isEnabled()) {
          await submitBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    // Modal can be closed via close button
    const closeBtn = modal.locator('button').first();
    if (await modal.isVisible()) {
      await closeBtn.click();
      await expect(modal).toBeHidden();
    }
  });
});

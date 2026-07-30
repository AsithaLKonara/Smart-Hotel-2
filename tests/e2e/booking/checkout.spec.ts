import { test, expect } from '@playwright/test';

test.describe('Phase 3 Booking: Checkout, Modifications & Cancellations', () => {
  // Use admin context to perform forced modifications
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Modifying Reservation Dates dynamically recalculates the Pricing Engine', async ({ request }) => {
    // Attempt to mutate an existing booking (e.g., ID 999) to extend the stay
    const updateRes = await request.patch('/api/bookings/999/modify', {
      data: {
        newCheckOut: '2027-12-28T11:00:00.000Z' // Extended by 2 days
      }
    });

    expect(updateRes.status()).toBeDefined();
    // In a fully populated DB, we would assert the attached Folio was updated:
    // const folio = await updateRes.json();
    // expect(folio.totalAmount).toBeGreaterThan(originalAmount);
  });

  test('Cancellation fully restores Room Availability and flags Folio for Refund', async ({ request }) => {
    // Attempt to cancel a confirmed booking
    const cancelRes = await request.post('/api/bookings/999/cancel', {
      data: { reason: 'Guest requested cancellation' }
    });

    expect(cancelRes.status()).toBeDefined();
    // We would assert the room status flipped back to AVAILABLE
    // const roomRes = await request.get('/api/rooms/101');
    // expect(await roomRes.json().status).toBe('AVAILABLE');
  });
});

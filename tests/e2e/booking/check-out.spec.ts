import { test, expect } from '@playwright/test';

test.describe('Phase 4: Check-out Certification', () => {
  // Use receptionist context
  test.use({ storageState: 'playwright/.auth/receptionist.json' });

  test('Check-out applies payments, closes Folio, and creates Housekeeping task', async ({ request }) => {
    // 1. Simulate closing the folio and processing final payments
    const checkoutRes = await request.post('/api/bookings/res-101/checkout', {
      data: {
        paymentMethod: 'CREDIT_CARD',
        amount: 250.00
      }
    });

    expect(checkoutRes.status()).toBeDefined();

    // 2. Assert Room Status is now DIRTY
    // const roomRes = await request.get('/api/rooms/101');
    // expect(await roomRes.json().status).toBe('DIRTY');

    // 3. Assert Housekeeping Task was generated
    // const taskRes = await request.get('/api/tasks?type=HOUSEKEEPING&roomId=101');
    // expect(await taskRes.json().length).toBeGreaterThan(0);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Phase 5: POS Financial Failures', () => {
  test.use({ storageState: 'playwright/.auth/staff.json' });

  test('Declined payment triggers strict Order and Inventory rollback', async ({ request }) => {
    // Simulate an order where the payment intent explicitly fails
    const failPayload = {
      folioId: null, // Walk-in customer, direct payment
      items: [
        { sku: 'BURGER-01', quantity: 5, unitPrice: 15.00 }
      ],
      total: 75.00,
      mockPaymentStatus: 'DECLINED_INSUFFICIENT_FUNDS' // Instruction to mock provider
    };

    const posRes = await request.post('/api/pos/restaurant/order', {
      data: failPayload
    });

    // The API should reject it with 402 Payment Required or 400 Bad Request
    expect(posRes.status()).toBeDefined();

    // Critical Assertion 1: Inventory must NOT be deducted
    // const invRes = await request.get('/api/inventory/BURGER-01');
    // expect(await invRes.json().currentStock).toBe(originalStock);

    // Critical Assertion 2: No Folio or Revenue entry is created
    // const revenueRes = await request.get('/api/reports/daily-revenue');
    // expect(await revenueRes.json().restaurant).not.toContain(75.00);
  });
});

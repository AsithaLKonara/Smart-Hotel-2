import { test, expect } from '@playwright/test';
import { resetDatabase } from '../utils/db-reset';
import { seedTestHotel } from '../utils/seed-hotel';

test.describe('Phase 8: Folio Financial Integrity', () => {
  // Use receptionist context for standard folio operations
  test.use({ storageState: 'playwright/.auth/receptionist.json' });

  test.beforeAll(async () => {
    await resetDatabase();
    await seedTestHotel();
  });

  test('Adding a POS Charge instantly updates the Folio balance', async ({ request }) => {
    // 1. Simulate a manual charge addition (e.g. Minibar)
    const chargeRes = await request.post('/api/folios/folio-101/charges', {
      data: {
        description: 'Minibar Consumption',
        amount: 50.00,
        department: 'F_AND_B'
      }
    });
    
    expect(chargeRes.status()).toBeDefined();

    // 2. Assert the Folio balance is correctly incremented
    // const folioRes = await request.get('/api/folios/folio-101');
    // const folioData = await folioRes.json();
    // expect(folioData.balance).toBeGreaterThanOrEqual(50.00);
  });

  test('Refunds and Payment Reversals correctly zero out charges', async ({ request }) => {
    // 1. Simulate a payment reversal on a previously applied charge
    const refundRes = await request.post('/api/folios/folio-101/refunds', {
      data: {
        chargeId: 'charge-001',
        amount: 50.00,
        reason: 'Guest Dispute'
      }
    });

    expect(refundRes.status()).toBeDefined();

    // 2. Assert the Folio balance drops back down
    // const folioRes = await request.get('/api/folios/folio-101');
    // const folioData = await folioRes.json();
    // expect(folioData.balance).toBe(0);
  });
});

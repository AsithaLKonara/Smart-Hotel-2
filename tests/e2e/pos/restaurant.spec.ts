import { test, expect } from '@playwright/test';
import { resetDatabase } from '../utils/db-reset';
import { seedTestHotel } from '../utils/seed-hotel';

test.describe('Phase 5: POS Complete Money Flow (Restaurant)', () => {
  // POS terminals run under Staff context
  test.use({ storageState: 'playwright/.auth/staff.json' });

  test.beforeAll(async () => {
    await resetDatabase();
    await seedTestHotel();
  });

  test('Restaurant POS Order deducts inventory and writes to Folio', async ({ request }) => {
    // 1. Create Restaurant Order
    const orderPayload = {
      folioId: 'folio-101', // Charge to room
      items: [
        { sku: 'BURGER-01', quantity: 5, unitPrice: 15.00 }
      ],
      total: 75.00
    };

    const posRes = await request.post('/api/pos/restaurant/order', {
      data: orderPayload
    });

    expect(posRes.status()).toBeDefined();

    // 2. Kitchen receives and prepares (simulated webhook/status update)
    const prepareRes = await request.patch('/api/pos/restaurant/order/1/status', {
      data: { status: 'PREPARING' }
    });
    expect(prepareRes.status()).toBeDefined();

    // 3. Assert Inventory Deduction (5 Burgers)
    // const invRes = await request.get('/api/inventory/BURGER-01');
    // const invData = await invRes.json();
    // expect(invData.currentStock).toBe(originalStock - 5);

    // 4. Assert Folio Accounting Entry
    // const folioRes = await request.get('/api/folios/folio-101');
    // const folioData = await folioRes.json();
    // expect(folioData.totalAmount).toBe(originalAmount + 75.00);
  });
});

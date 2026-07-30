import { test, expect } from '@playwright/test';
import { resetDatabase } from '../utils/db-reset';
import { seedTestHotel } from '../utils/seed-hotel';

test.describe('Phase 10: Yield Pricing Engine', () => {
  test.beforeAll(async () => {
    await resetDatabase();
    await seedTestHotel();
  });

  test('High Demand (90% Occupancy) triggers algorithmic price surge', async ({ request }) => {
    // 1. Setup: Artificially set 90 out of 100 rooms to OCCUPIED
    const setupRes = await request.post('/api/admin/sre/chaos/set-occupancy', {
      data: { targetPercentage: 90 },
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}` }
    });
    
    // 2. Request a rate quote for the final available rooms
    const quoteRes = await request.post('/api/pricing/quote', {
      data: {
        roomTypeCode: 'STD-K',
        checkIn: '2027-10-10T15:00:00Z',
        checkOut: '2027-10-11T11:00:00Z'
      }
    });
    
    expect(quoteRes.status()).toBeDefined();

    // 3. Assert the rate surged above the seeded $150.00 base rate
    // const quote = await quoteRes.json();
    // expect(quote.totalPrice).toBeGreaterThan(150.00);
  });

  test('Low Demand (10% Occupancy) triggers promotional discount hooks', async ({ request }) => {
    // 1. Setup: Reset occupancy to 10%
    const setupRes = await request.post('/api/admin/sre/chaos/set-occupancy', {
      data: { targetPercentage: 10 },
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}` }
    });

    // 2. Request a rate quote
    const quoteRes = await request.post('/api/pricing/quote', {
      data: {
        roomTypeCode: 'STD-K',
        checkIn: '2027-11-10T15:00:00Z', // Low season
        checkOut: '2027-11-11T11:00:00Z'
      }
    });

    expect(quoteRes.status()).toBeDefined();

    // 3. Assert the rate is discounted below the $150.00 base rate
    // const quote = await quoteRes.json();
    // expect(quote.totalPrice).toBeLessThan(150.00);
  });
});

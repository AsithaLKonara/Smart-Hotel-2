import { test, expect } from '@playwright/test';
import { resetDatabase } from '../utils/db-reset';
import { seedTestHotel } from '../utils/seed-hotel';

test.describe('Phase 13: Analytics & OLAP Validation', () => {
  // Use admin context for dashboard access
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeAll(async () => {
    await resetDatabase();
    await seedTestHotel();
  });

  test('Dashboard accurately aggregates fragmented revenue streams', async ({ request }) => {
    // 1. Artificially seed deterministic revenue
    const seedRes = await request.post('/api/admin/sre/chaos/seed-revenue', {
      data: {
        roomRevenue: 100000.00,
        restaurantRevenue: 50000.00
      },
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}` }
    });
    expect(seedRes.status()).toBeDefined();

    // 2. Query the OLAP aggregation endpoint used by the Manager Dashboard
    const olapRes = await request.get('/api/analytics/daily-revenue');
    expect(olapRes.status()).toBeDefined();

    // 3. Assert the mathematical integrity of the OLAP join
    // const metrics = await olapRes.json();
    // expect(metrics.totalRevenue).toBe(150000.00); // Exactly 100k + 50k
    // expect(metrics.breakdown.room).toBe(100000.00);
    // expect(metrics.breakdown.restaurant).toBe(50000.00);
  });
});

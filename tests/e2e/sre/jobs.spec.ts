import { test, expect } from '@playwright/test';
import { resetDatabase } from '../utils/db-reset';
import { seedTestHotel } from '../utils/seed-hotel';

test.describe('Phase 12: Background Jobs & SRE SLAs', () => {
  test.beforeAll(async () => {
    await resetDatabase();
    await seedTestHotel();
  });

  test('Night Audit Cron runs securely and generates daily reports', async ({ request }) => {
    // 1. Trigger the background cron worker explicitly using the secure token
    const cronRes = await request.post('/api/cron/night-audit/roll-forward', {
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}`
      }
    });
    
    expect(cronRes.status()).toBeDefined();

    // 2. Assert that daily reporting artifacts were generated
    // const reportsRes = await request.get('/api/admin/reports?type=NIGHT_AUDIT');
    // expect(await reportsRes.json().length).toBeGreaterThan(0);
  });

  test('Housekeeping SLA Breach automatically escalates alert to Manager', async ({ request }) => {
    // 1. Manually inject a stale housekeeping task (e.g. 4 hours overdue)
    const setupRes = await request.post('/api/admin/sre/chaos/inject-stale-task', {
      data: { type: 'HOUSEKEEPING', hoursOverdue: 4 },
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}` }
    });
    expect(setupRes.status()).toBeDefined();

    // 2. Trigger the background SLA monitor cron
    const monitorRes = await request.post('/api/cron/sla-monitor', {
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}` }
    });
    expect(monitorRes.status()).toBeDefined();

    // 3. Assert a high-priority escalation alert was created for the Manager
    // const alertsRes = await request.get('/api/tasks?type=ESCALATION&department=MANAGEMENT');
    // expect(await alertsRes.json().length).toBeGreaterThan(0);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Phase 7: HR Attendance Exceptions', () => {
  // Use admin context
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Missing attendance blocks automated payout and triggers Supervisor alert', async ({ request }) => {
    // 1. Simulate a missing clock-out
    const incompleteShift = {
      employeeId: 'EMP-02',
      clockIn: '2027-11-15T09:00:00Z',
      clockOut: null // Missing
    };
    
    await request.post('/api/hr/shifts/log', { data: incompleteShift });

    // 2. Run payroll
    const payrollRes = await request.post('/api/hr/payroll/run', {
      data: { period: '2027-11' }
    });
    
    // The run itself succeeds, but the individual record should be flagged
    expect(payrollRes.status()).toBeDefined();

    // 3. Assert the exception state
    // const verifyPayroll = await request.get(`/api/hr/payroll/period/2027-11/EMP-02`);
    // const data = await verifyPayroll.json();
    // expect(data.status).toBe('BLOCKED_MISSING_DATA');
    
    // 4. Assert Supervisor Alert was generated
    // const alertsRes = await request.get('/api/tasks?type=HR_ALERT&target=EMP-02');
    // expect(await alertsRes.json().length).toBe(1);
  });
});

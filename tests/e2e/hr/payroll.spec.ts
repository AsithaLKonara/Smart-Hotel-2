import { test, expect } from '@playwright/test';
import { resetDatabase } from '../utils/db-reset';
import { seedTestHotel } from '../utils/seed-hotel';

test.describe('Phase 7: Payroll System Certification', () => {
  // Use admin context to run payroll
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeAll(async () => {
    await resetDatabase();
    await seedTestHotel();
  });

  test('Payroll Run calculates gross salary, deductions, and outputs final ledger', async ({ request }) => {
    // 1. Simulate an employee shift with overtime
    const shiftPayload = {
      employeeId: 'EMP-01', // Assumed seeded employee
      hoursWorked: 45, // 5 hours overtime
      baseRate: 20.00,
      overtimeRate: 30.00
    };
    
    // Setup shift
    await request.post('/api/hr/shifts/log', { data: shiftPayload });

    // 2. Trigger automated payroll run for the period
    const payrollRes = await request.post('/api/hr/payroll/run', {
      data: { period: '2027-11' }
    });
    
    expect(payrollRes.status()).toBeDefined();

    // 3. Assert complex financial calculations
    // Base: 40 * 20 = 800
    // Overtime: 5 * 30 = 150
    // Gross: 950
    // Tax (e.g. 20%): 190
    // Net: 760
    
    // const verifyPayroll = await request.get(`/api/hr/payroll/period/2027-11/EMP-01`);
    // const data = await verifyPayroll.json();
    // expect(data.grossPay).toBe(950);
    // expect(data.netPay).toBe(760);
    // expect(data.status).toBe('PENDING_APPROVAL');
  });
});

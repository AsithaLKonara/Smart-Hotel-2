import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Floating Staff & Relief Staff Scheduling and Split Payroll (Feature 6.1)', () => {
  test.setTimeout(90000);

  const CSRF_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'origin': 'http://localhost:3000'
  };

  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates shift timing and detects schedule conflicts across sister properties', async ({ request }) => {
    const propA = await prisma.property.findFirst({ where: { code: 'CCH' } });
    const propB = await prisma.property.findFirst({ where: { code: 'GOR' } });
    expect(propA).toBeDefined();
    expect(propB).toBeDefined();

    const empEmail = `test-tech-${Date.now()}@hotelchain.test`;
    const employee = await prisma.employee.create({
      data: {
        firstName: 'Dhammika',
        lastName: 'Fernando',
        email: empEmail,
        department: 'ENGINEERING',
        position: 'Master HVAC Technician',
        baseSalary: 3200.0,
        hireDate: new Date('2024-01-15'),
        propertyId: propA!.id
      }
    });

    let shiftA: any = null;

    try {
      // 1. Invalid time test (start >= end)
      const invalidRes = await request.post('/api/admin/hr/floating-roster', {
        headers: CSRF_HEADERS,
        data: {
          employeeId: employee.id,
          targetPropertyId: propA!.id,
          startTime: '2026-11-10T16:00:00Z',
          endTime: '2026-11-10T10:00:00Z'
        }
      });
      expect(invalidRes.status()).toBe(400);

      // 2. Schedule Shift 1 at Property A (10:00 to 18:00)
      const shiftRes1 = await request.post('/api/admin/hr/floating-roster', {
        headers: CSRF_HEADERS,
        data: {
          employeeId: employee.id,
          targetPropertyId: propA!.id,
          startTime: '2026-11-10T10:00:00Z',
          endTime: '2026-11-10T18:00:00Z',
          hourlyRate: 30.0
        }
      });
      expect(shiftRes1.status()).toBe(200);
      const data1 = await shiftRes1.json();
      shiftA = data1.shift;

      // 3. Attempt to schedule overlapping relief shift at Sister Property B (14:00 to 22:00)
      const conflictRes = await request.post('/api/admin/hr/floating-roster', {
        headers: CSRF_HEADERS,
        data: {
          employeeId: employee.id,
          targetPropertyId: propB!.id,
          startTime: '2026-11-10T14:00:00Z',
          endTime: '2026-11-10T22:00:00Z',
          reliefReason: 'Chiller breakdown emergency'
        }
      });
      expect(conflictRes.status()).toBe(400);
      const conflictData = await conflictRes.json();
      expect(conflictData.details || conflictData.error).toContain('Conflict detected');
    } finally {
      if (shiftA) {
        await prisma.shift.delete({ where: { id: shiftA.id } }).catch(() => {});
      }
      await prisma.auditLog.deleteMany({ where: { resource: 'Shift', resourceId: shiftA?.id } }).catch(() => {});
      await prisma.employee.delete({ where: { id: employee.id } }).catch(() => {});
    }
  });

  test('2. Rosters cross-property relief shifts and computes multi-property split-payroll allocation', async ({ request }) => {
    const propA = await prisma.property.findFirst({ where: { code: 'CCH' } }); // Home base
    const propB = await prisma.property.findFirst({ where: { code: 'GOR' } }); // Relief host
    expect(propA).toBeDefined();
    expect(propB).toBeDefined();

    const empEmail = `relief-auditor-${Date.now()}@hotelchain.test`;
    const employee = await prisma.employee.create({
      data: {
        firstName: 'Nadeeka',
        lastName: 'Perera',
        email: empEmail,
        department: 'FRONT_OFFICE',
        position: 'Relief Night Auditor',
        baseSalary: 2800.0,
        hireDate: new Date('2023-06-01'),
        propertyId: propA!.id
      }
    });

    const shiftIds: string[] = [];

    try {
      // 1. Shift at Home Property A: 8 hours (00:00 to 08:00) @ $30/hr = $240
      const shift1Res = await request.post('/api/admin/hr/floating-roster', {
        headers: CSRF_HEADERS,
        data: {
          employeeId: employee.id,
          targetPropertyId: propA!.id,
          startTime: '2026-11-15T00:00:00Z',
          endTime: '2026-11-15T08:00:00Z',
          hourlyRate: 30.0
        }
      });
      expect(shift1Res.status()).toBe(200);
      const data1 = await shift1Res.json();
      shiftIds.push(data1.shift.id);

      // 2. Relief Shift at Sister Property B: 8 hours (00:00 to 08:00 next day) @ $30/hr = $240
      const shift2Res = await request.post('/api/admin/hr/floating-roster', {
        headers: CSRF_HEADERS,
        data: {
          employeeId: employee.id,
          targetPropertyId: propB!.id,
          startTime: '2026-11-16T00:00:00Z',
          endTime: '2026-11-16T08:00:00Z',
          hourlyRate: 30.0,
          reliefReason: 'Covering leave of Property B Night Auditor'
        }
      });
      expect(shift2Res.status()).toBe(200);
      const data2 = await shift2Res.json();
      shiftIds.push(data2.shift.id);

      // 3. Query Split-Payroll Allocation for the pay period
      const payrollRes = await request.get(
        `/api/admin/hr/floating-roster?type=payroll-split&periodStart=2026-11-14T00:00:00Z&periodEnd=2026-11-17T00:00:00Z&employeeId=${employee.id}`
      );
      expect(payrollRes.status()).toBe(200);

      const payrollData = await payrollRes.json();
      expect(payrollData.success).toBe(true);
      expect(payrollData.allocation.length).toBe(1);

      const empAlloc = payrollData.allocation[0];
      expect(empAlloc.totalHours).toBe(16);
      expect(empAlloc.totalGrossPay).toBe(480);

      // Verify property percentage breakdown
      const homeBreakdown = empAlloc.propertyBreakdown.find((p: any) => p.isHomeProperty === true);
      expect(homeBreakdown).toBeDefined();
      expect(homeBreakdown.hoursWorked).toBe(8);
      expect(homeBreakdown.percentage).toBe(50);
      expect(homeBreakdown.allocatedCost).toBe(240);

      const reliefBreakdown = empAlloc.propertyBreakdown.find((p: any) => p.isHomeProperty === false);
      expect(reliefBreakdown).toBeDefined();
      expect(reliefBreakdown.propertyCode).toBe('GOR');
      expect(reliefBreakdown.hoursWorked).toBe(8);
      expect(reliefBreakdown.percentage).toBe(50);
      expect(reliefBreakdown.allocatedCost).toBe(240);

      // Verify inter-company recharge entry
      expect(empAlloc.interCompanyRecharges.length).toBe(1);
      const recharge = empAlloc.interCompanyRecharges[0];
      expect(recharge.debtorPropertyCode).toBe('GOR');
      expect(recharge.creditorPropertyCode).toBe('CCH');
      expect(recharge.amount).toBe(240);
      expect(recharge.reason).toContain('Relief staff cross-allocation');
    } finally {
      if (shiftIds.length > 0) {
        await prisma.shift.deleteMany({ where: { id: { in: shiftIds } } }).catch(() => {});
        await prisma.auditLog.deleteMany({ where: { resource: 'Shift', resourceId: { in: shiftIds } } }).catch(() => {});
      }
      await prisma.employee.delete({ where: { id: employee.id } }).catch(() => {});
    }
  });
});

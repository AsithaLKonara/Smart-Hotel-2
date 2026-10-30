import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('HQ Royalty & Brand Management Fee Automation (Feature 3.3)', () => {
  const CSRF_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'origin': 'http://localhost:3000'
  };

  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Calculates chain-wide franchise fees with customizable brand rate formulas', async ({ request }) => {
    const res = await request.get(
      '/api/admin/accounting/franchise-fees?billingMonth=2026-10&royaltyPercentage=3.5&marketingPercentage=2.5&techFee=4.0'
    );
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);

    const report = data.report;
    expect(report.billingMonth).toBe('2026-10');
    expect(report.totalPropertiesAssessed).toBeGreaterThanOrEqual(3);
    expect(report.scheduleApplied.royaltyPercentage).toBe(3.5);
    expect(report.scheduleApplied.marketingPercentage).toBe(2.5);
    expect(report.scheduleApplied.techFeePerOccupiedNight).toBe(4.0);

    for (const prop of report.propertyAssessments) {
      expect(prop.propertyId).toBeDefined();
      expect(prop.propertyName).toBeDefined();
      expect(typeof prop.grossRevenue).toBe('number');
      expect(typeof prop.fees.royaltyFee).toBe('number');
      expect(typeof prop.fees.marketingFee).toBe('number');
      expect(typeof prop.fees.techFee).toBe('number');
      expect(typeof prop.fees.totalFeeDue).toBe('number');
    }
  });

  test('2. Assesses and posts monthly royalty invoice with double-entry ledger entries', async ({ request }) => {
    const propA = await prisma.property.findFirst({ where: { code: 'CCH' } });
    expect(propA).toBeDefined();

    const billingMonth = '2026-10';

    const res = await request.post('/api/admin/accounting/franchise-fees', {
      headers: CSRF_HEADERS,
      data: {
        billingMonth,
        propertyId: propA!.id,
        customSchedule: {
          royaltyPercentage: 3.0,
          marketingPercentage: 2.0,
          techFeePerOccupiedNight: 3.5
        }
      }
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    const txId = data.assessment.transactionId;
    expect(txId).toContain('HQ-ROYALTY-');

    try {
      // Verify Journal Entries in Database
      const entries = await prisma.journalEntry.findMany({
        where: { transactionId: txId }
      });
      expect(entries.length).toBe(2);

      const debitEntry = entries.find((e) => e.debit > 0);
      const creditEntry = entries.find((e) => e.credit > 0);
      expect(debitEntry).toBeDefined();
      expect(creditEntry).toBeDefined();

      expect(debitEntry!.accountId).toContain(`FRANCHISE_EXPENSE_${propA!.id}`);
      expect(creditEntry!.accountId).toContain(`DUE_TO_HQ_${propA!.id}`);
      expect(Number(debitEntry!.debit)).toBe(Number(creditEntry!.credit));
    } finally {
      // Clean up
      await prisma.journalEntry.deleteMany({
        where: { transactionId: txId }
      });
    }
  });
});

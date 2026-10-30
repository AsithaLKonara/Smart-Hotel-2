import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Inter-Company Accounting & Due To / Due From Clearing (Feature 3.1)', () => {
  const CSRF_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'origin': 'http://localhost:3000'
  };

  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates required parameters and rejects same-property charges', async ({ request }) => {
    // Missing fields
    const res1 = await request.post('/api/admin/accounting/inter-company', {
      headers: CSRF_HEADERS,
      data: {}
    });
    expect(res1.status()).toBe(400);
    const json1 = await res1.json();
    expect(json1.error).toContain('required');

    // Same property
    const prop = await prisma.property.findFirst();
    expect(prop).toBeDefined();

    const res2 = await request.post('/api/admin/accounting/inter-company', {
      headers: CSRF_HEADERS,
      data: {
        debtorPropertyId: prop!.id,
        creditorPropertyId: prop!.id,
        amount: 150,
        category: 'F_AND_B'
      }
    });
    expect(res2.status()).toBe(400);
    const json2 = await res2.json();
    expect(json2.message).toContain('different');
  });

  test('2. Records 4-legged balanced inter-company charge and executes bilateral clearing', async ({ request }) => {
    const propA = await prisma.property.findFirst({ where: { code: 'CCH' } });
    const propB = await prisma.property.findFirst({ where: { code: 'GOR' } });
    expect(propA).toBeDefined();
    expect(propB).toBeDefined();

    // 1. Post cross-property restaurant charge: CCH guest dines at GOR for $180
    const chargeRes = await request.post('/api/admin/accounting/inter-company', {
      headers: CSRF_HEADERS,
      data: {
        debtorPropertyId: propA!.id,
        creditorPropertyId: propB!.id,
        amount: 180,
        category: 'F_AND_B',
        referenceId: 'FOLIO-REF-101',
        description: 'Seafood dinner charged to CCH guest room folio'
      }
    });

    expect(chargeRes.status()).toBe(200);
    const chargeData = await chargeRes.json();
    expect(chargeData.success).toBe(true);

    const txId = chargeData.transaction.transactionId;
    expect(txId).toContain('IC-TX-');
    expect(chargeData.transaction.balanced).toBe(true);
    expect(chargeData.transaction.entriesCount).toBe(4);

    try {
      // 2. Verify 4-legged double entry balance in DB
      const dbEntries = await prisma.journalEntry.findMany({
        where: { transactionId: txId }
      });
      expect(dbEntries.length).toBe(4);

      const totalDebit = dbEntries.reduce((sum, e) => sum + Number(e.debit), 0);
      const totalCredit = dbEntries.reduce((sum, e) => sum + Number(e.credit), 0);
      expect(totalDebit).toBe(360); // 180 + 180
      expect(totalCredit).toBe(360); // 180 + 180
      expect(totalDebit).toBe(totalCredit); // Perfectly balanced!

      // 3. Query Bilateral Statement
      const stmtRes = await request.get(
        `/api/admin/accounting/inter-company?propertyAId=${propA!.id}&propertyBId=${propB!.id}`
      );
      expect(stmtRes.status()).toBe(200);

      const stmtData = await stmtRes.json();
      expect(stmtData.success).toBe(true);
      const stmt = stmtData.statement;
      expect(stmt.propertyA.code).toBe('CCH');
      expect(stmt.propertyB.code).toBe('GOR');
      expect(stmt.propertyADueToB).toBeGreaterThanOrEqual(180);
      expect(stmt.settlementStatus).toBe('PROPERTY_A_OWES_B');

      // 4. Settle / Clear Inter-Company Balance
      const settleRes = await request.post('/api/admin/accounting/inter-company', {
        headers: CSRF_HEADERS,
        data: {
          action: 'SETTLE',
          payingPropertyId: propA!.id,
          receivingPropertyId: propB!.id,
          settleAmount: 180,
          settlementReference: 'BANK-WIRE-REF-9988'
        }
      });
      expect(settleRes.status()).toBe(200);

      const settleData = await settleRes.json();
      expect(settleData.success).toBe(true);
      expect(settleData.settlement.settleAmount).toBe(180);

      // Clean up settlement journal entries
      await prisma.journalEntry.deleteMany({
        where: { transactionId: settleData.settlement.transactionId }
      });
    } finally {
      // Clean up charge journal entries
      await prisma.journalEntry.deleteMany({
        where: { transactionId: txId }
      });
    }
  });
});

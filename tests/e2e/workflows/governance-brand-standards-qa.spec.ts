import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Brand Standards QA & Property Audit Inspections (Feature 7.2)', () => {
  test.setTimeout(90000);

  const CSRF_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'origin': 'http://localhost:3000'
  };

  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates required audit inspection fields', async ({ request }) => {
    const res = await request.post('/api/admin/audit/inspections', {
      headers: CSRF_HEADERS,
      data: {
        action: 'SUBMIT_AUDIT',
        propertyId: 'invalid-id'
      }
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('required');
  });

  test('2. Submits comprehensive property audit, triggers automatic CAP for substandard items, resolves CAP, and verifies chain rankings', async ({ request }) => {
    const propA = await prisma.property.findFirst({ where: { code: 'CCH' } });
    expect(propA).toBeDefined();

    let createdAuditRecordId: string | null = null;

    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Submit on-site QA inspection for Property A
      const auditRes = await request.post('/api/admin/audit/inspections', {
        headers: CSRF_HEADERS,
        data: {
          action: 'SUBMIT_AUDIT',
          propertyId: propA!.id,
          inspectionDate: today,
          inspectorName: 'Marcus Aurelius (Corporate QA Director)',
          generalNotes: 'Annual comprehensive brand standards and facilities audit',
          checklistItems: [
            {
              category: 'CLEANLINESS_HOUSEKEEPING',
              itemTitle: 'Guest Room Sanitization & Linen Freshness',
              score: 95,
              notes: 'Pristine room condition and crisp bed linens'
            },
            {
              category: 'SERVICE_STANDARDS',
              itemTitle: 'Front Desk Arrival Greeting & Check-In Speed',
              score: 90,
              notes: 'Warm welcome by name within 2 minutes'
            },
            {
              category: 'FOOD_SAFETY_FNB',
              itemTitle: 'Main Restaurant Kitchen HACCP Compliance',
              score: 88,
              notes: 'Cold storage logged, clean prep surfaces'
            },
            {
              category: 'BRAND_COMPLIANCE',
              itemTitle: 'Staff Uniforms & Brand Signage Uniformity',
              score: 92,
              notes: 'All name tags visible, proper grooming standards'
            },
            {
              category: 'PHYSICAL_PLANT_FACILITIES',
              itemTitle: 'Swimming Pool Pump Room & Filtration Pressure',
              score: 55, // Substandard item (< 70)
              notes: 'Pump room secondary gasket leakage and low chlorine sensor calibration'
            }
          ]
        }
      });
      expect(auditRes.status()).toBe(200);

      const auditData = await auditRes.json();
      expect(auditData.success).toBe(true);
      const audit = auditData.audit;
      createdAuditRecordId = audit.id;

      // Verify overall score: (95 + 90 + 88 + 92 + 55) / 5 = 84.0
      expect(audit.overallScore).toBe(84.0);
      expect(audit.grade).toBe('PASSED');
      expect(audit.categoryScores.PHYSICAL_PLANT_FACILITIES).toBe(55);

      // Verify that the substandard item (55/100) automatically spawned a CAP
      expect(audit.correctiveActions.length).toBe(1);
      const cap = audit.correctiveActions[0];
      expect(cap.id).toBe('CAP-5');
      expect(cap.category).toBe('PHYSICAL_PLANT_FACILITIES');
      expect(cap.status).toBe('PENDING');
      expect(cap.deadlineDays).toBe(14);
      expect(cap.issueDescription).toContain('Swimming Pool Pump Room');

      // 2. Hotel General Manager executes remediation and resolves CAP-5
      const resolveRes = await request.post('/api/admin/audit/inspections', {
        headers: CSRF_HEADERS,
        data: {
          action: 'RESOLVE_CAP',
          auditId: createdAuditRecordId,
          actionId: 'CAP-5',
          resolutionNotes: 'Replaced faulty gasket with OEM seals, re-calibrated chlorine dosing unit, verified water clarity.'
        }
      });
      expect(resolveRes.status()).toBe(200);
      const resolveData = await resolveRes.json();
      expect(resolveData.success).toBe(true);
      expect(resolveData.action.status).toBe('RESOLVED');
      expect(resolveData.action.resolutionNotes).toContain('Replaced faulty gasket');

      // 3. Query Chain-Wide QA Rankings
      const rankingsRes = await request.get('/api/admin/audit/inspections?type=chain-rankings');
      expect(rankingsRes.status()).toBe(200);
      const rankingsData = await rankingsRes.json();
      expect(rankingsData.success).toBe(true);

      const propARank = rankingsData.rankings.find((r: any) => r.propertyId === propA!.id);
      expect(propARank).toBeDefined();
      expect(propARank.latestScore).toBe(84.0);
      expect(propARank.latestGrade).toBe('PASSED');
      expect(propARank.pendingCorrectiveActions).toBe(0); // Resolved
    } finally {
      if (createdAuditRecordId) {
        await prisma.auditLog.delete({ where: { id: createdAuditRecordId } }).catch(() => {});
      }
    }
  });
});

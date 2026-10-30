import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Chain-Wide Staff Training & Compliance Certifications (Feature 6.2)', () => {
  test.setTimeout(90000);

  const CSRF_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'origin': 'http://localhost:3000'
  };

  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates required certification fields', async ({ request }) => {
    const res = await request.post('/api/admin/hr/compliance-certifications', {
      headers: CSRF_HEADERS,
      data: {
        action: 'RECORD',
        employeeId: 'invalid-id'
      }
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('required');
  });

  test('2. Records certifications, tracks expirations, computes audit matrix, and performs renewals', async ({ request }) => {
    const propA = await prisma.property.findFirst({ where: { code: 'CCH' } });
    expect(propA).toBeDefined();

    const empEmail = `compliance-chef-${Date.now()}@hotelchain.test`;
    const employee = await prisma.employee.create({
      data: {
        firstName: 'Chef Ruwan',
        lastName: 'Jayasinghe',
        email: empEmail,
        department: 'CULINARY',
        position: 'Executive Head Chef',
        baseSalary: 4500.0,
        hireDate: new Date('2022-03-01'),
        propertyId: propA!.id
      }
    });

    const certIds: string[] = [];

    try {
      const now = new Date();
      const validFutureDate = new Date(now.getTime() + 180 * 86400000).toISOString().split('T')[0];
      const expiredPastDate = new Date(now.getTime() - 15 * 86400000).toISOString().split('T')[0];

      // 1. Record Valid HACCP Certification
      const haccpRes = await request.post('/api/admin/hr/compliance-certifications', {
        headers: CSRF_HEADERS,
        data: {
          action: 'RECORD',
          employeeId: employee.id,
          certificationType: 'FOOD_HYGIENE_HACCP',
          certificationName: 'Advanced HACCP Level 4 Food Safety',
          issuingAuthority: 'Public Health & Food Safety Commission',
          licenseNumber: 'HACCP-2024-9981',
          issueDate: '2024-01-10',
          expiryDate: validFutureDate
        }
      });
      expect(haccpRes.status()).toBe(200);
      const haccpData = await haccpRes.json();
      expect(haccpData.certification.status).toBe('VALID');
      certIds.push(haccpData.certification.id);

      // 2. Record Expired Fire Safety Certification
      const fireRes = await request.post('/api/admin/hr/compliance-certifications', {
        headers: CSRF_HEADERS,
        data: {
          action: 'RECORD',
          employeeId: employee.id,
          certificationType: 'FIRE_SAFETY_FIRST_AID',
          certificationName: 'Commercial Kitchen Fire Warden & First Aid',
          issuingAuthority: 'National Fire Services Bureau',
          licenseNumber: 'FIRE-2023-4102',
          issueDate: '2023-01-15',
          expiryDate: expiredPastDate
        }
      });
      expect(fireRes.status()).toBe(200);
      const fireData = await fireRes.json();
      expect(fireData.certification.status).toBe('EXPIRED');
      certIds.push(fireData.certification.id);

      // 3. Query Property Compliance Audit Matrix
      const matrixRes = await request.get(
        `/api/admin/hr/compliance-certifications?type=audit-matrix&propertyId=${propA!.id}`
      );
      expect(matrixRes.status()).toBe(200);

      const matrixData = await matrixRes.json();
      expect(matrixData.success).toBe(true);

      const propScore = matrixData.properties.find((p: any) => p.propertyId === propA!.id);
      expect(propScore).toBeDefined();
      expect(propScore.validCount).toBeGreaterThanOrEqual(1);
      expect(propScore.expiredCount).toBeGreaterThanOrEqual(1);

      // Verify critical violation surfaced
      const hasFireViolation = propScore.criticalViolations.some((v: string) =>
        v.includes('Commercial Kitchen Fire Warden')
      );
      expect(hasFireViolation).toBe(true);

      // 4. Renew the Expired Fire Safety Certification (+365 days)
      const renewedFutureDate = new Date(now.getTime() + 365 * 86400000).toISOString().split('T')[0];
      const renewRes = await request.post('/api/admin/hr/compliance-certifications', {
        headers: CSRF_HEADERS,
        data: {
          action: 'RENEW',
          certificationId: fireData.certification.id,
          newExpiryDate: renewedFutureDate,
          renewalReference: 'RENEW-NFSB-2026-881',
          notes: 'Completed recertification training course'
        }
      });
      expect(renewRes.status()).toBe(200);
      const renewData = await renewRes.json();
      expect(renewData.certification.status).toBe('VALID');

      // 5. Re-check employee's individual certifications endpoint
      const staffCertsRes = await request.get(
        `/api/admin/hr/compliance-certifications?employeeId=${employee.id}`
      );
      expect(staffCertsRes.status()).toBe(200);
      const staffCertsData = await staffCertsRes.json();
      expect(staffCertsData.count).toBe(2);

      const allValid = staffCertsData.certifications.every((c: any) => c.status === 'VALID');
      expect(allValid).toBe(true);
    } finally {
      if (certIds.length > 0) {
        await prisma.auditLog.deleteMany({
          where: { resource: 'StaffCertification', id: { in: certIds } }
        }).catch(() => {});
      }
      await prisma.employee.delete({ where: { id: employee.id } }).catch(() => {});
    }
  });
});

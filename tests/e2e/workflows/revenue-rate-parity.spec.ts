import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Rate Parity Enforcement Across Properties (Feature 2.3)', () => {
  const CSRF_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'origin': 'http://localhost:3000'
  };

  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Conducts baseline rate parity audit and returns structured compliance report', async ({ request }) => {
    const res = await request.get('/api/admin/rates/parity-audit');
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);

    const report = data.report;
    expect(report.totalPropertiesAudited).toBeGreaterThanOrEqual(3);
    expect(typeof report.parityScore).toBe('number');
    expect(['EXCELLENT', 'GOOD', 'AT_RISK']).toContain(report.healthGrade);
    expect(Array.isArray(report.violations)).toBe(true);
    expect(Array.isArray(report.clusterAnalysis)).toBe(true);
  });

  test('2. Accurately detects OTA undercut violations and auto-enforces parity', async ({ request }) => {
    // 1. Find or create an active ChannelConnection
    const cch = await prisma.property.findFirst({ where: { code: 'CCH' } });
    expect(cch).toBeDefined();

    let connection = await prisma.channelConnection.findFirst({
      where: { propertyId: cch!.id }
    });

    const provider = await prisma.channelProvider.findFirst({ where: { code: 'BOOKING_COM' } });
    expect(provider).toBeDefined();

    if (!connection) {
      connection = await prisma.channelConnection.create({
        data: {
          propertyId: cch!.id,
          providerId: provider!.id,
          status: 'HEALTHY',
          clientId: 'test-client-id'
        }
      });
    }

    // 2. Inject an intentional rate parity violation: -15% markup (OTA Undercut)
    const testMapping = await prisma.channelRateMapping.create({
      data: {
        connectionId: connection.id,
        localRatePlanId: 'TEST-RP-1',
        externalRateId: 'OTA-UNDERCUT-RATE',
        priceMarkupPercentage: -15.0, // Undercut direct rates!
        syncRates: true
      }
    });

    try {
      // 3. Run audit - must detect the violation
      const auditRes = await request.get('/api/admin/rates/parity-audit');
      expect(auditRes.status()).toBe(200);

      const auditData = await auditRes.json();
      const report = auditData.report;

      const undercutViolation = report.violations.find(
        (v: any) => v.type === 'OTA_UNDERCUT' && v.currentValue === '-15%'
      );
      expect(undercutViolation).toBeDefined();
      expect(undercutViolation.severity).toBe('HIGH');
      expect(undercutViolation.recommendedAction).toContain('priceMarkupPercentage');

      // 4. Auto-enforce rate parity
      const enforceRes = await request.post('/api/admin/rates/parity-audit', {
        headers: CSRF_HEADERS
      });
      expect(enforceRes.status()).toBe(200);

      const enforceData = await enforceRes.json();
      expect(enforceData.success).toBe(true);
      expect(enforceData.enforcement.remediatedMappingsCount).toBeGreaterThanOrEqual(1);

      // 5. Verify database remediation
      const updatedMapping = await prisma.channelRateMapping.findUnique({
        where: { id: testMapping.id }
      });
      expect(Number(updatedMapping!.priceMarkupPercentage)).toBe(0.0);
    } finally {
      // Clean up test mapping
      await prisma.channelRateMapping.delete({
        where: { id: testMapping.id }
      });
    }
  });
});

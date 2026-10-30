import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Multi-Property Rate Plan Inheritance & Master BAR Grid (Feature 2.1)', () => {
  const CSRF_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'origin': 'http://localhost:3000'
  };

  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates required parameters when creating master rate plan', async ({ request }) => {
    const res = await request.post('/api/admin/rates/master-plans', {
      headers: CSRF_HEADERS,
      data: {}
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('required');
  });

  test('2. Successfully cascades Master Rate Plan to all properties and room types', async ({ request }) => {
    const planCode = `BFR-${Date.now().toString().slice(-5)}`;
    const planName = 'Best Flexible Rate - Corporate Master';

    const res = await request.post('/api/admin/rates/master-plans', {
      headers: CSRF_HEADERS,
      data: {
        name: planName,
        code: planCode,
        description: 'Global corporate best flexible rate with breakfast and 24h cancellation',
        baseMultiplier: 1.15,
        cancelPolicy: 'FLEXIBLE',
        nonRefundable: false,
        isDefault: false
      }
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    const master = data.masterRatePlan;
    expect(master.code).toBe(planCode);
    expect(master.baseMultiplier).toBe(1.15);
    expect(master.targetPropertiesCount).toBeGreaterThanOrEqual(3);
    expect(master.cascadedRoomTypesCount).toBeGreaterThan(0);

    const fullName = `[${planCode}] ${planName}`;

    try {
      // Verify DB records across multiple properties
      const createdChildPlans = await prisma.ratePlan.findMany({
        where: { name: fullName },
        include: { property: true, roomType: true }
      });

      expect(createdChildPlans.length).toBe(master.cascadedRoomTypesCount);

      // Verify plans exist in distinct properties (e.g. CCH, MVL, GOR)
      const distinctPropertyIds = new Set(createdChildPlans.map((p) => p.propertyId));
      expect(distinctPropertyIds.size).toBeGreaterThanOrEqual(3);

      for (const child of createdChildPlans) {
        expect(Number(child.baseMultiplier)).toBe(1.15);
        expect(child.cancelPolicy).toBe('FLEXIBLE');
        expect(child.nonRefundable).toBe(false);
        expect(child.active).toBe(true);
      }

      // Verify GET listing endpoint
      const listRes = await request.get('/api/admin/rates/master-plans');
      expect(listRes.status()).toBe(200);
      const listData = await listRes.json();
      expect(listData.success).toBe(true);

      const foundMaster = listData.masterRatePlans.find((p: any) => p.code === planCode);
      expect(foundMaster).toBeDefined();
      expect(foundMaster.targetPropertiesCount).toBeGreaterThanOrEqual(3);
      expect(foundMaster.participatingProperties.length).toBeGreaterThanOrEqual(3);
    } finally {
      // Clean up cascaded rate plans
      await prisma.ratePlan.deleteMany({
        where: { name: fullName }
      });
    }
  });
});

import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Cluster Dynamic Pricing & Regional Yield Coordination (Feature 2.2)', () => {
  const CSRF_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'origin': 'http://localhost:3000'
  };

  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates required parameters when creating cluster yield rules', async ({ request }) => {
    const res = await request.post('/api/admin/yield/cluster-rules', {
      headers: CSRF_HEADERS,
      data: {}
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('required');
  });

  test('2. Establishes coordinated cluster yield rules across multiple sister properties', async ({ request }) => {
    const ruleName = `Marathon Regional Surge ${Date.now().toString().slice(-4)}`;
    const startDate = '2026-11-01';
    const endDate = '2026-11-05';

    const res = await request.post('/api/admin/yield/cluster-rules', {
      headers: CSRF_HEADERS,
      data: {
        name: ruleName,
        startDate,
        endDate,
        minOccupancy: 0,
        maxOccupancy: 100,
        adjustmentType: 'PERCENTAGE',
        adjustmentValue: 30,
        description: '30% coordinated rate surge during regional sports event'
      }
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    const rule = data.clusterYieldRule;
    expect(rule.name).toBe(ruleName);
    expect(rule.adjustmentValue).toBe(30);
    expect(rule.targetPropertiesCount).toBeGreaterThanOrEqual(3);

    const clusterTag = rule.clusterRuleTag;

    try {
      // Verify DB records
      const dbRules = await prisma.yieldRule.findMany({
        where: { name: { startsWith: clusterTag } }
      });
      expect(dbRules.length).toBeGreaterThanOrEqual(3);

      for (const r of dbRules) {
        expect(Number(r.adjustmentValue)).toBe(30);
        expect(r.adjustmentType).toBe('PERCENTAGE');
        expect(r.isActive).toBe(true);
      }

      // Evaluate Cluster Yield on date
      const evalRes = await request.get('/api/admin/yield/cluster-rules?evaluationDate=2026-11-03');
      expect(evalRes.status()).toBe(200);
      const evalData = await evalRes.json();
      expect(evalData.success).toBe(true);

      const evaluation = evalData.evaluation;
      expect(evaluation.totalClusterRooms).toBeGreaterThan(0);
      expect(typeof evaluation.clusterOccupancyRate).toBe('number');
      expect(evaluation.surgePercentage).toBe(30);
      expect(evaluation.appliedSurgeMultiplier).toBe(1.3);
    } finally {
      // Clean up
      await prisma.yieldRule.deleteMany({
        where: { name: { startsWith: clusterTag } }
      });
    }
  });
});

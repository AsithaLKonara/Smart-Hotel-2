import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Central Kitchen & Bakery Commissary Model (Feature 5.2)', () => {
  test.setTimeout(90000);

  const CSRF_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'origin': 'http://localhost:3000'
  };

  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates required parameters and rejects identical ordering/commissary properties', async ({ request }) => {
    const propA = await prisma.property.findFirst({ where: { code: 'CCH' } });
    expect(propA).toBeDefined();

    const samePropRes = await request.post('/api/kitchen/commissary', {
      headers: CSRF_HEADERS,
      data: {
        action: 'CREATE_INDENT',
        orderingPropertyId: propA!.id,
        commissaryPropertyId: propA!.id,
        deliveryDate: '2026-11-01',
        items: [{ name: 'Brioche Bun', category: 'BAKERY', quantity: 50, unit: 'pcs', unitCost: 0.8 }]
      }
    });
    expect(samePropRes.status()).toBe(400);
    const json = await samePropRes.json();
    expect(json.details || json.error).toContain('cannot be identical');
  });

  test('2. Aggregates multi-property daily indents, computes production batch, and performs HACCP dispatch/receive', async ({ request }) => {
    const propCentral = await prisma.property.findFirst({ where: { code: 'CCH' } }); // Central Commissary Hub
    const propSatellite = await prisma.property.findFirst({ where: { code: 'GOR' } }); // Satellite Resort
    expect(propCentral).toBeDefined();
    expect(propSatellite).toBeDefined();

    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const createdIndentIds: string[] = [];

    try {
      // 1. Satellite Property B places daily bakery indent for tomorrow
      const indentRes1 = await request.post('/api/kitchen/commissary', {
        headers: CSRF_HEADERS,
        data: {
          action: 'CREATE_INDENT',
          orderingPropertyId: propSatellite!.id,
          commissaryPropertyId: propCentral!.id,
          deliveryDate: tomorrow,
          notes: 'Morning buffet and coffee shop replenishment',
          items: [
            { name: 'Artisan Butter Croissant', category: 'BAKERY', quantity: 100, unit: 'pcs', unitCost: 1.2 },
            { name: 'Pain au Chocolat', category: 'BAKERY', quantity: 40, unit: 'pcs', unitCost: 1.4 },
            { name: 'Marinated Chicken Brochette', category: 'BUTCHERY', quantity: 20, unit: 'kg', unitCost: 4.5 }
          ]
        }
      });
      expect(indentRes1.status()).toBe(200);
      const data1 = await indentRes1.json();
      expect(data1.success).toBe(true);
      expect(data1.indent.status).toBe('SUBMITTED');
      expect(data1.indent.totalCost).toBe(100 * 1.2 + 40 * 1.4 + 20 * 4.5); // 120 + 56 + 90 = 266
      createdIndentIds.push(data1.indent.id);

      // 2. Another outlet or department at Satellite Property B places second indent for tomorrow
      const indentRes2 = await request.post('/api/kitchen/commissary', {
        headers: CSRF_HEADERS,
        data: {
          action: 'CREATE_INDENT',
          orderingPropertyId: propSatellite!.id,
          commissaryPropertyId: propCentral!.id,
          deliveryDate: tomorrow,
          notes: 'Banquet dinner requirements',
          items: [
            { name: 'Artisan Butter Croissant', category: 'BAKERY', quantity: 50, unit: 'pcs', unitCost: 1.2 },
            { name: 'Rustic Sourdough Loaf', category: 'BAKERY', quantity: 15, unit: 'loaves', unitCost: 2.5 }
          ]
        }
      });
      expect(indentRes2.status()).toBe(200);
      const data2 = await indentRes2.json();
      createdIndentIds.push(data2.indent.id);

      // 3. Central Commissary Chef queries tomorrow's aggregated production schedule
      const schedRes = await request.get(
        `/api/kitchen/commissary?type=schedule&commissaryPropertyId=${propCentral!.id}&deliveryDate=${tomorrow}`
      );
      expect(schedRes.status()).toBe(200);

      const schedData = await schedRes.json();
      expect(schedData.success).toBe(true);
      const schedule = schedData.schedule;
      expect(schedule.totalIndents).toBe(2);

      // Verify aggregated quantities across indents:
      // Croissants: 100 + 50 = 150
      const aggregatedCroissants = schedule.productionItems.find(
        (i: any) => i.name === 'Artisan Butter Croissant'
      );
      expect(aggregatedCroissants).toBeDefined();
      expect(aggregatedCroissants.totalQuantity).toBe(150);

      // Sourdough: 15
      const aggregatedSourdough = schedule.productionItems.find(
        (i: any) => i.name === 'Rustic Sourdough Loaf'
      );
      expect(aggregatedSourdough).toBeDefined();
      expect(aggregatedSourdough.totalQuantity).toBe(15);

      // 4. Central Commissary packs and dispatches Indent 1 with HACCP cold-chain temperature (3.5°C)
      const dispatchRes = await request.post('/api/kitchen/commissary', {
        headers: CSRF_HEADERS,
        data: {
          action: 'DISPATCH',
          indentId: createdIndentIds[0],
          dispatchTempC: 3.5,
          driverName: 'Saman Silva',
          vehicleNumber: 'WP-CAD-8812 (Refrigerated Van)'
        }
      });
      expect(dispatchRes.status()).toBe(200);
      const dispatchData = await dispatchRes.json();
      expect(dispatchData.indent.status).toBe('DISPATCHED');
      expect(dispatchData.indent.haccpCompliant).toBe(true);

      // 5. Satellite Property B receives delivery, checks temperature (4.1°C), and confirms quality
      const receiveRes = await request.post('/api/kitchen/commissary', {
        headers: CSRF_HEADERS,
        data: {
          action: 'RECEIVE',
          indentId: createdIndentIds[0],
          receivingTempC: 4.1,
          qualityRating: 5,
          acceptedItems: [
            { name: 'Artisan Butter Croissant', quantity: 100 },
            { name: 'Pain au Chocolat', quantity: 40 },
            { name: 'Marinated Chicken Brochette', quantity: 20 }
          ],
          receiverNotes: 'Excellent bake quality and crispness. Temperature maintained within HACCP range.'
        }
      });
      expect(receiveRes.status()).toBe(200);
      const receiveData = await receiveRes.json();
      expect(receiveData.indent.status).toBe('DELIVERED');
      expect(receiveData.indent.receivingTempC).toBe(4.1);
    } finally {
      // Clean up audit logs
      if (createdIndentIds.length > 0) {
        await prisma.auditLog.deleteMany({
          where: { id: { in: createdIndentIds } }
        }).catch(() => {});
      }
    }
  });
});

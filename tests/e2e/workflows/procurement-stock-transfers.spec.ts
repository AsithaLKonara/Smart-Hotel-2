import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Central Warehouse & Stock Transfer Orders (STO) (Feature 5.1)', () => {
  test.setTimeout(90000);

  const CSRF_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'origin': 'http://localhost:3000'
  };

  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates required parameters and rejects identical source/destination properties', async ({ request }) => {
    const propA = await prisma.property.findFirst({ where: { code: 'CCH' } });
    expect(propA).toBeDefined();

    // Identical property test
    const samePropRes = await request.post('/api/admin/procurement/stock-transfers', {
      headers: CSRF_HEADERS,
      data: {
        action: 'CREATE',
        sourcePropertyId: propA!.id,
        destinationPropertyId: propA!.id,
        items: [{ itemId: 'dummy-item', requestedQuantity: 10 }]
      }
    });
    expect(samePropRes.status()).toBe(400);
    const json = await samePropRes.json();
    expect(json.details || json.error).toContain('cannot be the same');
  });

  test('2. Complete STO Lifecycle: Request -> Approve -> Dispatch -> Receive with Discrepancy Reconciliation', async ({ request }) => {
    const propA = await prisma.property.findFirst({ where: { code: 'CCH' } }); // Central Warehouse
    const propB = await prisma.property.findFirst({ where: { code: 'GOR' } }); // Satellite Resort
    expect(propA).toBeDefined();
    expect(propB).toBeDefined();

    // 1. Create a test inventory item
    const skuCode = `SKU-TOWEL-${Date.now().toString().slice(-6)}`;
    const testItem = await prisma.inventoryItem.create({
      data: {
        name: 'Egyptian Cotton Bath Towel',
        sku: skuCode,
        category: 'HOUSEKEEPING_LINEN',
        unit: 'piece',
        unitPrice: 15.5,
        parLevel: 50
      }
    });

    let createdStoId: string | null = null;

    try {
      // 2. Seed initial warehouse stock at Property A (100 units)
      await prisma.inventoryStock.create({
        data: {
          itemId: testItem.id,
          propertyId: propA!.id,
          location: 'CENTRAL_AMENITY_DEPOT',
          quantity: 100
        }
      });

      // 3. Satellite Property B requests 30 bath towels from Central Warehouse A
      const createRes = await request.post('/api/admin/procurement/stock-transfers', {
        headers: CSRF_HEADERS,
        data: {
          action: 'CREATE',
          sourcePropertyId: propA!.id,
          destinationPropertyId: propB!.id,
          priority: 'URGENT',
          notes: 'Emergency linen replenishment for weekend full house',
          items: [{ itemId: testItem.id, requestedQuantity: 30 }]
        }
      });
      expect(createRes.status()).toBe(200);

      const createData = await createRes.json();
      expect(createData.success).toBe(true);
      expect(createData.transferOrder.status).toBe('REQUESTED');
      createdStoId = createData.transferOrder.id;

      // 4. Central Procurement Manager approves the STO
      const approveRes = await request.post('/api/admin/procurement/stock-transfers', {
        headers: CSRF_HEADERS,
        data: {
          action: 'APPROVE',
          stoId: createdStoId
        }
      });
      expect(approveRes.status()).toBe(200);
      const approveData = await approveRes.json();
      expect(approveData.transferOrder.status).toBe('APPROVED');

      // 5. Central Warehouse dispatches the 30 units via logistics courier
      const dispatchRes = await request.post('/api/admin/procurement/stock-transfers', {
        headers: CSRF_HEADERS,
        data: {
          action: 'DISPATCH',
          stoId: createdStoId,
          carrier: 'Swift Logistics Hub',
          waybillNumber: 'WB-99210-SL',
          itemsDispatched: [{ itemId: testItem.id, dispatchedQuantity: 30 }]
        }
      });
      expect(dispatchRes.status()).toBe(200);
      const dispatchData = await dispatchRes.json();
      expect(dispatchData.transferOrder.status).toBe('DISPATCHED');

      // Verify Source Property A inventory was deducted from 100 down to 70
      const sourceStock = await prisma.inventoryStock.findFirst({
        where: { itemId: testItem.id, propertyId: propA!.id }
      });
      expect(sourceStock?.quantity).toBe(70);

      // Verify TRANSFER_OUT movement was created
      const outMovement = await prisma.inventoryMovement.findFirst({
        where: { itemId: testItem.id, propertyId: propA!.id, type: 'TRANSFER_OUT' }
      });
      expect(outMovement).toBeDefined();
      expect(outMovement?.quantity).toBe(-30);

      // 6. Satellite Property B receives items with discrepancy:
      // Dispatched = 30; Received in good order = 28; Transit Damaged = 1; Missing = 1.
      const receiveRes = await request.post('/api/admin/procurement/stock-transfers', {
        headers: CSRF_HEADERS,
        data: {
          action: 'RECEIVE',
          stoId: createdStoId,
          receivingNotes: 'One carton had water damage, one towel missing from count',
          itemsReceived: [
            {
              itemId: testItem.id,
              receivedQuantity: 28,
              damagedQuantity: 1
            }
          ]
        }
      });
      expect(receiveRes.status()).toBe(200);

      const receiveData = await receiveRes.json();
      expect(receiveData.success).toBe(true);
      expect(receiveData.transferOrder.status).toBe('RECEIVED_WITH_DISCREPANCY');

      const discrepancy = receiveData.transferOrder.discrepancySummary;
      expect(discrepancy.hasDiscrepancy).toBe(true);
      expect(discrepancy.totalMissing).toBe(1);
      expect(discrepancy.totalDamaged).toBe(1);

      // Verify Destination Property B received stock is exactly 28
      const destStock = await prisma.inventoryStock.findFirst({
        where: { itemId: testItem.id, propertyId: propB!.id }
      });
      expect(destStock?.quantity).toBe(28);

      // Verify TRANSFER_IN (28) and TRANSFER_DAMAGE (-1) movements
      const inMovement = await prisma.inventoryMovement.findFirst({
        where: { itemId: testItem.id, propertyId: propB!.id, type: 'TRANSFER_IN' }
      });
      expect(inMovement?.quantity).toBe(28);

      const damageMovement = await prisma.inventoryMovement.findFirst({
        where: { itemId: testItem.id, propertyId: propB!.id, type: 'TRANSFER_DAMAGE' }
      });
      expect(damageMovement?.quantity).toBe(-1);

      // 7. Verify STO details retrieval via GET endpoint
      const getRes = await request.get(`/api/admin/procurement/stock-transfers?id=${createdStoId}`);
      expect(getRes.status()).toBe(200);
      const getData = await getRes.json();
      expect(getData.transferOrder.transferNumber).toContain('STO-');
      expect(getData.transferOrder.status).toBe('RECEIVED_WITH_DISCREPANCY');
      expect(getData.transferOrder.items[0].receivedQuantity).toBe(28);
    } finally {
      // Clean up test data
      if (createdStoId) {
        await prisma.auditLog.delete({ where: { id: createdStoId } }).catch(() => {});
      }
      await prisma.inventoryMovement.deleteMany({ where: { itemId: testItem.id } }).catch(() => {});
      await prisma.inventoryStock.deleteMany({ where: { itemId: testItem.id } }).catch(() => {});
      await prisma.inventoryItem.delete({ where: { id: testItem.id } }).catch(() => {});
    }
  });
});

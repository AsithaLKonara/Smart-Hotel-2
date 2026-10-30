import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

// Use admin storage state for all operations
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('CRS Multi-Property Group Blocks - Master Contracts (Feature 1.4)', () => {
  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates required parameters when creating a master group contract', async ({ request }) => {
    const res = await request.post('/api/crs/group-blocks', {
      data: {}
    });
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('required');
  });

  test('2. Successfully establishes and manages a multi-property master group contract across sister hotels', async ({ request }) => {
    // 1. Fetch properties
    const propA = await prisma.property.findFirst({ where: { code: 'CCH' } });
    const propB = await prisma.property.findFirst({ where: { code: 'GOR' } });
    expect(propA).toBeDefined();
    expect(propB).toBeDefined();

    // Fetch room types
    const roomTypeA = await prisma.roomType.findFirst({ where: { propertyId: propA!.id } });
    const roomTypeB = await prisma.roomType.findFirst({ where: { propertyId: propB!.id } });
    expect(roomTypeA).toBeDefined();
    expect(roomTypeB).toBeDefined();

    const contractCode = `MC-SUMMIT-${Date.now().toString().slice(-6)}`;
    const startDate = '2026-11-20';
    const endDate = '2026-11-25';

    // 2. Create Master Group Contract spanning both properties
    const createRes = await request.post('/api/crs/group-blocks', {
      data: {
        contractName: 'Global AI Summit 2026 Master Contract',
        contractCode,
        organizerName: 'Enterprise Summit Consortium',
        organizerEmail: 'summit-planner@consortium.test',
        startDate,
        endDate,
        expectedAttendees: 120,
        allocations: [
          {
            propertyId: propA!.id,
            roomTypeId: roomTypeA!.id,
            blockedCount: 10,
            contractedRate: 220
          },
          {
            propertyId: propB!.id,
            roomTypeId: roomTypeB!.id,
            blockedCount: 5,
            contractedRate: 340
          }
        ]
      }
    });

    expect(createRes.status()).toBe(200);
    const createData = await createRes.json();
    expect(createData.success).toBe(true);

    const contract = createData.masterContract;
    expect(contract.contractCode).toBe(contractCode);
    expect(contract.totalProperties).toBe(2);
    expect(contract.totalRoomsBlocked).toBe(15); // 10 + 5
    expect(contract.consolidatedNightlyRate).toBe(10 * 220 + 5 * 340); // 3900

    try {
      // 3. Query Master Contract by Code
      const getRes = await request.get(`/api/crs/group-blocks/${contractCode}`);
      expect(getRes.status()).toBe(200);
      const getData = await getRes.json();
      expect(getData.success).toBe(true);
      expect(getData.contract.contractCode).toBe(contractCode);
      expect(getData.contract.totalProperties).toBe(2);
      expect(getData.contract.participatingProperties.length).toBe(2);

      // Verify each participating property's block
      const propACheck = getData.contract.participatingProperties.find(
        (p: any) => p.propertyCode === 'CCH'
      );
      expect(propACheck).toBeDefined();
      expect(propACheck.blocks[0].blockedCount).toBe(10);
      expect(propACheck.blocks[0].contractedRate).toBe(220);

      const propBCheck = getData.contract.participatingProperties.find(
        (p: any) => p.propertyCode === 'GOR'
      );
      expect(propBCheck).toBeDefined();
      expect(propBCheck.blocks[0].blockedCount).toBe(5);
      expect(propBCheck.blocks[0].contractedRate).toBe(340);

      // 4. Release Unpicked Allocations Across All Properties
      const releaseRes = await request.patch(`/api/crs/group-blocks/${contractCode}`, {
        data: { action: 'RELEASE' }
      });
      expect(releaseRes.status()).toBe(200);
      const releaseData = await releaseRes.json();
      expect(releaseData.success).toBe(true);
      expect(releaseData.status).toBe('RELEASED');
      expect(releaseData.releasedPropertiesCount).toBe(2);

      // 5. Verify Database State
      const dbEvents = await prisma.banquetingEvent.findMany({
        where: { name: { startsWith: `[${contractCode}]` } }
      });
      expect(dbEvents.length).toBe(2);
      for (const ev of dbEvents) {
        expect(ev.status).toBe('RELEASED');
      }
    } finally {
      // Clean up test events and child group blocks
      const eventsToDelete = await prisma.banquetingEvent.findMany({
        where: { name: { startsWith: `[${contractCode}]` } },
        select: { id: true }
      });
      const eventIds = eventsToDelete.map((e) => e.id);

      await prisma.groupBlock.deleteMany({
        where: { eventId: { in: eventIds } }
      });
      await prisma.banquetingEvent.deleteMany({
        where: { id: { in: eventIds } }
      });
    }
  });
});

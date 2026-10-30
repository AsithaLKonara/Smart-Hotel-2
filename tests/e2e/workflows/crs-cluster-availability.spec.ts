import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

test.describe('CRS Cluster Availability Search & Cross-Selling (Feature 1.1)', () => {
  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates input parameters and rejects invalid date ranges', async ({ request }) => {
    // Missing dates
    const res1 = await request.get('/api/crs/availability');
    expect(res1.status()).toBe(400);
    const json1 = await res1.json();
    expect(json1.error).toContain('required');

    // Invalid dates (checkIn >= checkOut)
    const res2 = await request.get('/api/crs/availability?checkIn=2026-11-10&checkOut=2026-11-09');
    expect(res2.status()).toBe(400);
    const json2 = await res2.json();
    expect(json2.error).toContain('strictly after');
  });

  test('2. Searches cluster-wide availability without target property', async ({ request }) => {
    const res = await request.get('/api/crs/availability?checkIn=2026-12-01&checkOut=2026-12-05');
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.targetProperty).toBeNull();
    expect(data.isTargetSoldOut).toBe(false);
    expect(Array.isArray(data.clusterOverview)).toBe(true);
    expect(data.clusterOverview.length).toBeGreaterThanOrEqual(2);

    // Each property overview must provide structured room information
    for (const prop of data.clusterOverview) {
      expect(prop.propertyId).toBeDefined();
      expect(prop.propertyName).toBeDefined();
      expect(typeof prop.totalRooms).toBe('number');
      expect(typeof prop.availableRoomsCount).toBe('number');
      expect(typeof prop.isSoldOut).toBe('boolean');
      expect(Array.isArray(prop.roomTypes)).toBe(true);
    }
  });

  test('3. Searches target property when available and confirms normal availability', async ({ request }) => {
    // Get City Center Hotel
    const cch = await prisma.property.findFirst({
      where: { code: 'CCH' }
    });
    expect(cch).toBeDefined();

    const res = await request.get(
      `/api/crs/availability?checkIn=2026-12-10&checkOut=2026-12-14&targetPropertyId=${cch!.id}`
    );
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.targetProperty).toBeDefined();
    expect(data.targetProperty.propertyId).toBe(cch!.id);
    expect(data.targetProperty.propertyCode).toBe('CCH');
    expect(data.isTargetSoldOut).toBe(false);
    expect(data.targetProperty.availableRoomsCount).toBeGreaterThan(0);
    expect(data.targetProperty.availableRoomTypes.length).toBeGreaterThan(0);
  });

  test('4. Cross-sells sister properties with distance calculation when target property is sold out', async ({ request }) => {
    // Find target property CCH
    const cch = await prisma.property.findFirst({
      where: { code: 'CCH' }
    });
    expect(cch).toBeDefined();

    // Find all active rooms in CCH
    const cchRooms = await prisma.room.findMany({
      where: { propertyId: cch!.id, deletedAt: null }
    });
    expect(cchRooms.length).toBeGreaterThan(0);

    // Create a temporary booking occupying all rooms in CCH for 2026-12-24 to 2026-12-26 (Christmas Eve peak)
    const checkIn = new Date('2026-12-24T00:00:00.000Z');
    const checkOut = new Date('2026-12-26T00:00:00.000Z');

    const guestUser = await prisma.user.findFirst();
    expect(guestUser).toBeDefined();

    const tempBooking = await prisma.booking.create({
      data: {
        confirmationCode: `CRS-TEST-${Date.now()}`,
        checkIn,
        checkOut,
        status: 'CONFIRMED',
        totalAmount: 1000,
        propertyId: cch!.id,
        primaryGuestId: guestUser!.id
      }
    });

    // Create active room assignments for all rooms in CCH
    const assignments = await prisma.roomAssignment.createMany({
      data: cchRooms.map((room) => ({
        roomId: room.id,
        bookingId: tempBooking.id,
        startDate: checkIn,
        endDate: checkOut,
        status: 'ACTIVE'
      }))
    });

    try {
      // Query CRS availability for CCH on these sold-out dates
      const res = await request.get(
        `/api/crs/availability?checkIn=2026-12-24&checkOut=2026-12-26&targetPropertyId=${cch!.id}`
      );
      expect(res.status()).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isTargetSoldOut).toBe(true);
      expect(data.targetProperty.isSoldOut).toBe(true);
      expect(data.targetProperty.availableRoomsCount).toBe(0);

      // Verify sister property cross-sell recommendations
      expect(data.crossSellingRecommendations.length).toBeGreaterThan(0);

      const rec = data.crossSellingRecommendations[0];
      expect(rec.propertyId).not.toBe(cch!.id);
      expect(rec.propertyName).toBeDefined();
      expect(typeof rec.distanceKm).toBe('number');
      expect(rec.distanceKm).toBeGreaterThan(0); // Great circle distance from NYC
      expect(rec.availableRoomsCount).toBeGreaterThan(0);
      expect(rec.availableRoomTypes.length).toBeGreaterThan(0);
      expect(rec.crossSellPerks.length).toBeGreaterThan(0);
      expect(rec.crossSellPerks).toContain('Direct Chain Guarantee');
    } finally {
      // Clean up test booking and room assignments
      await prisma.roomAssignment.deleteMany({
        where: { bookingId: tempBooking.id }
      });
      await prisma.booking.delete({
        where: { id: tempBooking.id }
      });
    }
  });

  test('5. Supports POST endpoint with city cluster filter and max distance', async ({ request }) => {
    const res = await request.post('/api/crs/availability', {
      data: {
        checkIn: '2026-12-01',
        checkOut: '2026-12-05',
        clusterCity: 'New York'
      }
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.clusterOverview.length).toBe(1);
    expect(data.clusterOverview[0].city).toBe('New York');
    expect(data.clusterOverview[0].propertyCode).toBe('CCH');
  });
});

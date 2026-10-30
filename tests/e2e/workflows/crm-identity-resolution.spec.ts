import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Central Guest Deduplication & Golden Record Resolution (Feature 4.1)', () => {
  const CSRF_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'origin': 'http://localhost:3000'
  };

  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates required parameters when merging guest profiles', async ({ request }) => {
    // Missing fields
    const res1 = await request.post('/api/crm/deduplication', {
      headers: CSRF_HEADERS,
      data: {}
    });
    expect(res1.status()).toBe(400);
    const json1 = await res1.json();
    expect(json1.error).toContain('required');

    // Same ID
    const user = await prisma.user.findFirst();
    expect(user).toBeDefined();

    const res2 = await request.post('/api/crm/deduplication', {
      headers: CSRF_HEADERS,
      data: {
        primaryId: user!.id,
        secondaryId: user!.id
      }
    });
    expect(res2.status()).toBe(400);
    const json2 = await res2.json();
    expect(json2.message).toContain('itself');
  });

  test('2. Accurately identifies duplicates and atomically merges into Golden Record', async ({ request }) => {
    const propA = await prisma.property.findFirst({ where: { code: 'CCH' } });
    const propB = await prisma.property.findFirst({ where: { code: 'GOR' } });
    expect(propA).toBeDefined();
    expect(propB).toBeDefined();

    const sharedPhone = `+1-555-${Date.now().toString().slice(-4)}-9999`;

    // 1. Create Profile A at Property A with 1 booking
    const profileA = await prisma.user.create({
      data: {
        name: 'Jonathan Harrison',
        email: `jharrison-${Date.now()}@test.com`,
        phone: sharedPhone,
        password: crypto.randomBytes(16).toString('hex'),
        propertyId: propA!.id,
        vipStatus: 'SILVER'
      }
    });

    const bookingA = await prisma.booking.create({
      data: {
        confirmationCode: `BKG-A-${Date.now().toString().slice(-5)}`,
        checkIn: new Date('2026-11-10'),
        checkOut: new Date('2026-11-12'),
        status: 'CONFIRMED',
        totalAmount: 400,
        propertyId: propA!.id,
        primaryGuestId: profileA.id
      }
    });

    // 2. Create Profile B at Property B with 1 booking and higher VIP status
    const profileB = await prisma.user.create({
      data: {
        name: 'John Harrison',
        email: `john.h-${Date.now()}@alt-test.com`,
        phone: sharedPhone,
        password: crypto.randomBytes(16).toString('hex'),
        propertyId: propB!.id,
        vipStatus: 'GOLD'
      }
    });

    const bookingB = await prisma.booking.create({
      data: {
        confirmationCode: `BKG-B-${Date.now().toString().slice(-5)}`,
        checkIn: new Date('2026-11-20'),
        checkOut: new Date('2026-11-24'),
        status: 'CONFIRMED',
        totalAmount: 950,
        propertyId: propB!.id,
        primaryGuestId: profileB.id
      }
    });

    try {
      // 3. Scan for duplicates
      const scanRes = await request.get('/api/crm/deduplication');
      expect(scanRes.status()).toBe(200);

      const scanData = await scanRes.json();
      expect(scanData.success).toBe(true);
      expect(Array.isArray(scanData.duplicateCandidates)).toBe(true);

      const matchCandidate = scanData.duplicateCandidates.find(
        (c: any) =>
          (c.primaryCandidate.id === profileA.id && c.duplicateCandidate.id === profileB.id) ||
          (c.primaryCandidate.id === profileB.id && c.duplicateCandidate.id === profileA.id)
      );

      expect(matchCandidate).toBeDefined();
      expect(matchCandidate.confidenceScore).toBeGreaterThanOrEqual(90);
      expect(matchCandidate.matchReason).toContain('phone number');

      // 4. Merge Profile B into Profile A (Golden Record)
      const mergeRes = await request.post('/api/crm/deduplication', {
        headers: CSRF_HEADERS,
        data: {
          primaryId: profileA.id,
          secondaryId: profileB.id
        }
      });

      expect(mergeRes.status()).toBe(200);
      const mergeData = await mergeRes.json();
      expect(mergeData.success).toBe(true);

      const goldenRecord = mergeData.goldenRecord;
      expect(goldenRecord.id).toBe(profileA.id);
      expect(goldenRecord.totalBookingsCount).toBe(2); // Both bookings re-parented
      expect(goldenRecord.vipStatus).toBe('GOLD'); // Inherited higher tier

      // 5. Verify Database State
      const updatedBookingB = await prisma.booking.findUnique({
        where: { id: bookingB.id }
      });
      expect(updatedBookingB!.primaryGuestId).toBe(profileA.id);

      const deletedSecondary = await prisma.user.findUnique({
        where: { id: profileB.id }
      });
      expect(deletedSecondary!.deletedAt).not.toBeNull();
    } finally {
      // Clean up test bookings and profiles
      await prisma.booking.deleteMany({
        where: { id: { in: [bookingA.id, bookingB.id] } }
      });
      await prisma.user.deleteMany({
        where: { id: { in: [profileA.id, profileB.id] } }
      });
    }
  });
});

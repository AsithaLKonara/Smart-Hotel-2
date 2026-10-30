import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Cross-Property Guest Preferences & History Unified Dossier (Feature 4.3)', () => {
  test.setTimeout(90000);
  const CSRF_HEADERS = {
    'sec-fetch-site': 'same-origin',
    'origin': 'http://localhost:3000'
  };

  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates parameter requirements when fetching dossier', async ({ request }) => {
    const res = await request.get('/api/crm/guest-dossier');
    expect(res.status()).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('required');
  });

  test('2. Aggregates multi-property stays, complaints, and preferences into a unified dossier', async ({ request }) => {
    const propA = await prisma.property.findFirst({ where: { code: 'CCH' } });
    const propB = await prisma.property.findFirst({ where: { code: 'GOR' } });
    expect(propA).toBeDefined();
    expect(propB).toBeDefined();

    const guestEmail = `dossier-test-${Date.now()}@vip-guest.test`;

    // 1. Create Guest user
    const guest = await prisma.user.create({
      data: {
        name: 'Alexander Cross',
        email: guestEmail,
        phone: '+1 555 777 9999',
        password: crypto.randomBytes(16).toString('hex'),
        vipStatus: 'GOLD',
        propertyId: propA!.id
      }
    });

    let bookingA: any = null;
    let complaintA: any = null;

    try {
      // 2. Find a room in Property A
      const roomA = await prisma.room.findFirst({ where: { propertyId: propA!.id } });
      expect(roomA).toBeDefined();

      // 3. Create a past stay at Property A (CCH)
      bookingA = await prisma.booking.create({
        data: {
          confirmationCode: `DOS-${Date.now().toString().slice(-6)}`,
          propertyId: propA!.id,
          primaryGuestId: guest.id,
          checkIn: new Date(Date.now() - 7 * 86400000),
          checkOut: new Date(Date.now() - 4 * 86400000),
          totalAmount: 450.0,
          paymentStatus: 'completed',
          status: 'CHECKED_OUT',
          source: 'WALK_IN',
          roomAssignments: {
            create: {
              roomId: roomA!.id,
              startDate: new Date(Date.now() - 7 * 86400000),
              endDate: new Date(Date.now() - 4 * 86400000),
              status: 'COMPLETED'
            }
          }
        }
      });

      // 4. Log a complaint at Property A
      complaintA = await prisma.complaint.create({
        data: {
          userId: guest.id,
          bookingId: bookingA.id,
          subject: 'Noisy Elevator Near Room',
          description: 'Guest requested room away from elevators for future stays.',
          category: 'ROOM',
          status: 'RESOLVED',
          priority: 'MEDIUM'
        }
      });

      // 5. Concierge at Sister Property B queries the unified guest dossier
      const dossierRes = await request.get(
        `/api/crm/guest-dossier?email=${encodeURIComponent(guestEmail)}&propertyId=${propB!.id}`
      );
      expect(dossierRes.status()).toBe(200);

      const dossierData = await dossierRes.json();
      expect(dossierData.success).toBe(true);

      const dossier = dossierData.dossier;
      expect(dossier.guest.name).toBe('Alexander Cross');
      expect(dossier.guest.vipStatus).toBe('GOLD');

      // Verify cross-property metrics
      expect(dossier.stayMetrics.totalChainStays).toBe(1);
      expect(dossier.stayMetrics.totalChainSpend).toBe(450);

      const cchStay = dossier.stayMetrics.staysByProperty.find((p: any) => p.propertyCode === 'CCH');
      expect(cchStay).toBeDefined();
      expect(cchStay.staysCount).toBe(1);

      // Verify past complaint is surfaced to Sister Property B staff
      expect(dossier.complaintsHistory.length).toBeGreaterThanOrEqual(1);
      const pastComplaint = dossier.complaintsHistory.find((c: any) => c.subject === 'Noisy Elevator Near Room');
      expect(pastComplaint).toBeDefined();

      // 6. Housekeeping & Front Desk at Property B update global preferences
      const updateRes = await request.put('/api/crm/guest-dossier', {
        headers: CSRF_HEADERS,
        data: {
          userId: guest.id,
          dietaryRestrictions: ['Vegetarian'],
          allergies: ['Peanuts', 'Shellfish'],
          roomPreferences: ['Away from elevator', 'Feather pillow', 'Top floor'],
          conciergeNotes: {
            preferredDrink: 'Sparkling Water with Lime',
            welcomeAmenity: 'Fruit basket'
          },
          updatedByPropertyId: propB!.id
        }
      });
      expect(updateRes.status()).toBe(200);

      // 7. Verify updated preferences reflect in subsequent queries
      const reQueryRes = await request.get(
        `/api/crm/guest-dossier?userId=${guest.id}&propertyId=${propA!.id}`
      );
      expect(reQueryRes.status()).toBe(200);

      const reQueryData = await reQueryRes.json();
      const updatedDossier = reQueryData.dossier;

      expect(updatedDossier.preferences.dietaryRestrictions).toContain('Vegetarian');
      expect(updatedDossier.preferences.allergies).toContain('Peanuts');
      expect(updatedDossier.preferences.roomPreferences).toContain('Away from elevator');
      expect(updatedDossier.serviceAlerts.length).toBeGreaterThan(0);
      expect(updatedDossier.serviceAlerts[0]).toContain('DIETARY ALERT');
    } finally {
      if (complaintA) {
        await prisma.complaint.delete({ where: { id: complaintA.id } }).catch(() => {});
      }
      if (bookingA) {
        await prisma.booking.delete({ where: { id: bookingA.id } }).catch(() => {});
      }
      await prisma.guestPreference.deleteMany({ where: { userId: guest.id } }).catch(() => {});
      await prisma.guestProfile.deleteMany({ where: { userAccountId: guest.id } }).catch(() => {});
      await prisma.auditLog.deleteMany({ where: { resourceId: guest.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: guest.id } }).catch(() => {});
    }
  });
});

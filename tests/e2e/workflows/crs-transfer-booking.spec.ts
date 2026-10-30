import { test, expect } from '@playwright/test';
import { enforceThermalGuard } from '../utils/thermal-guard';
import { prisma } from '@/lib/db';

// Use admin storage state for all operations
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('CRS Cross-Property Booking Transfers (Feature 1.2)', () => {
  test.beforeEach(async () => {
    await enforceThermalGuard();
  });

  test('1. Validates required transfer fields and prevents same-property transfer', async ({ request }) => {
    // Missing fields
    const res1 = await request.post('/api/crs/transfer-booking', {
      data: {}
    });
    expect(res1.status()).toBe(400);
    const json1 = await res1.json();
    expect(json1.error).toContain('required');

    // Invalid non-existent booking
    const res2 = await request.post('/api/crs/transfer-booking', {
      data: {
        bookingId: '00000000-0000-0000-0000-000000000000',
        targetPropertyId: 'd059a2bc-83fd-43f9-ac0b-d0685366a455'
      }
    });
    expect(res2.status()).toBe(400);
    const json2 = await res2.json();
    expect(json2.message).toContain('not found');
  });

  test('2. Successfully executes an atomic cross-property transfer with folio and inventory migration', async ({ request }) => {
    // Fetch Property A (City Center Hotel) and Property B (Grand Ocean Resort)
    const propA = await prisma.property.findFirst({ where: { code: 'CCH' } });
    const propB = await prisma.property.findFirst({ where: { code: 'GOR' } });
    expect(propA).toBeDefined();
    expect(propB).toBeDefined();

    // Fetch rooms
    const roomA = await prisma.room.findFirst({ where: { propertyId: propA!.id, deletedAt: null } });
    const roomB = await prisma.room.findFirst({ where: { propertyId: propB!.id, deletedAt: null } });
    expect(roomA).toBeDefined();
    expect(roomB).toBeDefined();

    const guestUser = await prisma.user.findFirst();
    expect(guestUser).toBeDefined();

    // 1. Create source booking at Property A
    const checkIn = new Date('2026-12-15T00:00:00.000Z');
    const checkOut = new Date('2026-12-18T00:00:00.000Z');

    const booking = await prisma.booking.create({
      data: {
        confirmationCode: `XFER-${Date.now()}`,
        checkIn,
        checkOut,
        status: 'CONFIRMED',
        totalAmount: 750,
        propertyId: propA!.id,
        primaryGuestId: guestUser!.id
      }
    });

    // 2. Assign room at Property A
    const initialAssignment = await prisma.roomAssignment.create({
      data: {
        bookingId: booking.id,
        roomId: roomA!.id,
        startDate: checkIn,
        endDate: checkOut,
        status: 'ACTIVE'
      }
    });

    // 3. Create a Folio at Property A
    const initialFolio = await prisma.folio.create({
      data: {
        bookingId: booking.id,
        propertyId: propA!.id,
        type: 'GUEST',
        status: 'OPEN'
      }
    });

    try {
      // 4. Test preventing same-property transfer
      const samePropRes = await request.post('/api/crs/transfer-booking', {
        data: {
          bookingId: booking.id,
          targetPropertyId: propA!.id,
          reason: 'Same hotel move'
        }
      });
      expect(samePropRes.status()).toBe(400);
      const samePropJson = await samePropRes.json();
      expect(samePropJson.message).toContain('different');

      // 5. Execute cross-property transfer to Property B with target room
      const transferRes = await request.post('/api/crs/transfer-booking', {
        data: {
          bookingId: booking.id,
          targetPropertyId: propB!.id,
          targetRoomId: roomB!.id,
          reason: 'Overbooking Walk - Upgraded to Grand Ocean Resort'
        }
      });
      expect(transferRes.status()).toBe(200);

      const transferData = await transferRes.json();
      expect(transferData.success).toBe(true);
      expect(transferData.transfer.bookingId).toBe(booking.id);
      expect(transferData.transfer.previousProperty.code).toBe('CCH');
      expect(transferData.transfer.newProperty.code).toBe('GOR');
      expect(transferData.transfer.newRoomId).toBe(roomB!.id);
      expect(transferData.transfer.newRoomNumber).toBe(roomB!.number);

      // 6. Verify Database Integrity
      // A. Booking propertyId updated
      const updatedBooking = await prisma.booking.findUnique({
        where: { id: booking.id }
      });
      expect(updatedBooking!.propertyId).toBe(propB!.id);

      // B. Old room assignment cancelled
      const oldAssignment = await prisma.roomAssignment.findUnique({
        where: { id: initialAssignment.id }
      });
      expect(oldAssignment!.status).toBe('CANCELLED_TRANSFERRED');

      // C. New active room assignment created in Property B
      const activeAssignments = await prisma.roomAssignment.findMany({
        where: { bookingId: booking.id, status: 'ACTIVE' }
      });
      expect(activeAssignments.length).toBe(1);
      expect(activeAssignments[0].roomId).toBe(roomB!.id);

      // D. Folio propertyId updated to Property B
      const updatedFolio = await prisma.folio.findUnique({
        where: { id: initialFolio.id }
      });
      expect(updatedFolio!.propertyId).toBe(propB!.id);

      // E. StayEvent audit log created
      const stayEvents = await prisma.stayEvent.findMany({
        where: { bookingId: booking.id, type: 'CROSS_PROPERTY_TRANSFER' }
      });
      expect(stayEvents.length).toBe(1);
      expect(stayEvents[0].notes).toContain('Overbooking Walk');
      expect(stayEvents[0].notes).toContain('Grand Ocean Resort');
    } finally {
      // Clean up test data
      await prisma.stayEvent.deleteMany({ where: { bookingId: booking.id } });
      await prisma.roomAssignment.deleteMany({ where: { bookingId: booking.id } });
      await prisma.folio.deleteMany({ where: { bookingId: booking.id } });
      await prisma.booking.delete({ where: { id: booking.id } });
    }
  });
});

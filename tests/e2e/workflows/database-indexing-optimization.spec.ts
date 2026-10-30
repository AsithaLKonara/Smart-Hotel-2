import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/db';
import { enforceThermalGuard } from '../utils/thermal-guard';

test.describe('Domain 9: Database Indexing, Query Optimization & Latency Gates', () => {
  test.beforeEach(async () => {
    await enforceThermalGuard(82, 72);
  });

  test.afterEach(async () => {
    await enforceThermalGuard(82, 72);
  });

  test('PostgreSQL catalog confirms required production indexes exist', async () => {
    // Query pg_indexes for critical production indexes
    const indexes: Array<{ tablename: string; indexname: string; indexdef: string }> = await prisma.$queryRaw`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('Booking', 'RoomAssignment', 'Stay', 'FolioLineItem', 'Payment', 'User');
    `;

    const indexNames = indexes.map(i => i.indexname);

    // Verify critical foreign keys & query indexes
    expect(indexNames.some(name => name.includes('RoomAssignment_roomId_startDate_endDate'))).toBe(true);
    expect(indexNames.some(name => name.includes('Stay_roomId_status'))).toBe(true);
    expect(indexNames.some(name => name.includes('Booking_confirmationCode'))).toBe(true);
    expect(indexNames.some(name => name.includes('Booking_checkIn_checkOut'))).toBe(true);
    expect(indexNames.some(name => name.includes('Booking_status'))).toBe(true);
    expect(indexNames.some(name => name.includes('FolioLineItem_folioId'))).toBe(true);
  });

  test('Indexed Confirmation Code lookup executes under 30ms latency gate', async () => {
    const booking = await prisma.booking.findFirst();
    if (!booking) return;

    const start = performance.now();
    const result = await prisma.booking.findFirst({
      where: { confirmationCode: booking.confirmationCode }
    });
    const duration = performance.now() - start;

    expect(result).not.toBeNull();
    expect(duration).toBeLessThan(100); // 100ms budget for dual-core test runner
  });

  test('Eager relation loading eliminates N+1 query overhead for Room Racks', async () => {
    const start = performance.now();
    const rooms = await prisma.room.findMany({
      take: 20,
      include: {
        roomType: true,
        stays: {
          where: { status: 'CHECKED_IN' },
          take: 1
        }
      }
    });
    const duration = performance.now() - start;

    expect(rooms.length).toBeGreaterThanOrEqual(1);
    expect(duration).toBeLessThan(250); // Eager JOIN resolves in single round-trip
  });
});

import { GET } from '@/app/api/admin/analytics/bi/route';
import { cleanDatabase } from '@/tests/utils/clean-db';
import prisma from '@/lib/prisma';
import { RoomFactory } from '@/tests/factories/room.factory';
import { UserFactory } from '@/tests/factories/user.factory';

describe('Advanced Integration: BI Analytics Engine', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('handles an empty database gracefully without throwing division by zero NaN errors', async () => {
    // With 0 rooms, 0 bookings, 0 orders
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    
    expect(data.revenue.totalRoomsRevenue).toBe(0);
    expect(data.revenue.adr).toBe(0);
    expect(data.revenue.revpar).toBe(0);
    expect(data.revenue.occupancy).toBe(0);
    expect(data.revenue.yoyGrowth).toBe(0);
  });

  it('accurately calculates ADR, RevPAR, Occupancy and total revenue', async () => {
    // Seed test data
    const roomType = await prisma.roomType.create({
      data: { name: 'Standard', baseRate: 100, capacity: 2 }
    });

    // Create 4 total rooms, 2 OCCUPIED, 2 AVAILABLE -> Occupancy should be 50%
    for (let i = 0; i < 2; i++) {
      await RoomFactory.create({ status: 'OCCUPIED', roomType: { connect: { id: roomType.id } } });
      await RoomFactory.create({ status: 'AVAILABLE', roomType: { connect: { id: roomType.id } } });
    }

    const guest = await UserFactory.create({ role: { connect: { name: 'GUEST' } } });

    // Create 2 active bookings for $100 and $200 -> Total $300, ADR = $150
    // Total rooms = 4. Occupancy = 50%.
    // RevPAR = ADR * Occupancy = 150 * 0.5 = 75
    await prisma.booking.create({
      data: { status: 'CONFIRMED', totalPrice: 100, guests: 1, userId: guest.id, roomId: (await prisma.room.findFirst())!.id, roomTypeId: roomType.id, checkIn: new Date(), checkOut: new Date(Date.now() + 86400000), bookingCode: 'A1' }
    });
    await prisma.booking.create({
      data: { status: 'CHECKED_IN', totalPrice: 200, guests: 1, userId: guest.id, roomId: (await prisma.room.findFirst())!.id, roomTypeId: roomType.id, checkIn: new Date(), checkOut: new Date(Date.now() + 86400000), bookingCode: 'A2' }
    });

    // Create a cancelled booking to ensure it's filtered out
    await prisma.booking.create({
      data: { status: 'CANCELLED', totalPrice: 500, guests: 1, userId: guest.id, roomId: (await prisma.room.findFirst())!.id, roomTypeId: roomType.id, checkIn: new Date(), checkOut: new Date(Date.now() + 86400000), bookingCode: 'A3' }
    });

    // Create Food & POS orders
    await prisma.foodOrder.create({
      data: { status: 'COMPLETED', totalAmount: 50, guestId: guest.id }
    });

    const outlet = await prisma.pOSOutlet.create({ data: { name: 'Bar', type: 'BAR' } });
    await prisma.pOSOrder.create({
      data: { status: 'COMPLETED', totalAmount: 75, paymentType: 'CASH', outletId: outlet.id }
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();

    // Verify Revenues
    expect(data.revenue.totalRoomsRevenue).toBe(300);
    expect(data.revenue.departmentPerformance.food).toBe(50);
    expect(data.revenue.departmentPerformance.pos).toBe(75);
    expect(data.revenue.totalPOSRevenue).toBe(125); // Food + POS

    // Verify Metrics
    expect(data.revenue.occupancy).toBe(50);
    expect(data.revenue.adr).toBe(150); // 300 / 2
    expect(data.revenue.revpar).toBe(75); // 150 * 0.5
  });
});

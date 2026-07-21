import { POST } from '@/app/api/admin/pos/orders/route';
import { cleanDatabase } from '@/tests/utils/clean-db';
import prisma from '@/lib/prisma';
import { createNextRequest } from '../../utils/api-handler';
import { RoomFactory } from '@/tests/factories/room.factory';
import { UserFactory } from '@/tests/factories/user.factory';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { roleName: 'MANAGER' } }),
}));

describe('Advanced Integration: POS Orders API', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates a standard POS Order with items', async () => {
    const outlet = await prisma.pOSOutlet.create({ data: { name: 'Gift Shop', type: 'SHOP' } });
    const product = await prisma.pOSProduct.create({ data: { outletId: outlet.id, name: 'Mug', price: 10, category: 'RETAIL' } });

    const payload = {
      outletId: outlet.id,
      paymentType: 'CASH',
      items: [
        { productId: product.id, quantity: 2, price: 10 }
      ]
    };

    const req = createNextRequest('/api/admin/pos/orders', 'POST', payload);
    const res = await POST(req);
    
    expect(res.status).toBe(200);
    const data = await res.json();
    
    expect(data.success).toBe(true);
    expect(Number(data.order.totalAmount)).toBe(20);
    expect(data.order.items.length).toBe(1);
    expect(Number(data.order.items[0].subtotal)).toBe(20);
  });

  it('creates a POS Order and charges it to a Room Folio (Folio)', async () => {
    const roomType = await prisma.roomType.create({ data: { name: 'Standard', baseRate: 100, capacity: 2, description: 'Standard room' } });
    const room = await RoomFactory.create({ number: '404', status: 'OCCUPIED', roomType: { connect: { id: roomType.id } } });
    const guest = await UserFactory.create({ role: { connect: { name: 'GUEST' } } });

    // Create a CHECKED_IN booking with a MASTER folio
    const booking = await prisma.booking.create({
      data: {
        userId: guest.id,
        roomId: room.id,
        roomTypeId: roomType.id,
        bookingCode: 'BK1',
        status: 'CHECKED_IN',
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        totalPrice: 100,
        guests: 1,
        folios: {
          create: [{ folioType: 'MASTER', subtotal: 100, grandTotal: 100 }]
        }
      },
      include: { folios: true }
    });

    const folioId = booking.folios[0].id;

    const outlet = await prisma.pOSOutlet.create({ data: { name: 'Mini Bar', type: 'BAR' } });
    const product = await prisma.pOSProduct.create({ data: { outletId: outlet.id, name: 'Soda', price: 5, category: 'BEVERAGE' } });

    const payload = {
      outletId: outlet.id,
      paymentType: 'ROOM_CHARGE',
      roomNumber: '404',
      items: [
        { productId: product.id, quantity: 3, price: 5 }
      ]
    };

    const req = createNextRequest('/api/admin/pos/orders', 'POST', payload);
    const res = await POST(req);
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify Folio was updated
    const updatedFolio = await prisma.folio.findUnique({ where: { id: folioId }, include: { lines: true } });
    expect(Number(updatedFolio?.subtotal)).toBe(115); // 100 + 15
    expect(updatedFolio?.lines.length).toBe(1);
    expect(updatedFolio?.lines[0].category).toBe('POS');
    expect(Number(updatedFolio?.lines[0].totalPrice)).toBe(15);
  });
});

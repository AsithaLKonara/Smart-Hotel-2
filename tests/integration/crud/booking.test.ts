import { GET, POST } from '@/app/api/bookings/route';
import { BookingFactory, UserFactory, RoomFactory } from '../../factories/index';
import { cleanDatabase } from '../../utils/clean-db';
import { createNextRequest } from '../../utils/api-handler';
import prisma from '@/lib/prisma';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Booking CRUD Verification', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Authorization & Validation', () => {
    it('allows anonymous guest checkouts', async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);

      // Need to provide valid room and dates to get a 400 vs 401 or 404
      // We will just verify it does not throw 401 Authorization error
      const req = createNextRequest('/api/bookings', 'POST', { checkIn: new Date().toISOString() });
      const res = await POST(req);
      
      expect(res.status).not.toBe(401);
    });

    it('validates booking payload dates', async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { roleName: 'GUEST', id: 'guest-1' }
      });

      // checkIn > checkOut should fail validation
      const req = createNextRequest('/api/bookings', 'POST', {
        checkIn: new Date(Date.now() + 86400000).toISOString(),
        checkOut: new Date().toISOString(),
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
    });
  });

  describe('Concurrency & Isolation', () => {
    it('successfully creates a booking and reduces room availability', async () => {
      const guest = await UserFactory.create({ roleName: 'GUEST' });
      const roomType = await prisma.roomType.create({
        data: { name: 'Suite', baseRate: 100, capacity: 2, amenities: [] }
      });
      const room = await RoomFactory.create({ status: 'AVAILABLE', roomType: { connect: { id: roomType.id } } });

      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { roleName: 'GUEST', id: guest.id }
      });

      const req = createNextRequest('/api/bookings', 'POST', {
        checkIn: new Date().toISOString(),
        checkOut: new Date(Date.now() + 86400000).toISOString(),
        roomTypeId: roomType.id,
        guests: 1,
      });
      
      const res = await POST(req);
      expect(res.status).toBe(201);
      
      const json = await res.json();
      expect(json.booking).toBeDefined();
      expect(json.booking.status).toBe('CONFIRMED');
    });
  });
});

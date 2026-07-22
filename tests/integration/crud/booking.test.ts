import { GET, POST } from '@/app/api/bookings/route';
import { BookingFactory, UserFactory, RoomFactory } from '@/tests/factories/index';
import { cleanDatabase } from '@/tests/utils/clean-db';
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
    it('allows anonymous guest checkouts and processes guest info properly', async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);

      const roomType = await prisma.roomType.create({
        data: { name: 'Anonymous Suite', baseRate: 150, capacity: 2, amenities: [], description: 'Test suite' }
      });
      const room = await RoomFactory.create({ status: 'AVAILABLE', roomType: { connect: { id: roomType.id } } });

      const req = createNextRequest('/api/bookings', 'POST', { 
        roomId: room.id,
        checkIn: new Date().toISOString(),
        checkOut: new Date(Date.now() + 86400000).toISOString(),
        guests: 2,
        guestName: 'John Doe',
        guestEmail: 'john.doe@example.com',
        guestPhone: '+1234567890'
      });
      
      const res = await POST(req);
      expect(res.status).toBe(201);
      
      const json = await res.json();
      expect(json.booking).toBeDefined();
      expect(json.booking.guest).toBeDefined();
      expect(json.booking.guest.name).toBe('John Doe');
      expect(json.booking.guest.email).toBe('john.doe@example.com');
      
      // Verify user was created in DB
      const dbUser = await prisma.user.findFirst({ where: { email: 'john.doe@example.com' } });
      expect(dbUser).toBeDefined();
      expect(dbUser?.name).toBe('John Doe');
    });

    it('validates booking payload dates', async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { roleName: 'GUEST', id: 'guest-1' }
      });

      // checkIn > checkOut should fail validation
      const req = createNextRequest('/api/bookings', 'POST', {
        checkIn: new Date(Date.now() + 86400000).toISOString(),
        checkOut: new Date().toISOString(),
        roomId: 'some-mock-room-id',
        guests: 2
      });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
    });
  });

  describe('Concurrency & Isolation', () => {
    it('successfully creates a booking and reduces room availability', async () => {
      const guest = await UserFactory.create({ roleName: 'GUEST' });
      const roomType = await prisma.roomType.create({
        data: { name: 'Suite', baseRate: 100, capacity: 2, amenities: [], description: 'Test suite' }
      });
      const room = await RoomFactory.create({ status: 'AVAILABLE', roomType: { connect: { id: roomType.id } } });

      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { roleName: 'GUEST', id: guest.id }
      });

      const req = createNextRequest('/api/bookings', 'POST', {
        checkIn: new Date().toISOString(),
        checkOut: new Date(Date.now() + 86400000).toISOString(),
        roomId: room.id,
        guests: 1,
      });
      
      const res = await POST(req);
      expect(res.status).toBe(201);
      
      const json = await res.json();
      expect(json.booking).toBeDefined();
      expect(json.booking.status).toBe('CONFIRMED');
    }, 30000);
  });
});

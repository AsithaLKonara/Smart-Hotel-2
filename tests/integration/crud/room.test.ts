import { GET, POST } from '@/app/api/rooms/route';
import { GET as GET_ID, PUT, DELETE } from '@/app/api/rooms/[id]/route';
import { RoomFactory } from '@/tests/factories/room.factory';
import { cleanDatabase } from '@/tests/utils/clean-db';
import { createNextRequest } from '../../utils/api-handler';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Room CRUD Verification', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Authorization', () => {
    it('prevents GUEST from creating a room', async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { roleName: 'GUEST', id: 'mock-user-id' }
      });

      const req = createNextRequest('/api/rooms', 'POST', { number: '101' });
      const res = await POST(req);
      
      expect(res.status).toBe(401);
    });

    it('allows MANAGER to create a room', async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { roleName: 'MANAGER', id: 'mock-admin-id' }
      });

      // Needs a valid roomTypeId in a real scenario
      const roomType = await prisma.roomType.create({
        data: { name: 'Suite', baseRate: 100, capacity: 2, amenities: [], description: 'Suite desc' }
      });

      const req = createNextRequest('/api/rooms', 'POST', { 
        number: '101', 
        floor: 1, 
        roomTypeId: roomType.id 
      });
      const res = await POST(req);
      
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.room.number).toBe('101');
    });
  });

  describe('Validation & Negative Paths', () => {
    it('returns 400 when creating a room without required fields', async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { roleName: 'MANAGER', id: 'mock-admin-id' }
      });

      // Missing roomTypeId and floor
      const req = createNextRequest('/api/rooms', 'POST', { number: '102' });
      const res = await POST(req);
      
      expect(res.status).toBe(400);
    });
  });

  describe('Update & Concurrency', () => {
    it('updates room status successfully', async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { roleName: 'MANAGER', id: 'mock-admin-id' }
      });

      const room = await RoomFactory.create({ status: 'AVAILABLE' });

      const req = createNextRequest(`/api/rooms/${room.id}`, 'PUT', {
        status: 'MAINTENANCE'
      });
      const res = await PUT(req, { params: Promise.resolve({ id: room.id }) } as any);
      
      expect(res.status).toBe(200);
      
      const updated = await prisma.room.findUnique({ where: { id: room.id } });
      expect(updated?.status).toBe('MAINTENANCE');
    });
  });

  describe('Persistence & Delete', () => {
    it('returns 400 when attempting to delete a room with active bookings', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { roleName: 'MANAGER', id: 'mock-admin-id' }
      });

      const room = await RoomFactory.create({ number: '888' });
      
      // Create an active booking connected to this room
      const booking = await prisma.booking.create({
        data: {
          primaryGuestId: 'mock-guest-id',
          checkIn: new Date(),
          checkOut: new Date(Date.now() + 86400000),
          status: 'CONFIRMED',
          guests: 1,
          totalAmount: 100,
          confirmationCode: 'TEST-123',
          propertyId: room.propertyId,
          roomAssignments: {
            create: {
              roomId: room.id,
              startDate: new Date(),
              endDate: new Date(Date.now() + 86400000),
              status: 'ACTIVE'
            }
          }
        }
      });

      const req = createNextRequest(`/api/rooms/${room.id}`, 'DELETE');
      const res = await DELETE(req, { params: Promise.resolve({ id: room.id }) } as any);
      
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/active bookings/i);
    });

    it('soft deletes a room instead of hard delete', async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { roleName: 'MANAGER', id: 'mock-admin-id' }
      });

      const room = await RoomFactory.create({ number: '999' });

      const req = createNextRequest(`/api/rooms/${room.id}`, 'DELETE');
      const res = await DELETE(req, { params: Promise.resolve({ id: room.id }) } as any);
      
      expect(res.status).toBe(200);
      
      // Verify persistence state (soft delete means it's still in DB but deletedAt is set)
      const deletedRoom = await prisma.room.findUnique({ where: { id: room.id } });
      expect(deletedRoom).not.toBeNull();
      expect(deletedRoom?.deletedAt).not.toBeNull();
    });
  });

  describe('Visibility & Authentication (API-008)', () => {
    it('strips operational fields from GET /api/rooms/[id] for unauthenticated users', async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);

      const room = await RoomFactory.create({ status: 'DIRTY' });

      const req = createNextRequest(`/api/rooms/${room.id}`, 'GET');
      const res = await GET_ID(req, { params: Promise.resolve({ id: room.id }) } as any);
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.number).toBe(room.number);
      expect(json.status).toBeUndefined(); // Operational field stripped
      expect(json.lastCleanedAt).toBeUndefined();
    });

    it('returns full operational fields from GET /api/rooms/[id] for STAFF', async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { roleName: 'MANAGER', id: 'mock-admin-id' }
      });

      const room = await RoomFactory.create({ status: 'MAINTENANCE' });

      const req = createNextRequest(`/api/rooms/${room.id}`, 'GET');
      const res = await GET_ID(req, { params: Promise.resolve({ id: room.id }) } as any);
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.number).toBe(room.number);
      expect(json.status).toBe('MAINTENANCE'); // Field retained
    });

    it('strips operational fields from GET /api/rooms for unauthenticated users', async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);

      await RoomFactory.create({ status: 'AVAILABLE' });
      await RoomFactory.create({ status: 'OCCUPIED' });

      // In real code, GET for /api/rooms is exported from app/api/rooms/route.ts.
      const req = createNextRequest('/api/rooms', 'GET');
      const res = await GET(req); // Note: The route.ts GET takes NextRequest only
      
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.rooms.length).toBeGreaterThanOrEqual(2);
      expect(json.rooms[0].status).toBeUndefined();
      expect(json.rooms[1].status).toBeUndefined();
    });
  });
});

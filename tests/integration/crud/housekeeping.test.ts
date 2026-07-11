import { GET, PUT } from '@/app/api/admin/housekeeping/rooms/route';
import { UserFactory } from '@/tests/factories/user.factory';
import { PropertyFactory, RoomFactory } from '@/tests/factories/room.factory';
import { cleanDatabase } from '@/tests/utils/clean-db';
import { createNextRequest } from '../../utils/api-handler';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

// Mock server-rbac to simulate getEffectivePropertyId behavior based on user's propertyId
jest.mock('@/lib/server-rbac', () => ({
  getEffectivePropertyId: jest.fn().mockImplementation(async (req) => {
    const session = await getServerSession();
    return session?.user?.propertyId || null;
  })
}));

describe('Admin Housekeeping Rooms API & Cross-Tenant Security', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  describe('PUT /api/admin/housekeeping/rooms', () => {
    it('returns 403 if modifying a room from a different property (IDOR Protection)', async () => {
      // Create two distinct properties
      const propertyA = await PropertyFactory.create();
      const propertyB = await PropertyFactory.create();

      // Create a manager scoped strictly to Property A
      const managerA = await UserFactory.create({ 
        roleName: 'MANAGER',
        property: { connect: { id: propertyA.id } }
      });

      // Create a room in Property B
      const roomB = await RoomFactory.create({ 
        property: { connect: { id: propertyB.id } },
        status: 'DIRTY'
      });

      // Mock the session as Manager A
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: managerA.id, 
          roleName: 'MANAGER',
          propertyId: propertyA.id 
        }
      });

      // Manager A maliciously attempts to update Room B's status
      const body = {
        roomId: roomB.id,
        newStatus: 'CLEANING'
      };

      const req = createNextRequest('/api/admin/housekeeping/rooms', 'PUT', body);
      const res = await PUT(req);
      const data = await res.json();
      
      // Should hit the cross-property IDOR guard
      expect(res.status).toBe(403);
      expect(data.error).toBe('Forbidden');

      // Verify the DB state wasn't mutated
      const freshRoomB = await prisma.room.findUnique({ where: { id: roomB.id } });
      expect(freshRoomB?.status).toBe('DIRTY');
    });

    it('successfully updates room status if it belongs to the manager\'s property', async () => {
      const propertyA = await PropertyFactory.create();
      
      const managerA = await UserFactory.create({ 
        roleName: 'MANAGER',
        property: { connect: { id: propertyA.id } }
      });

      const roomA = await RoomFactory.create({ 
        property: { connect: { id: propertyA.id } },
        status: 'DIRTY'
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: managerA.id, 
          roleName: 'MANAGER',
          propertyId: propertyA.id 
        }
      });

      const body = {
        roomId: roomA.id,
        newStatus: 'CLEANING'
      };

      const req = createNextRequest('/api/admin/housekeeping/rooms', 'PUT', body);
      const res = await PUT(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.room.status).toBe('CLEANING');

      // Verify DB was mutated
      const freshRoomA = await prisma.room.findUnique({ where: { id: roomA.id } });
      expect(freshRoomA?.status).toBe('CLEANING');
    });

    it('returns 400 standard validation error for invalid status string', async () => {
      const propertyA = await PropertyFactory.create();
      
      const managerA = await UserFactory.create({ 
        roleName: 'MANAGER',
        property: { connect: { id: propertyA.id } }
      });

      const roomA = await RoomFactory.create({ 
        property: { connect: { id: propertyA.id } },
        status: 'DIRTY'
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { 
          id: managerA.id, 
          roleName: 'MANAGER',
          propertyId: propertyA.id 
        }
      });

      // Provide invalid status
      const body = {
        roomId: roomA.id,
        newStatus: 'INVALID_STATE'
      };

      const req = createNextRequest('/api/admin/housekeeping/rooms', 'PUT', body);
      const res = await PUT(req);
      const data = await res.json();
      
      expect(res.status).toBe(400);
      expect(data.error.name).toBe('ZodError'); 
      expect(data.error.issues).toBeDefined();
    });
  });
});

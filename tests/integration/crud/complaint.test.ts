import { GET, POST, PATCH } from '@/app/api/complaints/route';
import { UserFactory } from '@/tests/factories/user.factory';
import { cleanDatabase } from '@/tests/utils/clean-db';
import { createNextRequest } from '../../utils/api-handler';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

describe('Complaints API & IDOR Security', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  describe('GET /api/complaints', () => {
    it('returns 401 for unauthenticated users', async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);
      const req = createNextRequest('/api/complaints', 'GET');
      const res = await GET(req);
      
      expect(res.status).toBe(401);
    });

    it('IDOR protection: returns only own complaints for non-admins even if userId param is provided', async () => {
      // Create two guests
      const guestA = await UserFactory.create({ roleName: 'GUEST' });
      const guestB = await UserFactory.create({ roleName: 'GUEST' });

      // Create complaints for both
      await prisma.complaint.create({
        data: { subject: 'A issue', description: 'desc A', category: 'ROOM', userId: guestA.id }
      });
      await prisma.complaint.create({
        data: { subject: 'B issue', description: 'desc B', category: 'ROOM', userId: guestB.id }
      });

      // Login as Guest A
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: guestA.id, roleName: 'GUEST' }
      });

      // Guest A tries to read Guest B's complaints
      const req = createNextRequest(`/api/complaints?userId=${guestB.id}`, 'GET');
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.length).toBe(1);
      expect(data[0].subject).toBe('A issue'); // Did not get B's complaint!
    });

    it('allows admin to query complaints of any user', async () => {
      const guestB = await UserFactory.create({ roleName: 'GUEST' });
      await prisma.complaint.create({
        data: { subject: 'B issue', description: 'desc B', category: 'ROOM', userId: guestB.id }
      });

      // Login as Admin
      const admin = await UserFactory.create({ roleName: 'MANAGER' });
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: admin.id, roleName: 'MANAGER' }
      });

      // Admin tries to read Guest B's complaints
      const req = createNextRequest(`/api/complaints?userId=${guestB.id}`, 'GET');
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.length).toBe(1);
      expect(data[0].subject).toBe('B issue');
    });
  });

  describe('POST /api/complaints', () => {
    it('creates a complaint successfully for authenticated user', async () => {
      const guest = await UserFactory.create({ roleName: 'GUEST' });
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: guest.id, roleName: 'GUEST' }
      });

      const body = {
        subject: 'Noisy neighbors',
        description: 'The room next door is very noisy at night.',
        category: 'NOISE',
        priority: 'MEDIUM'
      };

      const req = createNextRequest('/api/complaints', 'POST', body);
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(201);
      expect(data.subject).toBe('Noisy neighbors');
      expect(data.userId).toBe(guest.id);
    });

    it('returns 400 standard validation error for invalid body', async () => {
      const guest = await UserFactory.create({ roleName: 'GUEST' });
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: guest.id, roleName: 'GUEST' }
      });

      const body = {
        subject: 'No' // too short
      };

      const req = createNextRequest('/api/complaints', 'POST', body);
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(400);
      expect(data.error.name).toBe('ZodError'); // Uses standard handleZodError
    });

    describe('Booking Attachments (API-011)', () => {
      it('returns 403 if linking complaint to an unowned booking (IDOR Protection)', async () => {
        const guestA = await UserFactory.create({ roleName: 'GUEST' });
        const guestB = await UserFactory.create({ roleName: 'GUEST' });
        
        // Insert booking directly via prisma
        const bookingB = await prisma.booking.create({
          data: {
            confirmationCode: 'BOOK-B-123',
            checkIn: new Date(),
            checkOut: new Date(),
            primaryGuestId: guestB.id,
            status: 'CONFIRMED',
            source: 'WEBSITE',
            totalAmount: 100,
            paymentStatus: 'unpaid'
          }
        });

        (getServerSession as jest.Mock).mockResolvedValue({
          user: { id: guestA.id, roleName: 'GUEST' }
        });

        const body = {
          subject: 'Issue',
          description: 'Valid long desc',
          category: 'ROOM',
          bookingId: bookingB.id
        };

        const req = createNextRequest('/api/complaints', 'POST', body);
        const res = await POST(req);
        const data = await res.json();
        
        expect(res.status).toBe(403);
        expect(data.error).toBe('Forbidden: Cannot link complaint to this booking');
      });

      it('successfully links complaint if booking is owned by the user', async () => {
        const guestA = await UserFactory.create({ roleName: 'GUEST' });
        
        const bookingA = await prisma.booking.create({
          data: {
            confirmationCode: 'BOOK-A-123',
            checkIn: new Date(),
            checkOut: new Date(),
            primaryGuestId: guestA.id,
            status: 'CONFIRMED',
            source: 'WEBSITE',
            totalAmount: 100,
            paymentStatus: 'unpaid'
          }
        });

        (getServerSession as jest.Mock).mockResolvedValue({
          user: { id: guestA.id, roleName: 'GUEST' }
        });

        const body = {
          subject: 'Issue',
          description: 'Valid long desc',
          category: 'ROOM',
          bookingId: bookingA.id
        };

        const req = createNextRequest('/api/complaints', 'POST', body);
        const res = await POST(req);
        const data = await res.json();
        
        expect(res.status).toBe(201);
        expect(data.bookingId).toBe(bookingA.id);
      });
    });
  });

  describe('PATCH /api/complaints', () => {
    it('updates complaint status successfully for admin', async () => {
      const guest = await UserFactory.create({ roleName: 'GUEST' });
      const complaint = await prisma.complaint.create({
        data: { subject: 'Issue', description: 'Desc', category: 'CLEANING', userId: guest.id }
      });

      const admin = await UserFactory.create({ roleName: 'MANAGER' });
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: admin.id, roleName: 'MANAGER' }
      });

      const body = {
        id: complaint.id,
        status: 'RESOLVED'
      };

      const req = createNextRequest('/api/complaints', 'PATCH', body);
      const res = await PATCH(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.status).toBe('RESOLVED');
      expect(data.resolvedAt).not.toBeNull();
    });

    it('returns 401 for non-admin trying to update complaint status', async () => {
      const guest = await UserFactory.create({ roleName: 'GUEST' });
      const complaint = await prisma.complaint.create({
        data: { subject: 'Issue', description: 'Desc', category: 'CLEANING', userId: guest.id }
      });

      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: guest.id, roleName: 'GUEST' }
      });

      const body = {
        id: complaint.id,
        status: 'RESOLVED'
      };

      const req = createNextRequest('/api/complaints', 'PATCH', body);
      const res = await PATCH(req);
      
      expect(res.status).toBe(401);
    });
  });
});

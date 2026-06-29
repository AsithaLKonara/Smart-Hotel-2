import { POST } from '@/app/api/admin/users/route';
import { DELETE, PUT } from '@/app/api/admin/users/[id]/route';
import { UserFactory } from '@/tests/factories/user.factory';
import { cleanDatabase } from '@/tests/utils/clean-db';
import { createNextRequest } from '../../utils/api-handler';
import prisma from '@/lib/prisma';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { getServerSession } from 'next-auth';

describe('User CRUD & RBAC Verification', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('RBAC & Authorization', () => {
    it('prevents non-admins from managing users', async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { roleName: 'FRONT_DESK', id: 'staff-1' }
      });

      const req = createNextRequest('/api/admin/users', 'POST', { 
        email: 'test@smarthotel.com',
        firstName: 'Test',
        lastName: 'User',
        roleId: 'some-role'
      });
      
      const res = await POST(req);
      expect(res.status).toBe(403);
    });
  });

  describe('Soft Deletes', () => {
    it('soft deletes a user successfully', async () => {
      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { roleName: 'ADMIN', id: 'admin-1' }
      });

      const user = await UserFactory.create({ email: 'delete-me@test.com' });

      const req = createNextRequest(`/api/admin/users/${user.id}`, 'DELETE');
      const res = await DELETE(req, { params: Promise.resolve({ id: user.id }) } as any);
      
      expect(res.status).toBe(200);

      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(dbUser).toBeDefined();
      expect(dbUser?.deletedAt).not.toBeNull();
    });
  });
});

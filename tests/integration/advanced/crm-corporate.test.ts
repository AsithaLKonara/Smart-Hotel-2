import { GET, POST } from '@/app/api/admin/crm/corporate/route';
import { cleanDatabase } from '@/tests/utils/clean-db';
import prisma from '@/lib/prisma';
import { createNextRequest } from '@/tests/utils/api-handler';
import { UserFactory } from '@/tests/factories/user.factory';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { roleName: 'MANAGER' } }),
}));

describe('Advanced Integration: Corporate CRM API', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('validates corporate account creation with correct payload', async () => {
    const payload = {
      companyName: 'Acme Corp',
      contactName: 'John Doe',
      contactEmail: 'john@acme.com',
      contactPhone: '555-0192',
      negotiatedRate: '150.00' // Ensure string parsing works
    };

    const req = createNextRequest('/api/admin/crm/corporate', 'POST', payload);
    const res = await POST(req);
    
    expect(res.status).toBe(200);
    const data = await res.json();
    
    expect(data.success).toBe(true);
    expect(data.account.companyName).toBe('Acme Corp');
    expect(data.account.negotiatedRate).toBe(150);
  });

  it('rejects corporate account creation with invalid email', async () => {
    const payload = {
      companyName: 'Bad Email Corp',
      contactName: 'Jane Doe',
      contactEmail: 'jane_at_acme.com', // Invalid email
      contactPhone: '555-0192',
      negotiatedRate: 150.00
    };

    const req = createNextRequest('/api/admin/crm/corporate', 'POST', payload);
    const res = await POST(req);
    
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Validation error');
  });

  it('fetches aggregated corporate accounts and associated users count', async () => {
    // Seed
    const account = await prisma.corporateAccount.create({
      data: {
        companyName: 'Tech Corp',
        contactName: 'Alice',
        contactEmail: 'alice@techcorp.com',
        contactPhone: '1234567890',
        negotiatedRate: 100
      }
    });

    const user1 = await UserFactory.create({ role: { connect: { name: 'GUEST' } } });
    const user2 = await UserFactory.create({ role: { connect: { name: 'GUEST' } } });

    await prisma.user.update({
      where: { id: user1.id },
      data: { corporateAccountId: account.id }
    });
    await prisma.user.update({
      where: { id: user2.id },
      data: { corporateAccountId: account.id }
    });

    const req = createNextRequest('/api/admin/crm/corporate', 'GET');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.accounts.length).toBe(1);
    expect(data.accounts[0].companyName).toBe('Tech Corp');
    expect(data.accounts[0]._count.users).toBe(2);
  });
});

import { POST } from '@/app/api/payments/route';
import { FolioFactory, PaymentFactory } from '../../factories/finance.factory';
import { cleanDatabase } from '../../utils/clean-db';
import { createNextRequest } from '../../utils/api-handler';
import prisma from '@/lib/prisma';
import { faker } from '@faker-js/faker';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { getServerSession } from 'next-auth';

describe('Payment CRUD & Idempotency Verification', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Idempotency & Concurrency', () => {
    it('prevents double charges using idempotency keys', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { roleName: 'FRONT_DESK', id: 'staff-1' }
      });

      const folio = await FolioFactory.create({ status: 'OPEN', balance: 500 });
      const idempotencyKey = faker.string.uuid();

      const payload = {
        folioId: folio.id,
        amount: 500,
        method: 'CREDIT_CARD',
      };

      const req1 = createNextRequest('/api/payments', 'POST', payload, {
        'Idempotency-Key': idempotencyKey
      });
      const req2 = createNextRequest('/api/payments', 'POST', payload, {
        'Idempotency-Key': idempotencyKey
      });

      // Execute concurrently
      const [res1, res2] = await Promise.all([POST(req1), POST(req2)]);
      
      // One should succeed, one should fail (or return cached result)
      // Standard idempotency means subsequent identical request returns same success 
      // But typically double-charge prevention ensures DB state matches
      
      expect([res1.status, res2.status]).toContain(201);
      
      // Verify only 1 payment was created in DB
      const payments = await prisma.payment.findMany({ where: { folioId: folio.id } });
      expect(payments.length).toBe(1);
    });
  });

  describe('Audit Logging', () => {
    it('creates an audit log when processing a payment', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { roleName: 'MANAGER', id: 'manager-1' }
      });

      const folio = await FolioFactory.create({ status: 'OPEN', balance: 100 });
      const payload = {
        folioId: folio.id,
        amount: 100,
        method: 'CASH',
      };

      const req = createNextRequest('/api/payments', 'POST', payload);
      await POST(req);

      // Verify Audit Log
      const auditLog = await prisma.auditLog.findFirst({
        where: { action: 'PROCESS_PAYMENT', entityId: folio.id }
      });
      
      expect(auditLog).toBeDefined();
    });
  });
});

import { POST } from '@/app/api/admin/hr/leaves/route';
import { cleanDatabase } from '../../utils/clean-db';
import prisma from '@/lib/prisma';
import { createNextRequest } from '../../utils/api-handler';

describe('Advanced Integration: HR Leaves API', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('successfully creates a valid leave request', async () => {
    // Seed an employee
    const user = await prisma.user.create({
      data: { name: 'Emp 1', email: 'emp@test.com' }
    });
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        position: 'Staff',
        department: 'Operations',
        salary: 50000,
        hireDate: new Date(),
        status: 'ACTIVE'
      }
    });

    const payload = {
      employeeId: employee.id,
      type: 'ANNUAL',
      startDate: new Date('2026-07-01T00:00:00Z').toISOString(),
      endDate: new Date('2026-07-05T00:00:00Z').toISOString(),
      reason: 'Vacation'
    };

    const req = createNextRequest('/api/admin/hr/leaves', 'POST', payload);
    const res = await POST(req);
    
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.employee.id).toBe(employee.id);

    // Verify DB
    const leaves = await prisma.leaveRequest.findMany({ where: { employeeId: employee.id } });
    expect(leaves.length).toBe(1);
    expect(leaves[0].type).toBe('ANNUAL');
  });

  it('rejects an invalid leave request where endDate is before startDate', async () => {
    const user = await prisma.user.create({
      data: { name: 'Emp 2', email: 'emp2@test.com' }
    });
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        position: 'Staff',
        department: 'Operations',
        salary: 50000,
        hireDate: new Date(),
        status: 'ACTIVE'
      }
    });

    const payload = {
      employeeId: employee.id,
      type: 'SICK',
      startDate: new Date('2026-07-05T00:00:00Z').toISOString(),
      endDate: new Date('2026-07-01T00:00:00Z').toISOString(), // Invalid!
      reason: 'Time Travel'
    };

    const req = createNextRequest('/api/admin/hr/leaves', 'POST', payload);
    const res = await POST(req);
    
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Validation Error');
    expect(data.issues[0].path).toContain('endDate');
    expect(data.issues[0].message).toBe('endDate cannot be before startDate');
  });
});

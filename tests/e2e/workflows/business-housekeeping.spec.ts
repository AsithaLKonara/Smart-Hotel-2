import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/db';
import { loginAs } from '../utils/auth-helpers';
import { enforceThermalGuard } from '../utils/thermal-guard';

test.describe.serial('Domain 4: Housekeeping & Maintenance (CMMS) Full Turnaround Workflow', () => {
  let testRoomId: string;
  let testRoomNumber: string;

  test.beforeEach(async () => {
    await enforceThermalGuard(82, 72);
  });

  test.beforeAll(async () => {
    // Pick an operational room from Grand Ocean Resort
    const room = await prisma.room.findFirst({
      where: {
        propertyId: '579ecf1a-5350-42ea-af32-c10397417589'
      }
    });
    if (!room) throw new Error('No room found in Grand Ocean Resort for housekeeping workflow');
    testRoomId = room.id;
    testRoomNumber = room.number;
  });

  test('Room transitions through complete turnaround: DIRTY -> CLEANING -> AVAILABLE', async ({ page }) => {
    await loginAs(page, 'HOUSEKEEPING');

    // 1. Force room to DIRTY
    const dirtyRes = await page.request.patch(`/api/rooms/${testRoomId}`, {
      data: { status: 'DIRTY' }
    });
    expect([200, 204]).toContain(dirtyRes.status());

    let room = await prisma.room.findUnique({ where: { id: testRoomId } });
    expect(room?.status).toBe('DIRTY');

    // 2. Housekeeper marks room in CLEANING
    const cleaningRes = await page.request.patch(`/api/rooms/${testRoomId}`, {
      data: { status: 'CLEANING' }
    });
    expect([200, 204]).toContain(cleaningRes.status());

    room = await prisma.room.findUnique({ where: { id: testRoomId } });
    expect(room?.status).toBe('CLEANING');

    // 3. Inspection complete -> mark AVAILABLE
    const availableRes = await page.request.patch(`/api/rooms/${testRoomId}`, {
      data: { status: 'AVAILABLE' }
    });
    expect([200, 204]).toContain(availableRes.status());

    room = await prisma.room.findUnique({ where: { id: testRoomId } });
    expect(room?.status).toBe('AVAILABLE');
  });

  test('Maintenance CMMS creates Work Order ticket and updates room status', async ({ page }) => {
    await loginAs(page, 'HOUSEKEEPING');

    // 1. Create Maintenance Work Order Task
    const taskRes = await page.request.post('/api/tasks', {
      timeout: 45000,
      data: {
        title: `AC Leak in Room ${testRoomNumber}`,
        description: 'Air conditioner dripping water onto carpet',
        type: 'MAINTENANCE',
        priority: 'HIGH',
        roomId: testRoomId,
        propertyId: '579ecf1a-5350-42ea-af32-c10397417589'
      }
    });

    expect([200, 201]).toContain(taskRes.status());
    const body = await taskRes.json();
    const taskId = body.task?.id || body.id;
    expect(taskId).toBeDefined();

    // 2. Verify ticket in database
    const taskInDb = await prisma.task.findUnique({ where: { id: taskId } });
    expect(taskInDb).toBeDefined();
    expect(taskInDb?.type).toBe('MAINTENANCE');
    expect(taskInDb?.priority).toBe('HIGH');

    // 3. Maintenance technician completes ticket
    const updateRes = await page.request.patch(`/api/tasks/${taskId}`, {
      timeout: 45000,
      data: {
        title: `AC Leak in Room ${testRoomNumber}`,
        status: 'COMPLETED'
      }
    });
    const status = updateRes.status();
    const text = await updateRes.text();
    if (![200, 204].includes(status)) {
      console.log('Task update failed with status:', status, 'body:', text);
    }
    expect([200, 204]).toContain(status);

    const completedTask = await prisma.task.findUnique({ where: { id: taskId } });
    expect(completedTask?.status).toBe('COMPLETED');
  });
});

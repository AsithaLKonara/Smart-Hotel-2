import { NextRequest } from 'next/server'
import { GET as getTasks, POST as createTask } from '@/app/api/tasks/route'
import { PATCH as updateTask, DELETE as deleteTask } from '@/app/api/tasks/[id]/route'

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

jest.mock('@/lib/db', () => {
  const mockPrismaClient = {
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    staff: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
    },
  }
  return {
    __esModule: true,
    default: mockPrismaClient,
    prisma: mockPrismaClient,
  }
})

const mockGetServerSessionFn = jest.fn((options) => Promise.resolve(null))

jest.mock('next-auth', () => ({
  getServerSession: (options: any) => mockGetServerSessionFn(options),
}))

jest.mock('@/lib/audit', () => ({
  logAction: jest.fn().mockResolvedValue(undefined),
  AUDIT_ACTIONS: {
    TASK_CREATE: 'TASK_CREATE',
    TASK_UPDATE: 'TASK_UPDATE',
    TASK_DELETE: 'TASK_DELETE',
  },
}))

import prisma from '@/lib/db'
import { getServerSession } from 'next-auth'

const mockPrisma = prisma as any
const mockGetServerSession = mockGetServerSessionFn as jest.MockedFunction<typeof mockGetServerSessionFn>
const mockPrismaTask = mockPrisma.task
const mockPrismaStaff = mockPrisma.staff

describe('Tasks API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  describe('GET /api/tasks', () => {
    it('should return tasks for authenticated staff', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'staff-123', role: 'HOUSEKEEPING' },
      } as any)

      const mockTasks = [
        {
          id: 'task-1',
          title: 'Clean Room 101',
          status: 'PENDING',
          priority: 'HIGH',
          assignedTo: 'staff-123',
          createdBy: 'user-123',
          createdAt: new Date(),
        },
      ]
      mockPrismaTask.findMany.mockResolvedValue(mockTasks as any)
      mockPrisma.staff.findFirst.mockResolvedValue(null) // For tasksWithRelations
      mockPrisma.user.findUnique.mockResolvedValue(null) // For tasksWithRelations

      const req = new NextRequest('http://localhost:3000/api/tasks')
      const response = await getTasks(req)

      expect(response?.status).toBe(200)
      const data = await response?.json()
      expect(Array.isArray(data.tasks)).toBe(true)
    })

    it('should filter tasks by status', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'staff-123', role: 'HOUSEKEEPING' },
      } as any)

      const mockTasks = [
        {
          id: 'task-1',
          status: 'PENDING',
          assignedTo: 'staff-123',
          createdBy: 'user-123',
        },
      ]
      mockPrismaTask.findMany.mockResolvedValue(mockTasks as any)
      mockPrisma.staff.findFirst.mockResolvedValue(null)
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/tasks?status=PENDING')
      const response = await getTasks(req)

      expect(response?.status).toBe(200)
      expect(mockPrismaTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        }),
      )
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/tasks')
      const response = await getTasks(req)

      expect(response?.status).toBe(401)
    })
  })

  describe('POST /api/tasks', () => {
    it('should create task for authenticated manager', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'manager-123', role: 'MANAGER' },
      } as any)

      const mockTask = {
        id: 'task-new',
        title: 'New Task',
        status: 'PENDING',
        priority: 'MEDIUM',
        assignedTo: 'staff-123',
        createdBy: 'manager-123',
        createdAt: new Date(),
      }
      mockPrismaTask.create.mockResolvedValue(mockTask as any)
      mockPrisma.staff.findFirst.mockResolvedValue({
        id: 'staff-123',
        name: 'Staff Member',
        email: 'staff@example.com',
      } as any)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'manager-123',
        name: 'Manager',
        email: 'manager@example.com',
      } as any)

      const req = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Task',
          description: 'Task description',
          type: 'HOUSEKEEPING',
          priority: 'MEDIUM',
          assignedTo: 'staff-123',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createTask(req)
      expect(response?.status).toBe(201)
      const data = await response?.json()
      expect(data.task).toHaveProperty('id')
    })

    it('should return 401 for non-manager user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'guest-123', role: 'GUEST' },
      } as any)

      const req = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Task',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createTask(req)
      expect(response?.status).toBe(401)
    })
  })

  describe('PATCH /api/tasks/[id]', () => {
    it('should update task status', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'staff-123', role: 'RECEPTIONIST' },
      } as any)

      const mockTask = {
        id: 'task-1',
        assignedTo: 'staff-123',
        createdBy: 'user-123',
        status: 'PENDING',
      }
      mockPrismaTask.findUnique.mockResolvedValue(mockTask as any)
      const updatedTask = {
        ...mockTask,
        status: 'IN_PROGRESS',
      }
      mockPrismaTask.update.mockResolvedValue(updatedTask as any)
      mockPrisma.staff.findFirst.mockResolvedValue({
        id: 'staff-123',
        name: 'Staff',
        email: 'staff@example.com',
      } as any)
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-123',
        name: 'User',
        email: 'user@example.com',
      } as any)

      const req = new NextRequest('http://localhost:3000/api/tasks/task-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await updateTask(req, { params: Promise.resolve({ id: 'task-1' }) })
      expect(response?.status).toBe(200)
      const data = await response?.json()
      expect(data.task.status).toBe('IN_PROGRESS')
    })

    it('should return 404 for non-existent task', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'staff-123', role: 'RECEPTIONIST' },
      } as any)

      mockPrismaTask.findUnique.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/tasks/non-existent', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await updateTask(req, { params: Promise.resolve({ id: 'non-existent' }) })
      expect(response?.status).toBe(404)
    })
  })

  describe('DELETE /api/tasks/[id]', () => {
    it('should delete task for super admin', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'admin-123', role: 'SUPER_ADMIN' },
      } as any)

      mockPrismaTask.findUnique.mockResolvedValue({
        id: 'task-1',
      } as any)

      mockPrismaTask.delete.mockResolvedValue({} as any)

      const req = new NextRequest('http://localhost:3000/api/tasks/task-1', {
        method: 'DELETE',
      })

      const response = await deleteTask(req, { params: Promise.resolve({ id: 'task-1' }) })
      expect(response?.status).toBe(200)
    })

    it('should return 401 for non-super-admin', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'staff-123', role: 'HOUSEKEEPING' },
      } as any)

      const req = new NextRequest('http://localhost:3000/api/tasks/task-1', {
        method: 'DELETE',
      })

      const response = await deleteTask(req, { params: Promise.resolve({ id: 'task-1' }) })
      expect(response?.status).toBe(401)
    })
  })
})


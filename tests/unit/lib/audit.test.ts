import { jest } from '@jest/globals'

// Define the mock before importing any modules that use it
const mockCreate = (jest.fn() as any).mockResolvedValue({ id: 'log-1' })

jest.mock('@/lib/db', () => ({
  prisma: {
    auditLog: {
      create: mockCreate
    }
  }
}))

import { prisma } from '@/lib/db'

describe('lib/audit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logAction should correctly persist an audit entry', async () => {
    const { logAction } = await import('@/lib/audit')

    const mockRequest = {
      headers: {
        get: (key: string) => key === 'x-forwarded-for' ? '127.0.0.1' : null
      }
    } as any

    await logAction(
      mockRequest,
      'admin-user',
      'TASK_CREATE',
      'Task',
      'task-123',
      { priority: 'HIGH' }
    )

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: 'admin-user',
        actor: 'admin-user',
        action: 'TASK_CREATE',
        resource: 'Task',
        resourceId: 'task-123',
        details: { priority: 'HIGH', ip: '127.0.0.1' }
      }
    })
  })

  it('logAction should handle system-level actions', async () => {
    const { logAction } = await import('@/lib/audit')

    await logAction(
      null,
      'SYSTEM',
      'BOOKING_AUTO_CANCEL',
      'Booking',
      'book-999',
      { reason: 'EXPIRED' }
    )

    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: 'SYSTEM',
        actor: 'SYSTEM',
        action: 'BOOKING_AUTO_CANCEL',
        resource: 'Booking',
        resourceId: 'book-999',
        details: { reason: 'EXPIRED', ip: 'system' }
      }
    })
  })
})

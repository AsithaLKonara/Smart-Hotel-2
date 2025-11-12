import { jest } from '@jest/globals'

const projectRoot = process.cwd()
const dbModulePath = require.resolve(`${projectRoot}/lib/db.ts`)

describe('lib/audit', () => {
  let createMock: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    createMock = jest.fn().mockResolvedValue({})

    jest.doMock(dbModulePath, () => ({
      __esModule: true,
      prisma: {
        auditLog: {
          create: createMock,
        },
      },
      default: {
        auditLog: {
          create: createMock,
        },
      },
    }))

    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('createAuditLog persists audit entries with normalized data', async () => {
    const { createAuditLog } = await import('@/lib/audit')

    await createAuditLog({
      userId: 'user-123',
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: 'user-123',
      details: { foo: 'bar' },
      ipAddress: '10.0.0.1',
      userAgent: 'jest-test',
    })

    expect(createMock).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: 'user-123',
        details: { foo: 'bar' },
        ipAddress: '10.0.0.1',
        userAgent: 'jest-test',
      },
    })
  })

  it('createAuditLog swallows errors and logs them', async () => {
    createMock.mockRejectedValueOnce(new Error('db down'))
    const { createAuditLog } = await import('@/lib/audit')

    await expect(
      createAuditLog({ action: 'ROOM_CREATE', resource: 'Room' }),
    ).resolves.toBeUndefined()

    expect(console.error).toHaveBeenCalledWith(
      'Failed to create audit log:',
      expect.any(Error),
    )
  })

  it('getClientInfo extracts ip/user agent from Headers-like request', async () => {
    const { getClientInfo } = await import('@/lib/audit')

    const info = getClientInfo({
      headers: {
        get: (key: string) => {
          switch (key.toLowerCase()) {
            case 'x-forwarded-for':
              return '203.0.113.5, 10.0.0.2'
            case 'user-agent':
              return 'Mozilla/5.0'
            default:
              return undefined
          }
        },
      },
    } as any)

    expect(info).toEqual({ ipAddress: '203.0.113.5', userAgent: 'Mozilla/5.0' })
  })

  it('getClientInfo falls back to object headers and socket address', async () => {
    const { getClientInfo } = await import('@/lib/audit')

    const info = getClientInfo({
      headers: {
        'x-real-ip': '198.51.100.20',
        'user-agent': 'CustomAgent/1.0',
      },
    } as any)
    expect(info).toEqual({ ipAddress: '198.51.100.20', userAgent: 'CustomAgent/1.0' })

    const socketInfo = getClientInfo({ socket: { remoteAddress: '192.0.2.55' } } as any)
    expect(socketInfo).toEqual({ ipAddress: '192.0.2.55', userAgent: 'unknown' })

    expect(getClientInfo()).toEqual({ ipAddress: 'unknown', userAgent: 'unknown' })
  })

  it('logAction delegates to createAuditLog with client metadata', async () => {
    const { logAction } = await import('@/lib/audit')

    await logAction(
      {
        headers: {
          get: (key: string) => {
            if (key.toLowerCase() === 'x-forwarded-for') return '10.10.10.10'
            if (key.toLowerCase() === 'user-agent') return 'Agent'
            return undefined
          },
        },
      } as any,
      'user-1',
      'TASK_CREATE',
      'Task',
      'task-9',
      { priority: 'HIGH' },
    )

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        action: 'TASK_CREATE',
        entityType: 'Task',
        entityId: 'task-9',
        details: { priority: 'HIGH' },
        ipAddress: '10.10.10.10',
        userAgent: 'Agent',
      }),
    })
  })
})

import { jest } from '@jest/globals'

const projectRoot = process.cwd()
const dbModulePath = require.resolve(`${projectRoot}/lib/db.ts`)
const auditModulePath = require.resolve(`${projectRoot}/lib/audit.ts`)

describe('lib/auth', () => {
  let findUniqueMock: jest.Mock
  let logActionMock: jest.Mock
  let compareMock: jest.Mock

  beforeEach(() => {
    jest.resetModules()
    findUniqueMock = jest.fn()
    logActionMock = jest.fn().mockResolvedValue(undefined)
    compareMock = jest.fn()

    jest.doMock(dbModulePath, () => ({
      __esModule: true,
      prisma: {
        user: {
          findUnique: findUniqueMock,
        },
      },
      default: {
        user: {
          findUnique: findUniqueMock,
        },
      },
    }))

    jest.doMock(auditModulePath, () => ({
      __esModule: true,
      logAction: logActionMock,
      AUDIT_ACTIONS: { USER_LOGIN: 'USER_LOGIN' },
    }))

    jest.doMock('bcryptjs', () => ({
      __esModule: true,
      compare: compareMock,
      default: { compare: compareMock },
    }))

    jest.spyOn(console, 'info').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  function getCredentialsProvider(authOptions: any) {
    const provider = authOptions.providers.find((p: any) => p.id === 'credentials')
    if (!provider) {
      throw new Error('Credentials provider not registered')
    }
    return provider
  }

  it('authorizes valid credentials and logs successful login', async () => {
    findUniqueMock.mockResolvedValue({
      id: 'user-1',
      email: 'guest@example.com',
      name: 'Guest User',
      role: 'GUEST',
      hotelId: 'hotel-1',
      password: 'hashed',
    })
    compareMock.mockResolvedValue(true)

    const { authOptions } = await import('@/lib/auth')
    const dbModule = await import('@/lib/db')
    expect(dbModule.prisma.user.findUnique).toBe(findUniqueMock)
    const auditModule = await import('@/lib/audit')
    const provider = getCredentialsProvider(authOptions)

    const authorize = (provider.options?.authorize || provider.authorize) as
      | ((credentials: any, req: any) => Promise<any>)
      | undefined

    if (!authorize) {
      throw new Error('Credentials authorize handler missing')
    }

    const result = await authorize(
      { email: 'guest@example.com', password: 'password123' },
      { headers: {} } as any,
    )

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { email: 'guest@example.com' },
    })
    expect(compareMock).toHaveBeenCalledWith('password123', 'hashed')
    expect(logActionMock).toHaveBeenCalledWith(
      expect.any(Object),
      'user-1',
      auditModule.AUDIT_ACTIONS.USER_LOGIN,
      'User',
      'user-1',
      { email: 'guest@example.com', role: 'GUEST' },
    )
    expect(result).toEqual({
      id: 'user-1',
      email: 'guest@example.com',
      name: 'Guest User',
      role: 'GUEST',
      hotelId: 'hotel-1',
    })
  })

  it('returns null when credentials missing and does not query database', async () => {
    const { authOptions } = await import('@/lib/auth')
    const provider = getCredentialsProvider(authOptions)

    const authorize = (provider.options?.authorize || provider.authorize) as
      | ((credentials: any, req: any) => Promise<any>)
      | undefined
    if (!authorize) throw new Error('Credentials authorize handler missing')

    const result = await authorize({ email: '', password: '' }, {} as any)

    expect(result).toBeNull()
    expect(findUniqueMock).not.toHaveBeenCalled()
  })

  it('logs failed login when user not found', async () => {
    findUniqueMock.mockResolvedValue(null)
    compareMock.mockResolvedValue(false)

    const { authOptions } = await import('@/lib/auth')
    const auditModule = await import('@/lib/audit')
    const provider = getCredentialsProvider(authOptions)

    const authorize = (provider.options?.authorize || provider.authorize) as
      | ((credentials: any, req: any) => Promise<any>)
      | undefined
    if (!authorize) throw new Error('Credentials authorize handler missing')

    const result = await authorize({ email: 'missing@example.com', password: 'secret' }, {} as any)

    expect(result).toBeNull()
    expect(findUniqueMock).toHaveBeenCalled()
    expect(logActionMock).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
      auditModule.AUDIT_ACTIONS.USER_LOGIN,
      'User',
      undefined,
      { email: 'missing@example.com', reason: 'User not found' },
    )
  })

  it('logs failed login when password invalid', async () => {
    findUniqueMock.mockResolvedValue({
      id: 'user-2',
      email: 'user@example.com',
      role: 'GUEST',
      hotelId: null,
      password: 'hashed',
    })
    compareMock.mockResolvedValue(false)

    const { authOptions } = await import('@/lib/auth')
    const auditModule = await import('@/lib/audit')
    const provider = getCredentialsProvider(authOptions)

    const authorize = (provider.options?.authorize || provider.authorize) as
      | ((credentials: any, req: any) => Promise<any>)
      | undefined
    if (!authorize) throw new Error('Credentials authorize handler missing')

    const result = await authorize(
      { email: 'user@example.com', password: 'wrong' },
      {} as any,
    )

    expect(result).toBeNull()
    expect(findUniqueMock).toHaveBeenCalled()
    expect(compareMock).toHaveBeenCalledWith('wrong', 'hashed')
    expect(logActionMock).toHaveBeenCalledWith(
      expect.anything(),
      'user-2',
      auditModule.AUDIT_ACTIONS.USER_LOGIN,
      'User',
      'user-2',
      { email: 'user@example.com', reason: 'Invalid password' },
    )
  })

  it('returns null and logs when authorization throws', async () => {
    const error = new Error('database offline')
    findUniqueMock.mockRejectedValue(error)

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const { authOptions } = await import('@/lib/auth')
    const provider = getCredentialsProvider(authOptions)

    const authorize = (provider.options?.authorize || provider.authorize) as
      | ((credentials: any, req: any) => Promise<any>)
      | undefined
    if (!authorize) throw new Error('Credentials authorize handler missing')

    const result = await authorize({ email: 'fail@example.com', password: 'pw' }, {} as any)

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith('Authentication error:', error)
  })

  it('sets token fields in jwt callback and expires stale tokens', async () => {
    const { authOptions } = await import('@/lib/auth')
    const { jwt } = authOptions.callbacks

    const token = await jwt({
      token: {},
      user: { id: 'user-3', role: 'MANAGER', hotelId: 'hotel-9' },
      account: null,
    })

    expect(token).toMatchObject({
      id: 'user-3',
      role: 'MANAGER',
      hotelId: 'hotel-9',
    })
    expect(typeof token.iat).toBe('number')

    const oldIssued = Math.floor((Date.now() - 9 * 60 * 60 * 1000) / 1000)

    const expired = await jwt({
      token: { id: 'old', role: 'MANAGER', hotelId: 'hotel', iat: oldIssued },
      user: undefined,
      account: null,
    })

    expect(expired).toEqual({
      id: '',
      role: 'GUEST',
      hotelId: null,
      iat: 0,
    })
  })

  it('hydrates session user fields from token', async () => {
    const { authOptions } = await import('@/lib/auth')
    const { session } = authOptions.callbacks

    const sessionData = await session({
      session: { user: {} as any },
      token: { id: 'abc', role: 'MANAGER', hotelId: 'hotel-2' },
    })

    expect(sessionData.user).toEqual({
      id: 'abc',
      role: 'MANAGER',
      hotelId: 'hotel-2',
    })
  })
})


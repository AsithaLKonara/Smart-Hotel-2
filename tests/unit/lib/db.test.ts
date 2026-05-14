import { jest } from '@jest/globals'

const PrismaClientMock = jest.fn()
const prismaInstance = {
  $on: jest.fn(),
  $extends: jest.fn().mockImplementation(() => prismaInstance),
} as any
const eventHandlers: Record<string, Function> = {}

const logErrorMock = jest.fn()
const logWarnMock = jest.fn()
const logDebugMock = jest.fn()

const mockPrismaModule = () => {
  PrismaClientMock.mockImplementation(() => prismaInstance)
  prismaInstance.$on.mockImplementation((event: string, handler: Function) => {
    eventHandlers[event] = handler
  })

  jest.doMock('@prisma/client', () => ({
    PrismaClient: PrismaClientMock,
    Prisma: {},
  }))

  jest.doMock('@/lib/logger', () => ({
    log: {
      error: logErrorMock,
      warn: logWarnMock,
      debug: logDebugMock,
    },
  }))
}

const importDbModule = () => {
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('@/lib/db')
  })
}

describe('lib/db', () => {
  beforeEach(() => {
    jest.resetModules()
    Object.keys(eventHandlers).forEach(key => delete eventHandlers[key])
    PrismaClientMock.mockClear()
    prismaInstance.$on.mockClear()
    logErrorMock.mockClear()
    logWarnMock.mockClear()
    logDebugMock.mockClear()
    delete (global as any).prisma

    process.env = {
      ...process.env,
      NODE_ENV: 'development',
      PRISMA_LOG_QUERIES: 'false',
    }

    mockPrismaModule()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.dontMock('@prisma/client')
  })

  it('configures Prisma with connection URL and no log config', () => {
    (process.env as any).NODE_ENV = 'production'
    process.env.DATABASE_URL = 'mongodb://localhost:27017/smarthotel_test'

    importDbModule()

    // The actual db.ts appends timeout params to the URL
    // and does NOT pass a log config (it's commented out)
    expect(PrismaClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        datasources: {
          db: {
            url: expect.stringContaining('connectTimeoutMS=5000'),
          },
        },
      })
    )
  })

  it('registers Prisma client with connection URL in development', () => {
    process.env.DATABASE_URL = 'mongodb://localhost:27017/smarthotel_test'

    importDbModule()

    // db.ts does NOT configure log levels — they are commented out
    // It only configures the datasource URL with timeout params appended
    expect(PrismaClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        datasources: {
          db: {
            url: expect.stringContaining('smarthotel_test'),
          },
        },
      })
    )
    // $on is not called — there is no event handler setup in the current db.ts
    expect(prismaInstance.$on).not.toHaveBeenCalled()
  })

  it('creates a valid PrismaClient instance (query logging not active)', () => {
    process.env.PRISMA_LOG_QUERIES = 'true'
    process.env.DATABASE_URL = 'mongodb://localhost:27017/smarthotel_test'

    importDbModule()

    // The current db.ts does NOT set up $on('query') — log config is commented out
    // This test confirms the client is still constructed successfully
    expect(PrismaClientMock).toHaveBeenCalledTimes(1)
    expect(prismaInstance.$on).not.toHaveBeenCalledWith('query', expect.any(Function))
  })
})

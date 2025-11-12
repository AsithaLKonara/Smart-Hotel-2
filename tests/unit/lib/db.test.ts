import { jest } from '@jest/globals'

const PrismaClientMock = jest.fn()
const prismaInstance = {
  $on: jest.fn(),
} as any
const eventHandlers: Record<string, Function> = {}

const mockPrismaModule = () => {
  PrismaClientMock.mockImplementation(() => prismaInstance)
  prismaInstance.$on.mockImplementation((event: string, handler: Function) => {
    eventHandlers[event] = handler
  })

  jest.doMock('@prisma/client', () => ({
    PrismaClient: PrismaClientMock,
    Prisma: {},
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
    delete (global as any).prisma

    process.env = {
      ...process.env,
      NODE_ENV: 'development',
      PRISMA_LOG_QUERIES: 'false',
    }

    mockPrismaModule()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.dontMock('@prisma/client')
  })

  it('configures production log definitions with only error level', () => {
    process.env.NODE_ENV = 'production'

    importDbModule()

    expect(PrismaClientMock).toHaveBeenCalledWith({
      log: [
        { level: 'error', emit: 'event' },
      ],
    })
    expect(prismaInstance.$on).not.toHaveBeenCalled()
  })

  it('registers error and warn handlers in development', () => {
    importDbModule()

    expect(PrismaClientMock).toHaveBeenCalledWith({
      log: [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    })

    expect(prismaInstance.$on).toHaveBeenCalledWith('error', expect.any(Function))
    expect(prismaInstance.$on).toHaveBeenCalledWith('warn', expect.any(Function))

    eventHandlers.error?.({ message: 'boom', target: 'User' })
    eventHandlers.warn?.({ message: 'slow query', target: 'Booking' })

    expect(console.error).toHaveBeenCalledWith('[Prisma Error]', {
      message: 'boom',
      target: 'User',
    })
    expect(console.warn).toHaveBeenCalledWith('[Prisma Warning]', {
      message: 'slow query',
      target: 'Booking',
    })
  })

  it('emits query logs only when PRISMA_LOG_QUERIES is true', () => {
    process.env.PRISMA_LOG_QUERIES = 'true'

    importDbModule()

    expect(prismaInstance.$on).toHaveBeenCalledWith('query', expect.any(Function))
    eventHandlers.query?.({ query: 'SELECT 1', params: '[]', duration: 12 })
    expect(console.debug).toHaveBeenCalledWith('[Prisma Query]', {
      query: 'SELECT 1',
      params: '[]',
      duration: '12ms',
    })
  })
})

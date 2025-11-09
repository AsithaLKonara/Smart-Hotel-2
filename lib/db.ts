import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const logLevels: Prisma.LogLevel[] = process.env.NODE_ENV === 'production'
  ? ['error']
  : ['warn', 'error', ...(process.env.PRISMA_LOG_QUERIES === 'true' ? ['query'] : [])]

const prismaLogger = globalForPrisma.prisma ?? new PrismaClient({
  log: logLevels,
})

if (process.env.NODE_ENV !== 'production') {
  prismaLogger.$on('error', event => {
    console.error('[Prisma Error]', {
      message: event.message,
      target: event.target,
    })
  })

  prismaLogger.$on('warn', event => {
    console.warn('[Prisma Warning]', {
      message: event.message,
      target: event.target,
    })
  })

  if (process.env.PRISMA_LOG_QUERIES === 'true') {
    prismaLogger.$on('query', event => {
      console.debug('[Prisma Query]', {
        query: event.query,
        params: event.params,
        duration: `${event.duration}ms`,
      })
    })
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaLogger

export const prisma = prismaLogger

export default prismaLogger 
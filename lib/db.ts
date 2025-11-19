import { PrismaClient, Prisma } from '@prisma/client'
import { log } from './logger'
import { trackDatabaseQuery } from './performance'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const makeLogDefinition = (level: Prisma.LogLevel): Prisma.LogDefinition => ({
  level,
  emit: 'event',
})

const baseLogDefinitions: Prisma.LogDefinition[] = [makeLogDefinition('error')]

const devLogDefinitions: Prisma.LogDefinition[] = [
  makeLogDefinition('warn'),
  makeLogDefinition('error'),
  ...(process.env.PRISMA_LOG_QUERIES === 'true' ? [makeLogDefinition('query')] : []),
]

const logDefinitions: Prisma.LogDefinition[] =
  process.env.NODE_ENV === 'production' ? baseLogDefinitions : devLogDefinitions

// Create Prisma client with proper configuration for serverless
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: logDefinitions,
    // Add connection pool configuration for serverless
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// Use singleton pattern for serverless environments
const prismaLogger = globalForPrisma.prisma ?? createPrismaClient()

type PrismaClientWithEvents = PrismaClient<Prisma.PrismaClientOptions, 'query' | 'info' | 'warn' | 'error'>
const prismaEventLogger = prismaLogger as PrismaClientWithEvents

if (process.env.NODE_ENV !== 'production') {
  prismaEventLogger.$on('error', event => {
    log.error('Prisma Error', new Error(event.message), {
      target: event.target,
    })
  })

  prismaEventLogger.$on('warn', event => {
    log.warn('Prisma Warning', {
      message: event.message,
      target: event.target,
    })
  })

  if (process.env.PRISMA_LOG_QUERIES === 'true') {
    prismaEventLogger.$on('query', event => {
      const duration = event.duration
      trackDatabaseQuery(event.query, duration, {
        target: event.target as string,
      })
      log.debug('Prisma Query', {
        query: event.query,
        params: event.params,
        duration: `${duration}ms`,
      })
    })
  }
}

// Store in global for reuse in serverless (prevents connection exhaustion)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaLogger
} else {
  // In production, also store to prevent multiple instances
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prismaLogger
  }
}

export const prisma = prismaLogger

export default prismaLogger 
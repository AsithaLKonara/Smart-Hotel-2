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
  // Enhance connection string for MongoDB Atlas to prevent sleeping
  let connectionUrl = process.env.DATABASE_URL || ''
  
  // Add MongoDB connection parameters to prevent sleeping and improve reliability
  if (connectionUrl && !connectionUrl.includes('retryWrites')) {
    const separator = connectionUrl.includes('?') ? '&' : '?'
    connectionUrl = `${connectionUrl}${separator}retryWrites=true&w=majority`
  }
  
  // Add connection timeout and keepalive parameters
  if (connectionUrl && !connectionUrl.includes('connectTimeoutMS')) {
    const separator = connectionUrl.includes('?') ? '&' : '?'
    connectionUrl = `${connectionUrl}${separator}connectTimeoutMS=30000&socketTimeoutMS=45000&serverSelectionTimeoutMS=30000&heartbeatFrequencyMS=10000`
  }

  return new PrismaClient({
    log: logDefinitions,
    datasources: {
      db: {
        url: connectionUrl,
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

// Connection retry wrapper for serverless environments
export async function connectWithRetry(
  operation: () => Promise<any>,
  retries = 3,
  delay = 1000
): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Ensure connection is active
      await prisma.$connect().catch(() => {
        // Connection might already be established, continue
      })
      
      // Execute the operation
      return await operation()
    } catch (error: any) {
      const isLastAttempt = attempt === retries
      const isConnectionError = 
        error?.message?.includes('connection') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('ECONNREFUSED') ||
        error?.message?.includes('network') ||
        error?.code === 'P1001' || // Prisma connection error
        error?.code === 'ENOTFOUND'

      if (isConnectionError && !isLastAttempt) {
        console.warn(`Database connection attempt ${attempt} failed, retrying...`, error.message)
        // Disconnect and wait before retry (allows MongoDB Atlas to wake up)
        await prisma.$disconnect().catch(() => {})
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
        continue
      }
      
      // If it's not a connection error or last attempt, throw immediately
      throw error
    }
  }
}

export default prismaLogger 
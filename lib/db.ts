import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: any
}

function createPrismaClient() {
  // Use connection pooling strictly in production if PGBOUNCER is set
  const isProduction = process.env.NODE_ENV === 'production'
  const databaseUrl = process.env.DATABASE_URL || ''
  
  // If the user appended ?pgbouncer=true via env, Prisma handles it automatically,
  // but we can ensure standard timeouts for serverless environments here
  const baseClient = new PrismaClient({
    log: isProduction ? ['error'] : ['warn', 'error'],
  })
  
  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (
            ['findMany', 'findFirst', 'count'].includes(operation) &&
            ['Room', 'Booking', 'Folio', 'Payment', 'User', 'Task'].includes(model)
          ) {
            const queryArgs = args as any
            queryArgs.where = queryArgs.where || {}
            // If the query didn't explicitly request soft-deleted records, default to filtering them out
            if (queryArgs.where.deletedAt === undefined) {
              queryArgs.where.deletedAt = null
            }
          }
          return query(args)
        },
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()
globalForPrisma.prisma = prisma as any

/**
 * Standard execution wrapper with connection retry logic.
 * Essential for serverless environments where the database provider may be cold-starting.
 */
export async function connectWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      const isConnectionError = 
        error.message?.includes('connection') || 
        error.message?.includes('timeout') ||
        error.message?.includes('network')
      
      if (isConnectionError && i < retries - 1) {
        console.warn(`DB Connection attempt ${i + 1} failed. Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw lastError
}

export default prisma
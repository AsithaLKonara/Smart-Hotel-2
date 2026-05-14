import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  let connectionUrl = process.env.DATABASE_URL || ''
  
  if (connectionUrl && !connectionUrl.includes('retryWrites')) {
    const separator = connectionUrl.includes('?') ? '&' : '?'
    connectionUrl = `${connectionUrl}${separator}retryWrites=true&w=majority`
  }
  
  if (connectionUrl && !connectionUrl.includes('connectTimeoutMS')) {
    const separator = connectionUrl.includes('?') ? '&' : '?'
    connectionUrl = `${connectionUrl}${separator}connectTimeoutMS=5000&socketTimeoutMS=10000&serverSelectionTimeoutMS=5000`
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
    // log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Standard execution wrapper with connection retry logic.
 * Essential for serverless environments where MongoDB Atlas may be cold-starting.
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
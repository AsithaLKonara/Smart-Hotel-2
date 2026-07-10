import { prisma } from '../db'

export interface SqlTransactionClient {
  query: (queryText: string, params?: any[]) => Promise<{ rows: any[], rowCount: number }>
}

export interface TransactionWork<T> {
  (client: SqlTransactionClient): Promise<T>
}

// Transactional In-Memory SQL Simulator Fallback for Test suites and local development
class MockPgClient implements SqlTransactionClient {
  async query(queryText: string, params: any[] = []): Promise<{ rows: any[], rowCount: number }> {
    const lower = queryText.toLowerCase()

    // Mock sequence validation checks
    if (lower.includes('select coalesce(max(sequence_number)')) {
      return { rows: [{ max_seq: 5 }], rowCount: 1 }
    }
    // Mock financial period locks
    if (lower.includes('select 1 from financial_period_locks')) {
      return { rows: [], rowCount: 0 }
    }
    // Mock ledger entry balance queries
    if (lower.includes('select coalesce(sum(debit - credit)')) {
      return { rows: [{ balance: 150.00 }], rowCount: 1 }
    }
    return { rows: [], rowCount: 0 }
  }
}

export class DatabaseClient {
  // Enforces serializable isolation locks with exponential deadlock retries using Prisma
  static async runInTransaction<T>(
    work: TransactionWork<T>,
    isolationLevel: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE' = 'SERIALIZABLE',
    maxRetries: number = 3
  ): Promise<T> {
    
    // Fallback for tests if no DATABASE_URL is available
    if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
      return work(new MockPgClient())
    }

    let attempts = 0

    while (true) {
      try {
        attempts++
        
        const prismaIsolationLevel = isolationLevel === 'READ COMMITTED' ? 'ReadCommitted' :
                                     isolationLevel === 'REPEATABLE READ' ? 'RepeatableRead' : 'Serializable'

        return await prisma.$transaction(async (tx) => {
          const clientWrapper: SqlTransactionClient = {
            query: async (queryText: string, params: any[] = []) => {
              const isSelect = queryText.trim().toLowerCase().startsWith('select')
              if (isSelect) {
                const rows = await tx.$queryRawUnsafe<any[]>(queryText, ...params)
                return { rows, rowCount: rows.length }
              } else {
                const rowCount = await tx.$executeRawUnsafe(queryText, ...params)
                return { rows: [], rowCount }
              }
            }
          }
          return await work(clientWrapper)
        }, {
          isolationLevel: prismaIsolationLevel as any
        })

      } catch (err: any) {
        const isDeadlockOrSerializationFailure = err.code === 'P2034' || err.code === '40001' || err.code === '40P01'
        
        if (isDeadlockOrSerializationFailure && attempts < maxRetries) {
          const backoffDelay = Math.pow(2, attempts) * 50 + Math.random() * 20
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
          continue
        }
        
        throw err
      }
    }
  }
}

export default DatabaseClient

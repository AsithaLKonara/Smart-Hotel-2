import { PoolClient } from 'pg'
import { DatabaseClient } from '../database-client'

export interface LedgerLine {
  accountCode: string
  debit: number
  credit: number
}

export class LedgerRepository {
  // Ensure that account posting does not write into locked/frozen periods
  static async checkPeriodLock(propertyId: string, businessDate: string, client: PoolClient): Promise<void> {
    const res = await client.query(`
      SELECT 1 FROM financial_period_locks 
      WHERE property_id = $1 AND business_date = $2 AND is_locked = TRUE
    `, [propertyId, businessDate])

    if ((res.rowCount ?? 0) > 0) {
      throw new Error(`FINANCIAL_PERIOD_LOCKED: Cannot post entries for business date [${businessDate}] on property [${propertyId}] which is frozen.`)
    }
  }

  // Create journal batch and debit/credit ledger lines atomically
  static async postJournalBatch(
    batchId: string,
    propertyId: string,
    businessDate: string,
    description: string,
    lines: LedgerLine[],
    client: PoolClient
  ): Promise<void> {
    // 1. Enforce period locking invariants
    await this.checkPeriodLock(propertyId, businessDate, client)

    // 2. Enforce balanced transaction rule (Sum of Debits must equal Sum of Credits)
    const sumDebits = lines.reduce((sum, l) => sum + l.debit, 0)
    const sumCredits = lines.reduce((sum, l) => sum + l.credit, 0)

    // Account for floating point tolerances (e.g. 0.0001)
    if (Math.abs(sumDebits - sumCredits) > 0.001) {
      throw new Error(`UNBALANCED_LEDGER_POSTING: Debits ($${sumDebits}) must balance Credits ($${sumCredits}) exactly.`)
    }

    const timestamp = new Date().toISOString()

    // 3. Write Master Journal Batch header
    await client.query(`
      INSERT INTO journal_batches (batch_id, property_id, business_date, description, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [batchId, propertyId, businessDate, description, timestamp])

    // 4. Write Individual balanced Ledger Line segments
    for (const line of lines) {
      await client.query(`
        INSERT INTO ledger_entries (entry_id, batch_id, account_code, debit, credit, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [`ent-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, batchId, line.accountCode, line.debit, line.credit, timestamp])
    }
  }

  // Calculate balance totals for audits
  static async getAccountBalance(propertyId: string, accountCode: string, client?: PoolClient): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(debit - credit), 0) as balance 
      FROM ledger_entries le
      JOIN journal_batches jb ON le.batch_id = jb.batch_id
      WHERE jb.property_id = $1 AND le.account_code = $2
    `
    const params = [propertyId, accountCode]

    if (client) {
      const res = await client.query(query, params)
      return Number(res.rows[0].balance)
    }

    return DatabaseClient.runInTransaction(async (dbClient) => {
      const res = await dbClient.query(query, params)
      return Number(res.rows[0].balance)
    }, 'READ COMMITTED')
  }
}

export default LedgerRepository

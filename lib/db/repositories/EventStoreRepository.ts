import { DatabaseClient, SqlTransactionClient } from '../database-client'

export interface EventRecord {
  eventId: string
  streamId: string
  tenantId: string
  sequenceNumber: number
  eventType: string
  payload: any
  metadata: any
  createdAt: string
}

export class EventStoreRepository {
  // Check if message has already been processed by the Inbox (Idempotency Audit)
  static async hasProcessedMessage(messageId: string, consumerGroup: string, client?: SqlTransactionClient): Promise<boolean> {
    const query = `
      SELECT 1 FROM transactional_inbox 
      WHERE message_id = $1 AND consumer_group = $2
    `
    const params = [messageId, consumerGroup]

    if (client) {
      const res = await client.query(query, params)
      return (res.rowCount ?? 0) > 0
    }

    return DatabaseClient.runInTransaction(async (dbClient) => {
      const res = await dbClient.query(query, params)
      return res.rowCount > 0
    }, 'READ COMMITTED')
  }

  // Register message processed inside the Inbox
  static async registerInboxMessage(messageId: string, consumerGroup: string, client: SqlTransactionClient): Promise<void> {
    await client.query(`
      INSERT INTO transactional_inbox (message_id, consumer_group, processed_at)
      VALUES ($1, $2, NOW())
    `, [messageId, consumerGroup])
  }

  // Append operational event to journal and write outbox message inside the SAME unit of work transaction
  static async appendEvents(
    streamId: string,
    tenantId: string,
    expectedSequence: number,
    events: Array<{ eventId: string; eventType: string; payload: any; metadata: any }>,
    client: SqlTransactionClient
  ): Promise<void> {
    // 1. Validate Optimistic Concurrency Control (OCC)
    const maxSeqRes = await client.query(`
      SELECT COALESCE(MAX(sequence_number), 0) as max_seq 
      FROM operational_event_journal 
      WHERE stream_id = $1 AND tenant_id = $2
    `, [streamId, tenantId])

    const currentMaxSeq = Number(maxSeqRes.rows[0].max_seq)
    if (currentMaxSeq !== expectedSequence) {
      throw new Error(`CONCURRENCY_CONFLICT: Stream [${streamId}] expected version ${expectedSequence} but database is at ${currentMaxSeq}.`)
    }

    let sequence = expectedSequence

    // 2. Insert Events & Outbox entries atomically
    for (const ev of events) {
      sequence += 1
      const timestamp = new Date().toISOString()

      // Insert into journal
      await client.query(`
        INSERT INTO operational_event_journal (event_id, stream_id, tenant_id, sequence_number, event_type, payload, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [ev.eventId, streamId, tenantId, sequence, ev.eventType, JSON.stringify(ev.payload), JSON.stringify(ev.metadata), timestamp])

      // Insert into transactional outbox
      await client.query(`
        INSERT INTO transaction_outbox (outbox_id, event_type, payload, metadata, status, created_at)
        VALUES ($1, $2, $3, $4, 'PENDING', $5)
      `, [ev.eventId, ev.eventType, JSON.stringify(ev.payload), JSON.stringify(ev.metadata), timestamp])
    }
  }

  // Load events for a stream (re-projection source)
  static async loadStream(streamId: string, tenantId: string, client?: SqlTransactionClient): Promise<EventRecord[]> {
    const query = `
      SELECT event_id, stream_id, tenant_id, sequence_number, event_type, payload, metadata, created_at
      FROM operational_event_journal
      WHERE stream_id = $1 AND tenant_id = $2
      ORDER BY sequence_number ASC
    `
    const params = [streamId, tenantId]

    const rows = client
      ? (await client.query(query, params)).rows
      : (await DatabaseClient.runInTransaction(async (dbClient) => {
        return (await dbClient.query(query, params)).rows
      }, 'READ COMMITTED'))

    return rows.map((r: any) => ({
      eventId: r.event_id,
      streamId: r.stream_id,
      tenantId: r.tenant_id,
      sequenceNumber: Number(r.sequence_number),
      eventType: r.event_type,
      payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
      createdAt: r.created_at
    }))
  }
}

export default EventStoreRepository

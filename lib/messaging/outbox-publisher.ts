import { PoolClient } from 'pg'
import { MessageBroker } from './message-broker'

export interface OutboxMessage {
  outboxId: string
  eventType: string
  payload: any
  metadata: any
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  retryCount: number
}

export class OutboxPublisher {
  // Routes operational events to partition-safe messaging topics
  static getTopicForEvent(eventType: string): string {
    if (eventType.startsWith('reservation.')) return 'reservation.events'
    if (eventType.startsWith('room.')) return 'room.events'
    if (eventType.startsWith('housekeeping.') || eventType.startsWith('dispatch.')) return 'housekeeping.events'
    if (eventType.startsWith('payment.')) return 'payment.events'
    if (eventType.startsWith('accounting.')) return 'accounting.events'
    return 'audit.events'
  }

  // Polls pending outbox queue, publishes to broker, and transitions statuses atomically
  static async processOutboxBatch(client: PoolClient, limit: number = 10): Promise<number> {
    // 1. Fetch pending outbox records
    const res = await client.query(`
      SELECT outbox_id, event_type, payload, metadata, retry_count
      FROM transaction_outbox
      WHERE status = 'PENDING' AND retry_count < 3
      ORDER BY created_at ASC
      LIMIT $1
      FOR UPDATE SKIP LOCKED
    `, [limit])

    let processedCount = 0

    for (const row of res.rows) {
      const outboxId = row.outbox_id
      const eventType = row.event_type
      const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload
      const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
      const retryCount = Number(row.retry_count)

      try {
        const topic = this.getTopicForEvent(eventType)

        // 2. Publish message to Kafka broker
        await MessageBroker.publish({
          topic,
          key: outboxId,
          value: JSON.stringify({ eventType, payload, metadata }),
          headers: { correlationId: metadata.correlationId || '' }
        })

        // 3. Mark outbox entry completed
        await client.query(`
          UPDATE transaction_outbox 
          SET status = 'COMPLETED', last_attempt = NOW()
          WHERE outbox_id = $1
        `, [outboxId])

        processedCount++
      } catch (err) {
        const nextRetryCount = retryCount + 1
        const nextStatus = nextRetryCount >= 3 ? 'FAILED' : 'PENDING'

        // 4. Record failure and handle dead-letter threshold
        await client.query(`
          UPDATE transaction_outbox
          SET status = $1, retry_count = $2, last_attempt = NOW()
          WHERE outbox_id = $3
        `, [nextStatus, nextRetryCount, outboxId])
      }
    }

    return processedCount
  }
}

export default OutboxPublisher

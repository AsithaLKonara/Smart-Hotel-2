import { SqlTransactionClient } from '../db/database-client'
import { EventStoreRepository } from '../db/repositories/EventStoreRepository'

export interface IncomingMessage {
  messageId: string
  consumerGroup: string
  eventType: string
  payload: any
}

export class InboxConsumer {
  // Consumes incoming stream messages idempotently, suppressing duplicates and saving message IDs
  static async consumeIdempotently(
    msg: IncomingMessage,
    client: SqlTransactionClient,
    handler: (payload: any, client: SqlTransactionClient) => Promise<void>
  ): Promise<boolean> {
    // 1. Audit deduplication inbox cache
    const alreadyProcessed = await EventStoreRepository.hasProcessedMessage(
      msg.messageId,
      msg.consumerGroup,
      client
    )

    if (alreadyProcessed) {
      // Duplicate message received: safely suppress processing side effects!
      return false
    }

    // 2. Execute target action handler
    await handler(msg.payload, client)

    // 3. Register message processed inside the Inbox database table
    await EventStoreRepository.registerInboxMessage(msg.messageId, msg.consumerGroup, client)

    return true
  }
}

export default InboxConsumer

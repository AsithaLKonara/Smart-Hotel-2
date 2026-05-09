import { OutboxPublisher } from '../../../lib/messaging/outbox-publisher'
import { InboxConsumer } from '../../../lib/messaging/inbox-consumer'
import { MessageBroker } from '../../../lib/messaging/message-broker'

describe('Distributed Messaging Fabric Suite', () => {
  let mockClient: any

  beforeEach(() => {
    MessageBroker.clearMockPublished()

    mockClient = {
      query: jest.fn().mockImplementation(async (queryStr, params) => {
        if (queryStr.includes('SELECT outbox_id, event_type')) {
          // Mock fetch return 1 pending outbox entry
          return {
            rows: [
              {
                outbox_id: 'out-101',
                event_type: 'reservation.confirmed',
                payload: '{"room":"101"}',
                metadata: '{"correlationId":"corr-01"}',
                retry_count: 0
              }
            ],
            rowCount: 1
          }
        }
        if (queryStr.includes('SELECT 1 FROM transactional_inbox')) {
          // Check inbox deduplication cache key (returns 0 rows: not processed)
          return { rows: [], rowCount: 0 }
        }
        return { rows: [], rowCount: 1 }
      })
    }
  })

  test('OutboxPublisher - should map events to correct Kafka partition topics', () => {
    expect(OutboxPublisher.getTopicForEvent('reservation.checked_in')).toBe('reservation.events')
    expect(OutboxPublisher.getTopicForEvent('room.cleaned')).toBe('room.events')
    expect(OutboxPublisher.getTopicForEvent('dispatch.task_created')).toBe('housekeeping.events')
    expect(OutboxPublisher.getTopicForEvent('payment.hold_authorized')).toBe('payment.events')
    expect(OutboxPublisher.getTopicForEvent('accounting.period_closed')).toBe('accounting.events')
    expect(OutboxPublisher.getTopicForEvent('unmapped.random_event')).toBe('audit.events')
  })

  test('OutboxPublisher - should poll outbox entries, publish to broker, and transition status', async () => {
    const processed = await OutboxPublisher.processOutboxBatch(mockClient, 1)

    expect(processed).toBe(1)
    
    // Check message broker published cache
    const published = MessageBroker.getMockPublished()
    expect(published.length).toBe(1)
    expect(published[0].topic).toBe('reservation.events')
    expect(published[0].key).toBe('out-101')

    // Query 1: Fetch pending. Query 2: Publish update query.
    expect(mockClient.query).toHaveBeenCalledTimes(2)
    expect(mockClient.query.mock.calls[1][0]).toContain("status = 'COMPLETED'")
  })

  test('OutboxPublisher - should quarantine poison messages to FAILED after 3 attempts', async () => {
    // Override fetch mock to simulate an outbox entry with 2 previous failures
    mockClient.query = jest.fn().mockImplementation(async (queryStr) => {
      if (queryStr.includes('SELECT outbox_id, event_type')) {
        return {
          rows: [
            {
              outbox_id: 'out-poison',
              event_type: 'reservation.confirmed',
              payload: '{"room":"101"}',
              metadata: '{}',
              retry_count: 2 // Next retry is the 3rd (and final) attempt
            }
          ],
          rowCount: 1
        }
      }
      return { rows: [], rowCount: 1 }
    })

    // Simulate broker connection timeout failure
    jest.spyOn(MessageBroker, 'publish').mockRejectedValueOnce(new Error('Broker connection timeout'))

    const processed = await OutboxPublisher.processOutboxBatch(mockClient, 1)
    
    // The message is not successfully processed (it failed and will be quarantined)
    expect(processed).toBe(0)

    // Check that update query set status to FAILED (poison DLQ quarantine)
    expect(mockClient.query.mock.calls[1][0]).toContain('UPDATE transaction_outbox')
    expect(mockClient.query.mock.calls[1][1][0]).toBe('FAILED') // status
    expect(mockClient.query.mock.calls[1][1][1]).toBe(3) // retryCount
  })

  test('InboxConsumer - should execute and log unique message ID keys', async () => {
    const msg = {
      messageId: 'msg-909',
      consumerGroup: 'finance-ledgers-group',
      eventType: 'payment.settled',
      payload: { amount: 120.00 }
    }

    const mockHandler = jest.fn()

    const outcome = await InboxConsumer.consumeIdempotently(msg, mockClient, mockHandler)

    expect(outcome).toBe(true)
    expect(mockHandler).toHaveBeenCalledTimes(1)
    expect(mockHandler).toHaveBeenCalledWith({ amount: 120.00 }, mockClient)
  })

  test('InboxConsumer - should suppress duplicate message execution side effects', async () => {
    // Override query mock to return processed true (meaning message already exists in the inbox)
    mockClient.query = jest.fn().mockImplementation(async (queryStr) => {
      if (queryStr.includes('SELECT 1 FROM transactional_inbox')) {
        return { rows: [{ processed_at: 'now' }], rowCount: 1 }
      }
      return { rows: [], rowCount: 1 }
    })

    const msg = {
      messageId: 'msg-909',
      consumerGroup: 'finance-ledgers-group',
      eventType: 'payment.settled',
      payload: {}
    }

    const mockHandler = jest.fn()

    const outcome = await InboxConsumer.consumeIdempotently(msg, mockClient, mockHandler)

    // Message must be safely skipped to avoid duplicate action triggers
    expect(outcome).toBe(false)
    expect(mockHandler).not.toHaveBeenCalled()
  })
})

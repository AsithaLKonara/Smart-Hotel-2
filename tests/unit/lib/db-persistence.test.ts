import { EventStoreRepository } from '../../../lib/db/repositories/EventStoreRepository'
import { LedgerRepository } from '../../../lib/db/repositories/LedgerRepository'
import { TaskDispatchRepository } from '../../../lib/db/repositories/TaskDispatchRepository'

describe('Durable Relational Persistence Suite', () => {
  let mockClient: any

  beforeEach(() => {
    // Mock the Postgres query client to verify query paths and transactional boundaries
    mockClient = {
      query: jest.fn().mockImplementation(async (queryStr, params) => {
        if (queryStr.includes('SELECT COALESCE(MAX(sequence_number)')) {
          // Mock sequence selection (returns version 5)
          return { rows: [{ max_seq: 5 }], rowCount: 1 }
        }
        if (queryStr.includes('SELECT 1 FROM financial_period_locks')) {
          // Mock period lock check (returns 0 rows: not locked)
          return { rows: [], rowCount: 0 }
        }
        if (queryStr.includes('SELECT COALESCE(SUM(debit - credit)')) {
          return { rows: [{ balance: 150.00 }], rowCount: 1 }
        }
        return { rows: [], rowCount: 1 }
      })
    }
  })

  test('EventStoreRepository - should append events and verify OCC sequence requirements', async () => {
    const events = [
      { eventId: 'ev-101', eventType: 'reservation.checked_in', payload: { guest: 'Selina Kyle' }, metadata: { traceId: 'tr-01' } }
    ]

    // Expecting sequence version 5 (matches the mock)
    await expect(
      EventStoreRepository.appendEvents('stream-res-1', 'tenant-hotel-1', 5, events, mockClient)
    ).resolves.not.toThrow()

    // Query 1: OCC Max sequence check. Query 2: Event journal insert. Query 3: Outbox insert.
    expect(mockClient.query).toHaveBeenCalledTimes(3)
  })

  test('EventStoreRepository - should throw conflict error if OCC sequence mismatch', async () => {
    const events = [
      { eventId: 'ev-102', eventType: 'reservation.checked_in', payload: {}, metadata: {} }
    ]

    // Concurrency conflict (expects 10, but mock returns 5)
    await expect(
      EventStoreRepository.appendEvents('stream-res-1', 'tenant-hotel-1', 10, events, mockClient)
    ).rejects.toThrow('CONCURRENCY_CONFLICT')
  })

  test('LedgerRepository - should block unbalanced double-entry postings', async () => {
    const lines = [
      { accountCode: '1010', debit: 150.00, credit: 0 },
      { accountCode: '4010', debit: 0, credit: 140.00 } // Unbalanced! Diff of $10
    ]

    await expect(
      LedgerRepository.postJournalBatch('batch-01', 'prop-01', '2026-05-08', 'Rent booking', lines, mockClient)
    ).rejects.toThrow('UNBALANCED_LEDGER_POSTING')
  })

  test('LedgerRepository - should block postings on locked period intervals', async () => {
    // Override the mock to simulate a frozen period lock
    mockClient.query = jest.fn().mockImplementation(async (queryStr) => {
      if (queryStr.includes('SELECT 1 FROM financial_period_locks')) {
        return { rows: [{ is_locked: true }], rowCount: 1 }
      }
      return { rows: [], rowCount: 0 }
    })

    const lines = [
      { accountCode: '1010', debit: 100.00, credit: 0 },
      { accountCode: '4010', debit: 0, credit: 100.00 }
    ]

    await expect(
      LedgerRepository.postJournalBatch('batch-02', 'prop-01', '2026-05-08', 'Rent booking', lines, mockClient)
    ).rejects.toThrow('FINANCIAL_PERIOD_LOCKED')
  })

  test('TaskDispatchRepository - should record creation, dispatch, and complete signatures', async () => {
    const task = {
      id: 'task-701',
      propertyId: 'prop-01',
      domain: 'VALET',
      priority: 'MEDIUM',
      state: 'CREATED',
      title: 'Retrieve guest vehicle',
      description: 'Lobby driveway park retrieve',
      location: 'Valet Lot 3',
      assignedStaffId: '',
      slaMinutes: 10,
      createdAt: new Date().toISOString()
    }

    await expect(TaskDispatchRepository.createTask(task, mockClient)).resolves.not.toThrow()
    await expect(TaskDispatchRepository.dispatchTask('task-701', 'valet_marcelo', mockClient)).resolves.not.toThrow()
    await expect(TaskDispatchRepository.completeTask('task-701', 'https://smarthotel.storage/valet.png', '6.927,79.86', mockClient)).resolves.not.toThrow()

    expect(mockClient.query).toHaveBeenCalledTimes(3)
  })
})

import { DoubleEntryLedger } from '../../../lib/double-entry-ledger'

describe('Double-Entry Accounting Ledger System', () => {
  beforeEach(() => {
    DoubleEntryLedger.initializeLedger()
  })

  test('should initialize default Chart of Accounts with correct balances', () => {
    const accounts = DoubleEntryLedger.getAccounts()
    expect(accounts.length).toBeGreaterThan(0)
    
    // Check key accounts
    const cash = DoubleEntryLedger.getAccount('1010')
    expect(cash.name).toBe('Cash / Bank')
    expect(cash.balance).toBe(0)

    const guestAR = DoubleEntryLedger.getAccount('1200')
    expect(guestAR.name).toBe('Guest AR (Accounts Receivable)')
    expect(guestAR.balance).toBe(0)
  })

  test('should successfully post a balanced Journal Entry (Room Charge: Dr Guest AR, Cr Room Revenue)', () => {
    const entry = DoubleEntryLedger.postJournalEntry(
      'booking-001',
      'Room charge for Night 1',
      '2026-05-08',
      [
        { accountId: 'acc-1200', debit: 150.00, credit: 0 }, // Dr Guest AR
        { accountId: 'acc-4010', debit: 0, credit: 150.00 }  // Cr Room Revenue
      ]
    )

    expect(entry.reference).toBe('booking-001')
    expect(entry.lines.length).toBe(2)
    
    // Check balances
    const guestAR = DoubleEntryLedger.getAccount('acc-1200')
    const roomRev = DoubleEntryLedger.getAccount('acc-4010')
    expect(guestAR.balance).toBe(150.00) // Debit increases assets
    expect(roomRev.balance).toBe(150.00) // Credit increases revenue
  })

  test('should successfully post a balanced payment (Payment Settle: Dr Cash, Cr Guest AR)', () => {
    // 1. Post charge first
    DoubleEntryLedger.postJournalEntry('booking-001', 'Room charge', '2026-05-08', [
      { accountId: 'acc-1200', debit: 100, credit: 0 },
      { accountId: 'acc-4010', debit: 0, credit: 100 }
    ])

    // 2. Post payment receipt
    DoubleEntryLedger.postJournalEntry('booking-001', 'Visa settlement', '2026-05-08', [
      { accountId: 'acc-1010', debit: 100, credit: 0 },  // Dr Cash
      { accountId: 'acc-1200', debit: 0, credit: 100 }   // Cr Guest AR
    ])

    const cash = DoubleEntryLedger.getAccount('acc-1010')
    const guestAR = DoubleEntryLedger.getAccount('acc-1200')

    expect(cash.balance).toBe(100)
    expect(guestAR.balance).toBe(0) // AR is settled back to 0
  })

  test('should throw an error when posting an imbalanced journal entry', () => {
    expect(() => {
      DoubleEntryLedger.postJournalEntry(
        'booking-002',
        'Imbalanced post',
        '2026-05-08',
        [
          { accountId: 'acc-1200', debit: 150.00, credit: 0 },
          { accountId: 'acc-4010', debit: 0, credit: 100.00 } // Misses $50
        ]
      )
    }).toThrow('Double-Entry balancing error')
  })

  test('should throw an error when posting negative values', () => {
    expect(() => {
      DoubleEntryLedger.postJournalEntry(
        'booking-003',
        'Negative post',
        '2026-05-08',
        [
          { accountId: 'acc-1200', debit: -50.00, credit: 0 },
          { accountId: 'acc-4010', debit: 0, credit: -50.00 }
        ]
      )
    }).toThrow('Debit or Credit cannot be negative values')
  })

  test('should throw an error when posting lines with both debit and credit fields populated', () => {
    expect(() => {
      DoubleEntryLedger.postJournalEntry(
        'booking-004',
        'Multi posts',
        '2026-05-08',
        [
          { accountId: 'acc-1200', debit: 50.00, credit: 50.00 },
          { accountId: 'acc-4010', debit: 0, credit: 0 }
        ]
      )
    }).toThrow('Single transaction line cannot have both a debit and a credit value posted')
  })

  test('should prevent postings on a closed Accounting Period', () => {
    // Check that we have a standard period
    const period = DoubleEntryLedger.getActivePeriodForDate('2026-05-08')
    expect(period.status).toBe('OPEN')

    // Close the period
    DoubleEntryLedger.closePeriod(period.id)

    expect(() => {
      DoubleEntryLedger.postJournalEntry(
        'booking-005',
        'Closed period test',
        '2026-05-08',
        [
          { accountId: 'acc-1200', debit: 100, credit: 0 },
          { accountId: 'acc-4010', debit: 0, credit: 100 }
        ]
      )
    }).toThrow('Cannot post transaction: Accounting Period [May 2026] is CLOSED')
  })

  test('should generate settlement batch correctly with balanced verification checksums', () => {
    // Post some transactions on May 8
    DoubleEntryLedger.postJournalEntry('b-01', 'Room Charge', '2026-05-08', [
      { accountId: 'acc-1200', debit: 200, credit: 0 },
      { accountId: 'acc-4010', debit: 0, credit: 200 }
    ])

    DoubleEntryLedger.postJournalEntry('b-02', 'Food charge', '2026-05-08', [
      { accountId: 'acc-1200', debit: 50, credit: 0 },
      { accountId: 'acc-4020', debit: 0, credit: 50 }
    ])

    const batch = DoubleEntryLedger.generateSettlementBatch('2026-05-08')

    expect(batch.businessDate).toBe('2026-05-08')
    expect(batch.totalDebit).toBe(250)
    expect(batch.totalCredit).toBe(250)
    expect(batch.balanced).toBe(true)
    expect(batch.checksum).toBeDefined()
    expect(batch.checksum.startsWith('SHA256-SIM-')).toBe(true)
  })
})

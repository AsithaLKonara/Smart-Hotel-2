import { FinancialEngine } from '../../../lib/financial-engine'
import { DoubleEntryLedger } from '../../../lib/double-entry-ledger'
import { BusinessDateEngine } from '../../../lib/business-date-engine'

describe('Financial Engine + Ledger + Business-Date Integration', () => {
  beforeEach(() => {
    DoubleEntryLedger.initializeLedger()
    BusinessDateEngine.initialize('2026-05-08')
    FinancialEngine.clearFolios()
  })

  test('should record double-entry entries upon posting charges', () => {
    const folio = FinancialEngine.createFolio('booking-int-001')

    // Post standard room charge of $200 (+ $40 VAT)
    const tx = FinancialEngine.postCharge(folio.id, 'Standard suite charge', 200, 'ROOM_CHARGE')

    expect(tx.amount).toBe(200)
    expect(tx.taxAmount).toBe(40) // 20% on $200 standard

    // Query ledger to confirm balanced journal entry was posted
    const entries = DoubleEntryLedger.getEntries()
    expect(entries.length).toBe(1)
    
    const entry = entries[0]
    expect(entry.reference).toBe(tx.id)
    expect(entry.businessDate).toBe('2026-05-08')

    // Total Debit === Total Credit === 240
    let debits = 0
    let credits = 0
    entry.lines.forEach(l => {
      debits += l.debit
      credits += l.credit
    })
    expect(debits).toBe(240)
    expect(credits).toBe(240)

    // Check specific accounts
    const guestAR = DoubleEntryLedger.getAccount('1200')
    const roomRevenue = DoubleEntryLedger.getAccount('4010')
    const taxLiability = DoubleEntryLedger.getAccount('2010')

    expect(guestAR.balance).toBe(240)
    expect(roomRevenue.balance).toBe(200)
    expect(taxLiability.balance).toBe(40)
  })

  test('should successfully settle payment and decrease guest accounts receivable balance', () => {
    const folio = FinancialEngine.createFolio('booking-int-002')
    
    // Post charge
    FinancialEngine.postCharge(folio.id, 'Suite rent', 100, 'ROOM_CHARGE') // Total AR: 120 (100 + 20)

    // Settle with payment
    FinancialEngine.postPayment(folio.id, 120, 'Visa card settlement')

    const guestAR = DoubleEntryLedger.getAccount('1200')
    const cash = DoubleEntryLedger.getAccount('1010')

    expect(guestAR.balance).toBe(0) // Completely settled
    expect(cash.balance).toBe(120) // Cash account increased by 120
  })

  test('should reject transactions posted on a business date locked by Audit', () => {
    const folio = FinancialEngine.createFolio('booking-int-003')

    // Lock current date
    BusinessDateEngine.lockDate('2026-05-08')

    expect(() => {
      FinancialEngine.postCharge(folio.id, 'Belated charge', 100, 'ROOM_CHARGE')
    }).toThrow('Cannot post charge: Business Date [2026-05-08] has been locked by Audit.')
  })

  test('should execute full night audit rollover, settle open folios and seal settlement batch', () => {
    const folio1 = FinancialEngine.createFolio('b-aud-01')
    const folio2 = FinancialEngine.createFolio('b-aud-02')

    FinancialEngine.postCharge(folio1.id, 'Room charge', 150, 'ROOM_CHARGE') // Total: 180 (150 + 30)
    FinancialEngine.postCharge(folio2.id, 'Room charge', 100, 'ROOM_CHARGE') // Total: 120 (100 + 20)

    // Run night audit
    const result = FinancialEngine.runNightAudit('manager_bot')

    expect(result.auditedFolios).toBe(2)
    expect(result.totalRevenue).toBe(250)
    expect(result.totalTaxes).toBe(50)
    expect(result.batchChecksum).toBeDefined()

    // Confirm that date rolled over to May 9 and May 8 is locked
    expect(BusinessDateEngine.getBusinessDate()).toBe('2026-05-09')
    expect(BusinessDateEngine.isDateLocked('2026-05-08')).toBe(true)

    // Confirm settlement batch was generated
    const batch = DoubleEntryLedger.getBatch('2026-05-08')
    expect(batch).toBeDefined()
    expect(batch?.totalDebit).toBe(300) // 180 + 120
    expect(batch?.balanced).toBe(true)
    expect(batch?.checksum).toBe(result.batchChecksum)
  })
})

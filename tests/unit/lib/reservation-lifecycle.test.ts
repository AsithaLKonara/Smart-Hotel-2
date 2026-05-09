import { ReservationLifecycleEngine } from '../../../lib/reservation-lifecycle'
import { DeferredRevenueEngine } from '../../../lib/deferred-revenue'
import { WorkflowRuntimeEngine } from '../../../lib/workflow-runtime'
import { DoubleEntryLedger } from '../../../lib/double-entry-ledger'

describe('Unified Reservation Lifecycle State Machine', () => {
  beforeEach(() => {
    ReservationLifecycleEngine.clearAll()
    DeferredRevenueEngine.clearAll()
    WorkflowRuntimeEngine.clearAll()
    DoubleEntryLedger.initializeLedger()
    DeferredRevenueEngine.initializeAccounts()
  })

  test('should create reservation and track history on valid state transitions', () => {
    const res = ReservationLifecycleEngine.createReservation(
      'res-test-01',
      'Diana Prince',
      'r101',
      '101',
      0,
      2,
      '2026-05-08',
      'rec_alice',
      'INQUIRY'
    )

    expect(res.state).toBe('INQUIRY')

    // Transition: Inquiry -> Quote Sent -> Pending Payment -> Confirmed
    ReservationLifecycleEngine.transitionReservation('res-test-01', 'QUOTE_SENT', 'rec_alice')
    expect(res.state).toBe('QUOTE_SENT')

    ReservationLifecycleEngine.transitionReservation('res-test-01', 'PENDING_PAYMENT', 'rec_alice')
    expect(res.state).toBe('PENDING_PAYMENT')

    ReservationLifecycleEngine.transitionReservation('res-test-01', 'CONFIRMED', 'rec_alice')
    expect(res.state).toBe('CONFIRMED')

    // Expect transition logs length of 3
    expect(res.history.length).toBe(3)
    expect(res.history[0].from).toBe('INQUIRY')
    expect(res.history[0].to).toBe('QUOTE_SENT')
  })

  test('should throw immediate exception on invalid state transition paths', () => {
    const res = ReservationLifecycleEngine.createReservation(
      'res-test-02',
      'Bruce Wayne',
      'r401',
      '401',
      0,
      5,
      '2026-05-08',
      'rec_alice',
      'INQUIRY'
    )

    // Attempting direct checkout from Inquiry (illegal!)
    expect(() => {
      ReservationLifecycleEngine.transitionReservation('res-test-02', 'CHECKED_OUT', 'rec_alice')
    }).toThrow('Illegal Transition')
  })

  test('should trigger deferred deposit registration automatically when booking is CONFIRMED', () => {
    // Initialized as INQUIRY with a deposit of $300
    const res = ReservationLifecycleEngine.createReservation(
      'res-deposit-01',
      'Clark Kent',
      'r201',
      '201',
      300.00,
      3,
      '2026-05-08',
      'rec_alice',
      'INQUIRY'
    )

    // Move to PENDING_PAYMENT, then CONFIRMED
    ReservationLifecycleEngine.transitionReservation('res-deposit-01', 'QUOTE_SENT', 'rec_alice')
    ReservationLifecycleEngine.transitionReservation('res-deposit-01', 'PENDING_PAYMENT', 'rec_alice')
    
    // Confirmed!
    ReservationLifecycleEngine.transitionReservation('res-deposit-01', 'CONFIRMED', 'rec_alice')

    // Confirm deposit registered in deferred engine
    const deposit = DeferredRevenueEngine.getDeposit('res-deposit-01')
    expect(deposit).toBeDefined()
    expect(deposit?.totalAmount).toBe(300.00)

    // Ledger checks
    const deferredRevenue = DoubleEntryLedger.getAccount('2200')
    expect(deferredRevenue.balance).toBe(300.00)
  })

  test('should launch the 5-step operational checkout saga automatically when guest is CHECKED_OUT', () => {
    const res = ReservationLifecycleEngine.createReservation(
      'res-checkout-01',
      'Barry Allen',
      'r102',
      '102',
      0,
      1,
      '2026-05-08',
      'rec_alice',
      'CHECKED_IN'
    )

    // Move from CHECKED_IN to IN_HOUSE, then CHECKED_OUT
    ReservationLifecycleEngine.transitionReservation('res-checkout-01', 'IN_HOUSE', 'rec_alice')
    
    // Check out!
    ReservationLifecycleEngine.transitionReservation('res-checkout-01', 'CHECKED_OUT', 'rec_alice')

    // Verify checkout saga was automatically launched
    const activeSaga = WorkflowRuntimeEngine.getActiveSagaForRoom('102')
    expect(activeSaga).toBeDefined()
    expect(activeSaga?.status).toBe('IN_PROGRESS')
    expect(activeSaga?.reservationId).toBe('res-checkout-01')

    // CLOSE_FOLIO should be running by default
    expect(activeSaga?.tasks[0].type).toBe('CLOSE_FOLIO')
    expect(activeSaga?.tasks[0].status).toBe('RUNNING')
  })
})

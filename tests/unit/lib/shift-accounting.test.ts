import { ShiftAccountingEngine } from '../../../lib/shift-accounting'

describe('Shift Accounting & Cash Drawer Reconciliation', () => {
  beforeEach(() => {
    ShiftAccountingEngine.clearAll()
  })

  test('should successfully open a cashier shift with correct starting balance', () => {
    const shift = ShiftAccountingEngine.openShift('cashier_101', 'drawer_A', 150.00)

    expect(shift.status).toBe('OPEN')
    expect(shift.initialBalance).toBe(150.00)
    expect(shift.expectedBalance).toBe(150.00)
    expect(shift.cashierId).toBe('cashier_101')
  })

  test('should reject opening multiple overlapping shifts on the same cash drawer', () => {
    ShiftAccountingEngine.openShift('cashier_101', 'drawer_A', 150.00)

    expect(() => {
      ShiftAccountingEngine.openShift('cashier_102', 'drawer_A', 200.00)
    }).toThrow('Cannot open shift: Cash drawer [drawer_A] already has an active OPEN shift')
  })

  test('should accurately log deposits and cash payouts, updating expected balances', () => {
    ShiftAccountingEngine.openShift('cashier_101', 'drawer_B', 100.00)

    // Deposit $50 cash from a guest checkout
    ShiftAccountingEngine.recordCashTransaction('drawer_B', 50.00, 'CASH_IN', 'Guest room settlement cash')
    // Pay out $20 petty cash for kitchen items
    ShiftAccountingEngine.recordCashTransaction('drawer_B', 20.00, 'CASH_OUT', 'Petty cash: kitchen milk')

    const activeShift = ShiftAccountingEngine.getOpenShiftForDrawer('drawer_B')
    expect(activeShift?.expectedBalance).toBe(130.00) // 100 + 50 - 20 = 130
    
    const transactions = ShiftAccountingEngine.getTransactionsForShift(activeShift!.id)
    expect(transactions.length).toBe(2)
    expect(transactions[0].type).toBe('CASH_IN')
    expect(transactions[1].type).toBe('CASH_OUT')
  })

  test('should reconcile and close shift successfully when expected matches counted balance', () => {
    ShiftAccountingEngine.openShift('cashier_101', 'drawer_C', 150.00)
    ShiftAccountingEngine.recordCashTransaction('drawer_C', 50.00, 'CASH_IN', 'Cash deposit')

    const shift = ShiftAccountingEngine.closeAndReconcileShift('drawer_C', 200.00)

    expect(shift.status).toBe('CLOSED')
    expect(shift.variance).toBe(0)
    expect(shift.countedBalance).toBe(200.00)
    expect(shift.closedAt).toBeDefined()
  })

  test('should quarantine shift when there is a counted variance and no supervisor override', () => {
    ShiftAccountingEngine.openShift('cashier_101', 'drawer_D', 150.00)
    ShiftAccountingEngine.recordCashTransaction('drawer_D', 50.00, 'CASH_IN', 'Cash deposit') // Expected: 200

    // Counted physical balance is $190 (shortage of $10)
    const shift = ShiftAccountingEngine.closeAndReconcileShift('drawer_D', 190.00)

    expect(shift.status).toBe('QUARANTINED')
    expect(shift.variance).toBe(-10.00)
    expect(shift.countedBalance).toBe(190.00)
    expect(shift.supervisorId).toBeUndefined()
  })

  test('should close shift with variance successfully when authorized by a supervisor signature', () => {
    ShiftAccountingEngine.openShift('cashier_101', 'drawer_E', 150.00)
    ShiftAccountingEngine.recordCashTransaction('drawer_E', 50.00, 'CASH_IN', 'Cash deposit') // Expected: 200

    // Counted physical balance is $205 (surplus of $5), closed with SRE supervisor signoff
    const shift = ShiftAccountingEngine.closeAndReconcileShift('drawer_E', 205.00, 'supervisor_jane')

    expect(shift.status).toBe('CLOSED')
    expect(shift.variance).toBe(5.00)
    expect(shift.countedBalance).toBe(205.00)
    expect(shift.supervisorId).toBe('supervisor_jane')
  })
})

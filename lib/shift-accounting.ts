import { eventBus } from './event-bus'

export interface CashierShift {
  id: string
  cashierId: string
  drawerId: string
  status: 'OPEN' | 'CLOSED' | 'QUARANTINED'
  openedAt: string
  closedAt?: string
  initialBalance: number
  expectedBalance: number
  countedBalance?: number
  variance?: number
  supervisorId?: string
}

export interface CashDrawerTransaction {
  id: string
  shiftId: string
  amount: number
  type: 'CASH_IN' | 'CASH_OUT'
  description: string
  timestamp: string
}

export class ShiftAccountingEngine {
  private static shifts: Map<string, CashierShift> = new Map()
  private static transactions: Map<string, CashDrawerTransaction[]> = new Map()

  // Clear data (for test suites)
  static clearAll(): void {
    this.shifts.clear()
    this.transactions.clear()
  }

  // Retrieve current active open shift for a specific cash drawer
  static getOpenShiftForDrawer(drawerId: string): CashierShift | undefined {
    return Array.from(this.shifts.values()).find(
      s => s.drawerId === drawerId && s.status === 'OPEN'
    )
  }

  // Open a new Cashier Shift
  static openShift(cashierId: string, drawerId: string, initialBalance: number): CashierShift {
    const existing = this.getOpenShiftForDrawer(drawerId)
    if (existing) {
      throw new Error(`Cannot open shift: Cash drawer [${drawerId}] already has an active OPEN shift by cashier [${existing.cashierId}].`)
    }
    if (initialBalance < 0) {
      throw new Error('Initial shift balance cannot be negative.')
    }

    const id = `shift-${drawerId}-${Date.now()}`
    const shift: CashierShift = {
      id,
      cashierId,
      drawerId,
      status: 'OPEN',
      openedAt: new Date().toISOString(),
      initialBalance,
      expectedBalance: initialBalance
    }

    this.shifts.set(id, shift)
    this.transactions.set(id, [])

    eventBus.emit({
      id: `shift-open-${id}`,
      type: 'shift.shift_opened',
      severity: 'INFO',
      title: 'Cashier Shift Opened',
      message: `Cashier ${cashierId} opened drawer ${drawerId} with starting cash of $${initialBalance.toFixed(2)}.`,
      metadata: { ...shift },
      timestamp: shift.openedAt
    })

    return shift
  }

  // Log drawer transactions (refund payouts, petty cash, cash settlements)
  static recordCashTransaction(
    drawerId: string,
    amount: number,
    type: 'CASH_IN' | 'CASH_OUT',
    description: string
  ): CashDrawerTransaction {
    const shift = this.getOpenShiftForDrawer(drawerId)
    if (!shift) {
      throw new Error(`Cannot record transaction: Cash drawer [${drawerId}] does not have an active open shift.`)
    }
    if (amount <= 0) {
      throw new Error('Transaction value must be strictly positive.')
    }

    const txId = `cash-tx-${shift.id}-${Date.now()}`
    const tx: CashDrawerTransaction = {
      id: txId,
      shiftId: shift.id,
      amount,
      type,
      description,
      timestamp: new Date().toISOString()
    }

    const txList = this.transactions.get(shift.id) || []
    txList.push(tx)
    this.transactions.set(shift.id, txList)

    // Adjust expected balance mathematically
    if (type === 'CASH_IN') {
      shift.expectedBalance = parseFloat((shift.expectedBalance + amount).toFixed(2))
    } else {
      shift.expectedBalance = parseFloat((shift.expectedBalance - amount).toFixed(2))
    }

    eventBus.emit({
      id: `shift-tx-${txId}`,
      type: `shift.cash_transaction_logged`,
      severity: 'INFO',
      title: `Cash ${type === 'CASH_IN' ? 'Deposit' : 'Payout'}: $${amount.toFixed(2)}`,
      message: `Drawer ${drawerId} transaction recorded: ${description}. Expected remaining: $${shift.expectedBalance.toFixed(2)}.`,
      metadata: { ...tx },
      timestamp: tx.timestamp
    })

    return tx
  }

  // Settle and Close cash drawer with audit sign-off controls
  static closeAndReconcileShift(
    drawerId: string,
    countedBalance: number,
    supervisorId?: string
  ): CashierShift {
    const shift = this.getOpenShiftForDrawer(drawerId)
    if (!shift) {
      throw new Error(`Cannot reconcile: Cash drawer [${drawerId}] does not have an active open shift.`)
    }
    if (countedBalance < 0) {
      throw new Error('Counted balance cannot be negative.')
    }

    shift.closedAt = new Date().toISOString()
    shift.countedBalance = countedBalance
    
    const variance = parseFloat((countedBalance - shift.expectedBalance).toFixed(2))
    shift.variance = variance

    if (variance === 0) {
      shift.status = 'CLOSED'
      
      eventBus.emit({
        id: `shift-close-${shift.id}`,
        type: 'shift.shift_closed',
        severity: 'INFO',
        title: `Shift Closed and Balanced: ${drawerId}`,
        message: `Cashier shift ${shift.id} successfully closed. Expected: $${shift.expectedBalance.toFixed(2)}, counted: $${countedBalance.toFixed(2)}. Variance: $0.`,
        metadata: { ...shift },
        timestamp: shift.closedAt
      })
    } else {
      // Discrepancy detected! Requires supervisor approval or goes to Quarantine.
      if (supervisorId && supervisorId.trim() !== '') {
        shift.status = 'CLOSED'
        shift.supervisorId = supervisorId

        eventBus.emit({
          id: `shift-close-discrepancy-${shift.id}`,
          type: 'shift.shift_closed_with_variance',
          severity: 'HIGH',
          title: `Shift Closed with Variance (Approved)`,
          message: `Shift closed with variance of $${variance.toFixed(2)}. Approved by Supervisor: ${supervisorId}.`,
          metadata: { ...shift },
          timestamp: shift.closedAt
        })
      } else {
        shift.status = 'QUARANTINED'

        eventBus.emit({
          id: `shift-quarantine-${shift.id}`,
          type: 'shift.shift_quarantined',
          severity: 'CRITICAL',
          title: `Drawer Variance Warning: ${drawerId}`,
          message: `Shift quarantined due to audit discrepancy. Counted: $${countedBalance.toFixed(2)}, expected: $${shift.expectedBalance.toFixed(2)}. Variance: $${variance.toFixed(2)}. Supervisor approval required.`,
          metadata: { ...shift },
          timestamp: shift.closedAt
        })
      }
    }

    return shift
  }

  static getShift(id: string): CashierShift | undefined {
    return this.shifts.get(id)
  }

  static getTransactionsForShift(id: string): CashDrawerTransaction[] {
    return this.transactions.get(id) || []
  }
}

export default ShiftAccountingEngine;

import { eventBus } from './event-bus'
import { DeferredRevenueEngine } from './deferred-revenue'
import { WorkflowRuntimeEngine } from './workflow-runtime'

export type ReservationState =
  | 'INQUIRY'
  | 'QUOTE_SENT'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PRE_ARRIVAL'
  | 'CHECKED_IN'
  | 'IN_HOUSE'
  | 'LATE_CHECKOUT'
  | 'CHECKED_OUT'
  | 'NO_SHOW'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'DISPUTED'

export interface Reservation {
  id: string
  guestName: string
  roomId: string
  roomNumber: string
  state: ReservationState
  depositAmount: number
  totalNights: number
  businessDate: string
  operatorId: string
  history: Array<{
    from: ReservationState
    to: ReservationState
    operatorId: string
    timestamp: string
  }>
}

export class ReservationLifecycleEngine {
  private static reservations: Map<string, Reservation> = new Map()

  // Clear data (for test suites)
  static clearAll(): void {
    this.reservations.clear()
  }

  // Strictly allowed next states mapping (The Enterprise Transition Matrix)
  private static allowedTransitions: Record<ReservationState, ReservationState[]> = {
    INQUIRY: ['QUOTE_SENT', 'CANCELLED'],
    QUOTE_SENT: ['PENDING_PAYMENT', 'CANCELLED'],
    PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PRE_ARRIVAL', 'CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
    PRE_ARRIVAL: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
    CHECKED_IN: ['IN_HOUSE', 'CANCELLED'],
    IN_HOUSE: ['LATE_CHECKOUT', 'CHECKED_OUT', 'DISPUTED'],
    LATE_CHECKOUT: ['CHECKED_OUT', 'DISPUTED'],
    CHECKED_OUT: ['DISPUTED'],
    NO_SHOW: ['CANCELLED', 'REFUNDED'],
    CANCELLED: ['REFUNDED'],
    REFUNDED: ['DISPUTED'],
    DISPUTED: ['REFUNDED', 'CHECKED_OUT']
  }

  // Create a new reservation inquiry
  static createReservation(
    id: string,
    guestName: string,
    roomId: string,
    roomNumber: string,
    depositAmount: number,
    totalNights: number,
    businessDate: string,
    operatorId: string,
    initialState: ReservationState = 'INQUIRY'
  ): Reservation {
    const res: Reservation = {
      id,
      guestName,
      roomId,
      roomNumber,
      state: initialState,
      depositAmount,
      totalNights,
      businessDate,
      operatorId,
      history: []
    }

    this.reservations.set(id, res)

    // Side effect triggers for initial state overrides
    if (initialState === 'CONFIRMED' && depositAmount > 0) {
      DeferredRevenueEngine.registerFutureDeposit(id, depositAmount, totalNights, businessDate)
    }

    eventBus.emit({
      id: `res-created-${id}`,
      type: 'reservation.created',
      severity: 'INFO',
      title: `Reservation Created: ${guestName}`,
      message: `Reservation ${id} registered under initial state ${initialState} for Room ${roomNumber}.`,
      metadata: { ...res },
      timestamp: new Date().toISOString()
    })

    return res
  }

  // Stateful transition executor
  static transitionReservation(
    id: string,
    nextState: ReservationState,
    operatorId: string
  ): Reservation {
    const res = this.reservations.get(id)
    if (!res) {
      throw new Error(`Reservation reference [${id}] not found in database records.`)
    }

    const currentState = res.state
    if (currentState === nextState) {
      return res // Idempotency
    }

    // Verify transition compliance
    const allowed = this.allowedTransitions[currentState] || []
    if (!allowed.includes(nextState)) {
      throw new Error(`Illegal Transition: Cannot change reservation status from ${currentState} to ${nextState}.`)
    }

    // Record timeline history
    res.history.push({
      from: currentState,
      to: nextState,
      operatorId,
      timestamp: new Date().toISOString()
    })

    res.state = nextState
    res.operatorId = operatorId

    // Fire downward transactional side-effects
    this.handleTransitionSideEffects(res, currentState, nextState)

    eventBus.emit({
      id: `res-trans-${id}-${Date.now()}`,
      type: `reservation.state_transitioned`,
      severity: 'HIGH',
      title: `Booking Status: ${currentState} → ${nextState}`,
      message: `Reservation ${id} for ${res.guestName} transitioned successfully. Operator: ${operatorId}.`,
      metadata: { reservationId: id, from: currentState, to: nextState, operatorId },
      timestamp: new Date().toISOString()
    })

    return res
  }

  // Automated core integrations based on state shifts
  private static handleTransitionSideEffects(
    res: Reservation,
    from: ReservationState,
    to: ReservationState
  ): void {
    // 1. Confirming deposit logs prepayment to Deferred Revenue Liabilities
    if (to === 'CONFIRMED' && res.depositAmount > 0) {
      DeferredRevenueEngine.registerFutureDeposit(res.id, res.depositAmount, res.totalNights, res.businessDate)
    }

    // 2. Check-out launches the cross-departmental saga orchestrator
    if (to === 'CHECKED_OUT') {
      WorkflowRuntimeEngine.startCheckoutSaga(res.id, res.roomId, res.roomNumber, res.operatorId)
    }

    // 3. Late cancellations forfeits prepayments under Cancellation Penalty accounts
    if (to === 'CANCELLED' && (from === 'CONFIRMED' || from === 'PRE_ARRIVAL' || from === 'CHECKED_IN')) {
      if (res.depositAmount > 0) {
        try {
          DeferredRevenueEngine.handleEarlyCancellation(res.id, 'PENALTY', res.businessDate)
        } catch {
          // Deposit might have already been processed
        }
      }
    }
  }

  static getReservation(id: string): Reservation | undefined {
    return this.reservations.get(id)
  }

  static getReservations(): Reservation[] {
    return Array.from(this.reservations.values())
  }
}

export default ReservationLifecycleEngine;

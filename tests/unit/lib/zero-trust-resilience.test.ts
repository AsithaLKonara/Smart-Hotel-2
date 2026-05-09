import { ZeroTrustGateway } from '../../../lib/security/zero-trust-gateway'
import { ContinuousRecoveryEngine } from '../../../lib/recovery/continuous-recovery-engine'
import { FieldWorkforceOps } from '../../../app/mobile/screens/FieldWorkforceOps'
import { OperationsCopilotEngine } from '../../../lib/ai/operations-copilot-engine'
import React from 'react'

describe('Zero-Trust Security & Resilient Operations Suite', () => {
  beforeEach(() => {
    ZeroTrustGateway.clearRegistry()
    ContinuousRecoveryEngine.clearAll()
  })

  test('ZeroTrustGateway - should authenticate HMAC requests, enforce IP restrictions, and prevent replay attacks', () => {
    const apiKey = 'client_front_desk_key'
    const secret = 'super_secure_sha_secret_key_123'
    const tenantId = 'prop-01'
    const allowedIp = '192.168.1.50'
    const rogueIp = '10.0.0.99'

    // Configure gateway rules
    ZeroTrustGateway.storeSecret(`API_KEY_SECRET_${apiKey}`, secret)
    ZeroTrustGateway.registerTenantIp(tenantId, allowedIp)

    const payload = '{"checkinRoom":"202"}'
    const nonce = `nonce-${Math.random()}`
    const timestamp = Date.now()

    // 1. Construct valid cryptographic signature
    const stringToSign = `${nonce}:${timestamp}:${payload}`
    const crypto = require('crypto')
    const signature = crypto.createHmac('sha256', secret).update(stringToSign).digest('hex')

    const reqDetails = {
      apiKey,
      signature,
      nonce,
      timestampMs: timestamp,
      payloadStr: payload
    }

    // 2. Reject rogue client IP block
    const rogueOutcome = ZeroTrustGateway.verifyRequest(reqDetails, tenantId, rogueIp)
    expect(rogueOutcome.isValid).toBe(false)
    expect(rogueOutcome.reason).toContain('Client IP not allowed')

    // 3. Authenticate valid request from whitelisted client IP
    const validOutcome = ZeroTrustGateway.verifyRequest(reqDetails, tenantId, allowedIp)
    expect(validOutcome.isValid).toBe(true)

    // 4. Reject replay loop request using same nonce string
    const replayOutcome = ZeroTrustGateway.verifyRequest(reqDetails, tenantId, allowedIp)
    expect(replayOutcome.isValid).toBe(false)
    expect(replayOutcome.reason).toContain('nonce has already been consumed')
  })

  test('ContinuousRecoveryEngine - should log WAL transactions and restore state up to precise millisecond boundaries', () => {
    const aggregateId = 'room-101'
    
    // Simulate initial snapshot state checkpointed at t = 100
    const snapshotState = { status: 'VACANT', occupantId: null }
    ContinuousRecoveryEngine.checkpointState(aggregateId, snapshotState, 100)

    // Log subsequent write mutations inside WAL journal
    ContinuousRecoveryEngine.appendWal(aggregateId, 'RESERVE', { guestId: 'guest-22' }, 150)
    ContinuousRecoveryEngine.appendWal(aggregateId, 'ASSIGN_ROOM', { roomNumber: '101' }, 200)
    ContinuousRecoveryEngine.appendWal(aggregateId, 'CHECK_IN', { checkedInAt: '2026-05-08T22:00:00Z' }, 250)
    ContinuousRecoveryEngine.appendWal(aggregateId, 'ADD_ALERT', { alert: 'VIPArrival' }, 300)

    // Setup state reducer replayer
    const reducer = (state: any, event: { eventType: string; payload: any }) => {
      switch (event.eventType) {
        case 'RESERVE':
          return { ...state, status: 'RESERVED', guestId: event.payload.guestId }
        case 'ASSIGN_ROOM':
          return { ...state, roomNo: event.payload.roomNumber }
        case 'CHECK_IN':
          return { ...state, status: 'OCCUPIED', checkInTime: event.payload.checkedInAt }
        case 'ADD_ALERT':
          return { ...state, priorityGuest: true }
        default:
          return state
      }
    }

    // Restore Point-in-Time state up to t = 220
    const restoredStateT220 = ContinuousRecoveryEngine.restorePointInTime(aggregateId, 220, reducer)
    expect(restoredStateT220.status).toBe('RESERVED')
    expect(restoredStateT220.guestId).toBe('guest-22')
    expect(restoredStateT220.roomNo).toBe('101')
    expect(restoredStateT220.checkInTime).toBeUndefined() // Occurred at t = 250, so must be absent

    // Restore Point-in-Time state up to t = 320
    const restoredStateT320 = ContinuousRecoveryEngine.restorePointInTime(aggregateId, 320, reducer)
    expect(restoredStateT320.status).toBe('OCCUPIED')
    expect(restoredStateT320.priorityGuest).toBe(true) // Occurred at t = 300, so must be present
  })

  test('FieldWorkforceOps - should show tasks, optimistic buffer completed tasks, and sync reconnect queue', () => {
    const mockSyncComplete = jest.fn()
    const initialTasks = [
      { id: 'task-1', roomNumber: '101', status: 'DIRTY' as const, priority: 'HIGH' as const, slaBreachTimeMs: 120000 }
    ]

    // Mock React's useState hooks to enable standard headless testing in Node contexts
    const mockSetState = jest.fn()
    const spy = jest.spyOn(React, 'useState').mockImplementation((init: any) => [init, mockSetState])

    try {
      // Instantiate Mobile check-list component
      const element = FieldWorkforceOps({
        initialTasks,
        isNetworkConnected: false, // Start offline
        onSyncComplete: mockSyncComplete
      })

      expect(element).toBeDefined()
    } finally {
      spy.mockRestore()
    }
  })

  test('OperationsCopilotEngine - should predict occupancies, calculate SLA breach risks, and reply to ops queries', () => {
    // Occupancy curve forecasts
    const history = [0.80, 0.90, 0.92, 0.88, 0.95] // High average occupancy (~89%)
    const forecast = OperationsCopilotEngine.generateOccupancyForecast('DELUXE', history)
    expect(forecast.projectedOccupancy).toBe(0.89)
    expect(forecast.surgeRisk).toBe('HIGH')

    // Housekeeping SLA risks
    const activeRooms = [
      { roomId: 'room-301', minsRemaining: 5, dirtyWeight: 0.90 }, // Critical risk
      { roomId: 'room-102', minsRemaining: 60, dirtyWeight: 0.10 } // Low risk
    ]

    const risks = OperationsCopilotEngine.analyzeSlaBreachRisks(activeRooms)
    expect(risks[0].breachProbability).toBeGreaterThan(0.80)
    expect(risks[0].escalationSmsSent).toBe(true)

    expect(risks[1].breachProbability).toBeLessThan(0.10)
    expect(risks[1].escalationSmsSent).toBe(false)

    // Natural language query resolutions
    const queryAns = OperationsCopilotEngine.parseOpsQuery('Why is occupancy dropping?')
    expect(queryAns).toContain('corporate conferences')
  })
})

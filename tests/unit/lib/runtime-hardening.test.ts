import { WebSocketGateway } from '../../../lib/realtime/websocket-gateway'
import { PubSubEngine } from '../../../lib/realtime/pubsub-engine'
import { RedisLockCoordinator } from '../../../lib/distributed/redis-lock-coordinator'
import { LeaderElection } from '../../../lib/distributed/leader-election'
import { StripeGateway } from '../../../lib/integrations/stripe-gateway'
import { BookingComSync } from '../../../lib/integrations/bookingcom-sync'
import { TwilioService } from '../../../lib/integrations/twilio-service'
import { ChaosEngine } from '../../../lib/chaos/chaos-engine'
import { ImmutableAudit } from '../../../lib/governance/immutable-audit'

describe('Enterprise Runtime Hardening & Integrations Suite', () => {
  beforeEach(() => {
    WebSocketGateway.clearAll()
    RedisLockCoordinator.clearAll()
    LeaderElection.demoteLeadership()
    StripeGateway.clearRegistry()
    BookingComSync.clearAll()
    TwilioService.clearAll()
    ChaosEngine.reset()
    ImmutableAudit.clearAll()
  })

  test('WebSocketGateway - should register connection and prune stale clients on missed heartbeats', () => {
    const mockSend = jest.fn()
    const conn = WebSocketGateway.registerConnection('sock-101', 'user-john', 'HOUSEKEEPER', 'prop-01', mockSend)

    expect(WebSocketGateway.getActiveCount()).toBe(1)
    expect(conn.lastSeen).toBeDefined()

    // Simulate connection heartbeat ping update
    WebSocketGateway.registerHeartbeat('sock-101')

    // Simulate heartbeat timeout (e.g., threshold set to -10ms)
    const prunedIds = WebSocketGateway.pruneStaleSockets(-10)
    expect(prunedIds).toContain('sock-101')
    expect(WebSocketGateway.getActiveCount()).toBe(0)
  })

  test('WebSocketGateway - should replay offline checklist queue upon reconnect', async () => {
    const mockSend = jest.fn()
    WebSocketGateway.registerConnection('sock-102', 'user-clara', 'HOUSEKEEPER', 'prop-01', mockSend)

    const queue = [
      { action: 'task:complete', payload: { taskId: 'task-77' }, timestamp: new Date().toISOString() },
      { action: 'room:inspection', payload: { roomId: 'room-101' }, timestamp: new Date().toISOString() }
    ]

    const processed = await WebSocketGateway.replayOfflineQueue('sock-102', queue)
    expect(processed).toBe(2)
  })

  test('RedisLockCoordinator - should issue locks and reject stale database writes using fencing tokens', async () => {
    const lease1 = await RedisLockCoordinator.acquireLease('room-101', 'worker-A')
    expect(lease1.fencingToken).toBeDefined()

    // Attempting lease acquisition on same key must fail
    await expect(RedisLockCoordinator.acquireLease('room-101', 'worker-B')).rejects.toThrow('LEASE_ACQUISITION_FAILED')

    // Validate fencing token: token 500 is older than lease1 token, so it should be rejected
    const isStaleValid = RedisLockCoordinator.validateFencingToken('room-101', 500)
    expect(isStaleValid).toBe(false)

    // Current token is valid
    const isCurrentValid = RedisLockCoordinator.validateFencingToken('room-101', lease1.fencingToken)
    expect(isCurrentValid).toBe(true)
  })

  test('LeaderElection - should campaign, acquire leadership, and handle term heartbeats', async () => {
    const isLeader = await LeaderElection.campaignForLeadership('node-server-1')
    expect(isLeader).toBe(true)

    // Another node cannot steal active leadership
    const isLeader2 = await LeaderElection.campaignForLeadership('node-server-2')
    expect(isLeader2).toBe(false)
  })

  test('StripeGateway - should process incremental hold holds, partial captures, and verify webhook hmacs', async () => {
    const req = {
      id: 'tx-201',
      amount: 250.00,
      currency: 'USD',
      sourceToken: 'tok_visa',
      idempotencyKey: 'idem-stripe-201',
      propertyId: 'prop-01'
    }

    const tx = await StripeGateway.authorizeHold(req)
    expect(tx.status).toBe('AUTHORIZED')
    expect(tx.stripeChargeId).toBeDefined()

    // Partially capture amount
    const captured = await StripeGateway.capturePayment(tx.stripeChargeId, 200.00)
    expect(captured.status).toBe('CAPTURED')
    expect(captured.amount).toBe(200.00)

    // Verify Stripe SHA-256 Webhook Signatures
    const payload = '{"id":"evt_101"}'
    const secret = 'whsec_stripe_test'
    const timestamp = Math.floor(Date.now() / 1000).toString()
    
    // Construct valid signature
    const signed = `${timestamp}.${payload}`
    const sigValue = require('crypto').createHmac('sha256', secret).update(signed).digest('hex')
    const signatureHeader = `t=${timestamp},v1=${sigValue}`

    const isValid = StripeGateway.verifyWebhookSignature(payload, signatureHeader, secret)
    expect(isValid).toBe(true)
  })

  test('BookingComSync - should block rates breaching price floors and quarantine rate anomalies', async () => {
    const update = {
      propertyId: 'prop-01',
      roomTypeId: 'deluxe',
      date: '2026-05-09',
      availableRooms: 5,
      rateDollars: 15 // Breaches $30 brand price floor
    }

    await expect(BookingComSync.pushInventoryRates(update)).rejects.toThrow('OTA_RATE_FLOOR_BREACH')

    // Webhook ingestion: detect anomalous $0 booking rate, routing to Quarantine list
    const booking = {
      bookingId: 'booking-999',
      propertyId: 'prop-01',
      roomTypeId: 'deluxe',
      checkIn: '2026-05-09',
      ratePaid: 0 // Free room! Anomaly.
    }

    const outcome = await BookingComSync.ingestOtaReservation(booking)
    expect(outcome.status).toBe('QUARANTINED')

    const quarantined = BookingComSync.getQuarantined('booking-999')
    expect(quarantined).toBeDefined()
    expect(quarantined?.reason).toContain('RESERVATION_RATE_ANOMALY')
  })

  test('TwilioService - should send messages and blacklist previously bounced numbers', async () => {
    const sms = {
      messageId: 'sms-10',
      toPhone: '+94771234567',
      body: 'Your room 101 is cleaned and ready for check-in.',
      retryCount: 0
    }

    await expect(TwilioService.sendSms(sms)).resolves.toBe(true)

    // Register bounce and verify blocked attempts
    TwilioService.registerBounceNumber('+94771234567')
    await expect(TwilioService.sendSms(sms)).rejects.toThrow('SMS_DELIVERY_BLOCKED')
  })

  test('ChaosEngine - should store fail configurations and trigger latency hooks', async () => {
    ChaosEngine.setChaosProfile({ injectLatencyMs: 5, failRedisLocks: true })

    expect(ChaosEngine.shouldFailLock()).toBe(true)

    const start = Date.now()
    await ChaosEngine.executeLatencyHook()
    expect(Date.now() - start).toBeGreaterThanOrEqual(4)
  })

  test('ImmutableAudit - should block-sign postings, link blockchain hashes, and detect ledger tamper', () => {
    const lines1 = [
      { accountCode: '1010', debit: 120.00, credit: 0 },
      { accountCode: '4010', debit: 0, credit: 120.00 }
    ]

    const block1 = ImmutableAudit.appendJournalBlock('batch-01', 'prop-01', '2026-05-08', lines1)
    expect(block1.sequenceNumber).toBe(1)
    expect(block1.previousBlockHash).toBe('0000000000000000000000000000000000000000000000000000000000000000')

    const lines2 = [
      { accountCode: '1010', debit: 50.00, credit: 0 },
      { accountCode: '4010', debit: 0, credit: 50.00 }
    ]

    const block2 = ImmutableAudit.appendJournalBlock('batch-02', 'prop-01', '2026-05-08', lines2)
    expect(block2.sequenceNumber).toBe(2)
    expect(block2.previousBlockHash).toBe(block1.blockHash)

    // Verify initial chain integrity
    let auditOutcome = ImmutableAudit.verifyChainIntegrity()
    expect(auditOutcome.isValid).toBe(true)

    // Force-corrupt ledger: alter block 1 signature to simulate fraud attempt
    ImmutableAudit.forceCorruptBlock(1, 'tampered-hash-value-123')
    
    // Integrity validator must immediately intercept corrupt block links
    auditOutcome = ImmutableAudit.verifyChainIntegrity()
    expect(auditOutcome.isValid).toBe(false)
  })
})

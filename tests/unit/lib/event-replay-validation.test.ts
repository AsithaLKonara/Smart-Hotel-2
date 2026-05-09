import { EventSourcedEngine, SourcedEvent } from '../../../lib/event-sourced-engine'

// Define a simple Room state interface and apply function for tests
interface MockRoomState {
  id: string
  status: 'VACANT' | 'DIRTY' | 'OCCUPIED'
  housekeeper?: string
}

function applyRoomEvent(state: MockRoomState, event: SourcedEvent): MockRoomState {
  switch (event.eventType) {
    case 'ROOM_CHECKED_IN':
      return { ...state, status: 'OCCUPIED' }
    case 'ROOM_CLEAN_ASSIGNED':
      return { ...state, status: 'DIRTY', housekeeper: event.payload.housekeeper }
    case 'ROOM_CLEAN_COMPLETED':
      return { ...state, status: 'VACANT', housekeeper: undefined }
    default:
      return state
  }
}

describe('Projection Recovery & Event Replay Validation', () => {
  beforeEach(() => {
    EventSourcedEngine.clearJournal()
  })

  test('should record and rebuild projection cleanly from sequence of events', () => {
    const aggregateId = 'room-101'
    
    // 1. Post CheckIn
    EventSourcedEngine.recordEvent(aggregateId, 'ROOM', 'ROOM_CHECKED_IN', {}, 'reception_bot')
    // 2. Assign cleaner
    EventSourcedEngine.recordEvent(aggregateId, 'ROOM', 'ROOM_CLEAN_ASSIGNED', { housekeeper: 'Alice' }, 'house_bot')

    const initial: MockRoomState = { id: 'room-101', status: 'VACANT' }
    const state = EventSourcedEngine.rebuildStateProjection<MockRoomState>(aggregateId, applyRoomEvent, initial)

    expect(state.status).toBe('DIRTY')
    expect(state.housekeeper).toBe('Alice')
  })

  test('should throw error and trigger alert when sequence gap is detected', () => {
    const aggregateId = 'room-102'

    // Record Event 1
    EventSourcedEngine.recordEvent(aggregateId, 'ROOM', 'ROOM_CHECKED_IN', {}, 'reception_bot')
    
    // Manually push an event with index 3 (skipping 2) to simulate data corruption or sequence gap
    const corruptedEvent: SourcedEvent = {
      id: `evt-${aggregateId}-3-corrupted`,
      aggregateId,
      aggregateType: 'ROOM',
      sequence: 3,
      eventType: 'ROOM_CLEAN_COMPLETED',
      payload: {},
      actor: 'corrupt_bot',
      timestamp: new Date().toISOString()
    }
    EventSourcedEngine.injectCorruptedEvent(corruptedEvent)

    const initial: MockRoomState = { id: 'room-102', status: 'VACANT' }
    
    expect(() => {
      EventSourcedEngine.rebuildStateProjection<MockRoomState>(aggregateId, applyRoomEvent, initial)
    }).toThrow('State rebuild failed: Detected sequence gap')
  })

  test('should successfully save and load snapshots to speed up projection building', () => {
    const aggregateId = 'room-103'

    // Seq 1 & 2
    EventSourcedEngine.recordEvent(aggregateId, 'ROOM', 'ROOM_CHECKED_IN', {}, 'rec_bot')
    EventSourcedEngine.recordEvent(aggregateId, 'ROOM', 'ROOM_CLEAN_ASSIGNED', { housekeeper: 'Bob' }, 'house_bot')

    // Save snapshot at Seq 2
    const initial: MockRoomState = { id: 'room-103', status: 'VACANT' }
    const intermediateState = EventSourcedEngine.rebuildStateProjection<MockRoomState>(aggregateId, applyRoomEvent, initial)
    EventSourcedEngine.saveSnapshot<MockRoomState>(aggregateId, 2, intermediateState)

    // Record Seq 3 (post-snapshot)
    EventSourcedEngine.recordEvent(aggregateId, 'ROOM', 'ROOM_CLEAN_COMPLETED', {}, 'house_bot')

    // Rebuild using snapshot optimizer
    const finalState = EventSourcedEngine.rebuildStateWithSnapshot<MockRoomState>(aggregateId, applyRoomEvent, initial)

    expect(finalState.status).toBe('VACANT')
    expect(finalState.housekeeper).toBeUndefined()
  })

  test('should perform validation audit and report when state drift occurs', () => {
    const aggregateId = 'room-104'

    // Seq 1 & 2
    EventSourcedEngine.recordEvent(aggregateId, 'ROOM', 'ROOM_CHECKED_IN', {}, 'rec_bot')
    const finalEvent = EventSourcedEngine.recordEvent(aggregateId, 'ROOM', 'ROOM_CLEAN_ASSIGNED', { housekeeper: 'Charlie' }, 'house_bot')

    const initial: MockRoomState = { id: 'room-104', status: 'VACANT' }
    const actualState = EventSourcedEngine.rebuildStateProjection<MockRoomState>(aggregateId, applyRoomEvent, initial)
    
    // Save snapshot
    const snapshot = EventSourcedEngine.saveSnapshot<MockRoomState>(aggregateId, 2, actualState)

    // Audit validates perfectly when state is matching
    const healthyCheck = EventSourcedEngine.validateReplayChecksum<MockRoomState>(aggregateId, applyRoomEvent, initial)
    expect(healthyCheck.isDrifted).toBe(false)

    // Intentionally corrupt the saved snapshot in-memory to simulate a drift (unauthorized data alteration)
    snapshot.state.housekeeper = 'EVE_THE_HACKER'
    snapshot.checksum = EventSourcedEngine.generateChecksum(snapshot.state)

    // Re-verify: Validation must detect the alteration (drift === true)
    const driftCheck = EventSourcedEngine.validateReplayChecksum<MockRoomState>(aggregateId, applyRoomEvent, initial)
    expect(driftCheck.isDrifted).toBe(true)
    expect(driftCheck.actualChecksum).not.toBe(snapshot.checksum)
  })
})

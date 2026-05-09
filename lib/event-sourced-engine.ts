import { eventBus } from './event-bus'

export interface SourcedEvent {
  id: string
  aggregateId: string // e.g. "room-204"
  aggregateType: 'ROOM' | 'KDS' | 'INCIDENT'
  sequence: number
  eventType: string
  payload: any
  actor: string
  timestamp: string
}

export interface ProjectionSnapshot<T> {
  aggregateId: string
  sequence: number
  state: T
  checksum: string
  timestamp: string
}

export class EventSourcedEngine {
  private static eventJournal: SourcedEvent[] = []
  private static sequenceTrackers: Map<string, number> = new Map()
  private static snapshots: Map<string, ProjectionSnapshot<any>> = new Map()

  // Reset/Clear the journal for testing
  static clearJournal(): void {
    this.eventJournal = []
    this.sequenceTrackers.clear()
    this.snapshots.clear()
  }

  // Generate a deterministic checksum of state
  static generateChecksum(state: any): string {
    if (!state) return 'SHA256-SIM-0'
    const sortedStr = JSON.stringify(state, Object.keys(state).sort())
    let hash = 0
    for (let i = 0; i < sortedStr.length; i++) {
      hash = (hash + sortedStr.charCodeAt(i)) % 1000000
    }
    return `SHA256-SIM-${hash}`
  }

  // Record an immutable event in the journal
  static recordEvent(
    aggregateId: string,
    aggregateType: 'ROOM' | 'KDS' | 'INCIDENT',
    eventType: string,
    payload: any,
    actor: string
  ): SourcedEvent {
    const currentSeq = this.sequenceTrackers.get(aggregateId) || 0
    const nextSeq = currentSeq + 1
    this.sequenceTrackers.set(aggregateId, nextSeq)

    const event: SourcedEvent = {
      id: `evt-${aggregateId}-${nextSeq}-${Date.now()}`,
      aggregateId,
      aggregateType,
      sequence: nextSeq,
      eventType,
      payload,
      actor,
      timestamp: new Date().toISOString()
    }

    this.eventJournal.push(event)

    // Emit event onto global bus
    eventBus.emit({
      id: `sourced-${event.id}`,
      type: `sourced.${eventType.toLowerCase()}`,
      severity: 'INFO',
      title: `Event Sourced: ${eventType}`,
      message: `Aggregate ${aggregateId} reached sequence ${nextSeq}.`,
      metadata: { ...event },
      timestamp: event.timestamp
    })

    return event
  }

  // Save a state snapshot for quick recovery
  static saveSnapshot<T>(aggregateId: string, sequence: number, state: T): ProjectionSnapshot<T> {
    const checksum = this.generateChecksum(state)
    const snapshot: ProjectionSnapshot<T> = {
      aggregateId,
      sequence,
      state: JSON.parse(JSON.stringify(state)), // Deep clone state
      checksum,
      timestamp: new Date().toISOString()
    }

    this.snapshots.set(aggregateId, snapshot)

    eventBus.emit({
      id: `snapshot-${aggregateId}-${sequence}-${Date.now()}`,
      type: 'sourced.snapshot_saved',
      severity: 'INFO',
      title: `Snapshot Saved: ${aggregateId}`,
      message: `Saved snapshot of ${aggregateId} at sequence ${sequence} with checksum ${checksum}.`,
      metadata: { ...snapshot },
      timestamp: snapshot.timestamp
    })

    return snapshot
  }

  static getSnapshot<T>(aggregateId: string): ProjectionSnapshot<T> | undefined {
    return this.snapshots.get(aggregateId) as ProjectionSnapshot<T> | undefined
  }

  // SRE Validation check: Detect sequence gaps
  static checkSequenceGaps(events: SourcedEvent[]): { hasGap: boolean; missingSequence?: number } {
    if (events.length === 0) return { hasGap: false }
    
    // Sort events by sequence to make sure gap checking is accurate
    const sorted = [...events].sort((a, b) => a.sequence - b.sequence)
    
    // Check initial sequence
    if (sorted[0].sequence !== 1) {
      return { hasGap: true, missingSequence: 1 }
    }

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].sequence !== sorted[i - 1].sequence + 1) {
        return { hasGap: true, missingSequence: sorted[i - 1].sequence + 1 }
      }
    }

    return { hasGap: false }
  }

  // Replay logs and build state projection dynamically
  static rebuildStateProjection<T>(
    aggregateId: string,
    applyEvent: (state: T, event: SourcedEvent) => T,
    initialState: T
  ): T {
    const relevantEvents = this.eventJournal.filter(e => e.aggregateId === aggregateId)
    
    // Check sequence sequentiality first
    const gapCheck = this.checkSequenceGaps(relevantEvents)
    if (gapCheck.hasGap) {
      eventBus.emit({
        id: `seq-gap-${aggregateId}-${Date.now()}`,
        type: 'sourced.sequence_gap_detected',
        severity: 'CRITICAL',
        title: `Sequence Gap Alert: ${aggregateId}`,
        message: `Missing sequence ${gapCheck.missingSequence} in event log. State rebuilding aborted.`,
        metadata: { aggregateId, missingSequence: gapCheck.missingSequence },
        timestamp: new Date().toISOString()
      })
      throw new Error(`State rebuild failed: Detected sequence gap in event journal for [${aggregateId}]. Missing: ${gapCheck.missingSequence}`)
    }

    let state = initialState
    for (const event of relevantEvents) {
      state = applyEvent(state, event)
    }

    return state
  }

  // Rebuild state starting from the latest snapshot (optimized projection recovery)
  static rebuildStateWithSnapshot<T>(
    aggregateId: string,
    applyEvent: (state: T, event: SourcedEvent) => T,
    initialState: T
  ): T {
    const snapshot = this.getSnapshot<T>(aggregateId)
    if (!snapshot) {
      return this.rebuildStateProjection(aggregateId, applyEvent, initialState)
    }

    let state = snapshot.state
    const relevantEvents = this.eventJournal
      .filter(e => e.aggregateId === aggregateId && e.sequence > snapshot.sequence)
      .sort((a, b) => a.sequence - b.sequence)

    // Check sequence sequentiality from snapshot onwards
    const allEvents = this.eventJournal.filter(e => e.aggregateId === aggregateId)
    const gapCheck = this.checkSequenceGaps(allEvents)
    if (gapCheck.hasGap) {
      throw new Error(`State rebuild failed: Sequence gap detected in log for [${aggregateId}].`)
    }

    for (const event of relevantEvents) {
      state = applyEvent(state, event)
    }

    return state
  }

  // Deterministic Validation: Checks for state/projection drift
  static validateReplayChecksum<T>(
    aggregateId: string,
    applyEvent: (state: T, event: SourcedEvent) => T,
    initialState: T
  ): { isDrifted: boolean; expectedChecksum: string; actualChecksum: string } {
    const snapshot = this.getSnapshot<T>(aggregateId)
    if (!snapshot) {
      throw new Error(`Validation failed: No active projection snapshot found for [${aggregateId}].`)
    }

    // Replay full events from 1 to snapshot.sequence
    const fullReplayedEvents = this.eventJournal
      .filter(e => e.aggregateId === aggregateId && e.sequence <= snapshot.sequence)
      .sort((a, b) => a.sequence - b.sequence)

    let replayedState = initialState
    for (const event of fullReplayedEvents) {
      replayedState = applyEvent(replayedState, event)
    }

    const replayedChecksum = this.generateChecksum(replayedState)
    const isDrifted = replayedChecksum !== snapshot.checksum

    if (isDrifted) {
      eventBus.emit({
        id: `drift-alert-${aggregateId}-${Date.now()}`,
        type: 'sourced.projection_drift_detected',
        severity: 'CRITICAL',
        title: `State Drift Alarm: ${aggregateId}`,
        message: `Projection drift detected! Snapshot checksum ${snapshot.checksum} does not match replay checksum ${replayedChecksum}.`,
        metadata: { aggregateId, snapshotSeq: snapshot.sequence, snapshotChecksum: snapshot.checksum, replayedChecksum },
        timestamp: new Date().toISOString()
      })
    }

    return {
      isDrifted,
      expectedChecksum: snapshot.checksum,
      actualChecksum: replayedChecksum
    }
  }

  static getJournal(): SourcedEvent[] {
    return [...this.eventJournal]
  }

  // Test helper to inject direct events to simulate journal corruption or gaps
  static injectCorruptedEvent(event: SourcedEvent): void {
    this.eventJournal.push(event)
  }
}

export default EventSourcedEngine;

import crypto from 'crypto'

export interface StateCheckResult {
  aggregateId: string
  recalculatedStateHash: string
  projectionStateHash: string
  synchronized: boolean
}

export class CorruptionDetection {
  // Executes a comprehensive cryptographic audit comparing raw event log streams against active read model projections
  static executeProjectionValidationSweep(
    aggregateId: string,
    rawEventHistory: Array<{ eventType: string; payload: any }>,
    activeProjectionState: any,
    stateRebuildReducer: (state: any, event: { eventType: string; payload: any }) => any
  ): StateCheckResult {
    // 1. Rebuild the aggregate's absolute source-of-truth state from raw events
    let sourceOfTruthState = {}
    for (const event of rawEventHistory) {
      sourceOfTruthState = stateRebuildReducer(sourceOfTruthState, event)
    }

    // 2. Compute SHA-256 cryptographic hashes for comparison
    const truthStr = JSON.stringify(sourceOfTruthState)
    const projectionStr = JSON.stringify(activeProjectionState)

    const recalculatedStateHash = crypto.createHash('sha256').update(truthStr).digest('hex')
    const projectionStateHash = crypto.createHash('sha256').update(projectionStr).digest('hex')

    return {
      aggregateId,
      recalculatedStateHash,
      projectionStateHash,
      synchronized: recalculatedStateHash === projectionStateHash
    }
  }

  // Detects silent write errors or out-of-order temporal propagation lag
  static auditFullSystemState(
    aggregates: Array<{
      aggregateId: string
      rawEvents: Array<{ eventType: string; payload: any }>
      projection: any
    }>,
    reducer: (state: any, event: { eventType: string; payload: any }) => any
  ): { totalAudited: number; silentFailuresCount: number; corruptedIds: string[] } {
    let silentFailuresCount = 0
    const corruptedIds: string[] = []

    for (const agg of aggregates) {
      const sweep = this.executeProjectionValidationSweep(agg.aggregateId, agg.rawEvents, agg.projection, reducer)
      if (!sweep.synchronized) {
        silentFailuresCount++
        corruptedIds.push(agg.aggregateId)
      }
    }

    return {
      totalAudited: aggregates.length,
      silentFailuresCount,
      corruptedIds
    }
  }
}

export default CorruptionDetection

export interface RegionRoute {
  propertyId: string
  preferredRegion: 'US' | 'EU'
}

export interface ReconcileDecision {
  reservationId: string
  winnerRegion: string
  fencingToken: number
  status: 'RECONCILED' | 'REJECTED'
}

export class MultiRegionCoordinator {
  private static propertyRoutingTable = new Map<string, 'US' | 'EU'>()
  private static globalFencingTracker = new Map<string, number>() // Tracks maximum fencing token per reservation

  static registerPropertyRoute(propertyId: string, region: 'US' | 'EU'): void {
    this.propertyRoutingTable.set(propertyId, region)
  }

  // Routes requests geographically based on the propertyId boundary
  static getRouteRegion(propertyId: string): 'US' | 'EU' {
    return this.propertyRoutingTable.get(propertyId) || 'US'
  }

  // Directs strong vs. eventual consistency behaviors per transaction domain
  static evaluateConsistencyLevel(domain: 'LEDGER' | 'PAYMENTS' | 'DISPATCH_HOUSEKEEPING'): 'STRONG' | 'EVENTUAL' {
    if (domain === 'LEDGER' || domain === 'PAYMENTS') {
      return 'STRONG' // Absolutely zero financial drifts or partial payment captures permitted
    }
    return 'EVENTUAL' // Task dispatches can synchronize eventually over stateless nodes
  }

  // Reconciles simultaneous cross-region booking transactions using fencing clock checks
  static reconcileCrossRegionBookingRace(
    reservationId: string,
    region: 'US' | 'EU',
    fencingToken: number
  ): ReconcileDecision {
    const currentMaxToken = this.globalFencingTracker.get(reservationId) || 0

    // Rule: Fencing tokens must increase monotonically; smaller tokens denote stale out-of-order writes
    if (fencingToken > currentMaxToken) {
      this.globalFencingTracker.set(reservationId, fencingToken)
      return {
        reservationId,
        winnerRegion: region,
        fencingToken,
        status: 'RECONCILED'
      }
    }

    return {
      reservationId,
      winnerRegion: currentMaxToken === fencingToken ? 'US' : 'CONFLICT_RESOLVED', // Tiebreaker defaults to US node
      fencingToken,
      status: 'REJECTED'
    }
  }

  static clearTables(): void {
    this.propertyRoutingTable.clear()
    this.globalFencingTracker.clear()
  }
}

export default MultiRegionCoordinator

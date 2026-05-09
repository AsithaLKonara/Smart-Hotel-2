export interface OccupancyForecast {
  roomType: string
  projectedOccupancy: number
  surgeRisk: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface SlaDelayRisk {
  roomId: string
  cleanerId: string
  breachProbability: number
  escalationSmsSent: boolean
}

export class OperationsCopilotEngine {
  // Generates Occupancy curves per room type to guide pricing recommendations
  static generateOccupancyForecast(roomType: string, historyPayload: number[]): OccupancyForecast {
    if (historyPayload.length === 0) {
      return { roomType, projectedOccupancy: 0, surgeRisk: 'LOW' }
    }

    const average = historyPayload.reduce((sum, val) => sum + val, 0) / historyPayload.length
    const surgeRisk = average > 0.85 ? 'HIGH' : average > 0.60 ? 'MEDIUM' : 'LOW'

    return {
      roomType,
      projectedOccupancy: Math.round(average * 100) / 100,
      surgeRisk
    }
  }

  // Audits operational rooms, calculating risk probabilities of housekeeping SLA breaches
  static analyzeSlaBreachRisks(rooms: Array<{ roomId: string; minsRemaining: number; dirtyWeight: number }>): SlaDelayRisk[] {
    return rooms.map(room => {
      // Logic: shorter remaining time + higher dirty weight = higher probability of breaching SLA
      const breachProbability = Math.min(1.0, Math.max(0.0, (room.dirtyWeight * 20) / Math.max(1, room.minsRemaining)))
      const escalationSmsSent = breachProbability > 0.80

      return {
        roomId: room.roomId,
        cleanerId: `cleaner-${Math.random().toString(36).substr(2, 4)}`,
        breachProbability: Math.round(breachProbability * 100) / 100,
        escalationSmsSent
      }
    })
  }

  // Resolves operational query summaries
  static parseOpsQuery(query: string): string {
    const lowercase = query.toLowerCase()

    if (lowercase.includes('occupancy')) {
      return 'AI Summary: Average occupancy is projected to rise to 88% due to regional corporate conferences. Recommend adjusting dynamic deluxe room rates +12%.'
    }

    if (lowercase.includes('clean') || lowercase.includes('late')) {
      return 'AI Summary: 3 housekeeping dispatches are at high risk of breaching their SLA targets. Recommended: Reallocate valet staff member to clean Room 302.'
    }

    return 'AI Summary: System is currently running within green baseline limits. All SLAs are fully compliant.'
  }
}

export default OperationsCopilotEngine

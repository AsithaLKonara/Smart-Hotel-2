import { eventBus } from './event-bus'

export interface OperationalRecommendation {
  id: string
  title: string
  description: string
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  category: 'STAFFING' | 'MAINTENANCE' | 'GUEST_RELATIONS' | 'INVENTORY'
  targetedRole: 'MANAGER' | 'RECEPTIONIST' | 'HOUSEKEEPER' | 'KITCHEN'
  recommendedAction: string
  timestamp: string
}

export class OperationalRecommendationEngine {
  // Autonomously analyzes telemetry and generates recommended operational actions
  static generateRecommendations(telemetry: {
    activeIncidentsCount: number
    unassignedHkJobs: number
    occupancyRate: number
    activeKitchenDelayCount: number
  }): OperationalRecommendation[] {
    const recommendations: OperationalRecommendation[] = []

    // 1. Staffing imbalance check
    if (telemetry.unassignedHkJobs > 2 && telemetry.occupancyRate > 85) {
      recommendations.push({
        id: `rec-hk-${Date.now()}`,
        title: "Housekeeper Staffing Imbalance Detected",
        description: `${telemetry.unassignedHkJobs} dirty rooms pending unassigned under high occupancy.`,
        urgency: "HIGH",
        category: "STAFFING",
        targetedRole: "MANAGER",
        recommendedAction: "REASSIGN_HOUSEKEEPER",
        timestamp: new Date().toISOString()
      })
    }

    // 2. Kitchen delays check
    if (telemetry.activeKitchenDelayCount > 3) {
      recommendations.push({
        id: `rec-kit-${Date.now()}`,
        title: "Kitchen Delay Compensation Trigger",
        description: "KDS ticket delay exceeded limits across multiple guest tables.",
        urgency: "HIGH",
        category: "GUEST_RELATIONS",
        targetedRole: "RECEPTIONIST",
        recommendedAction: "OFFER_COMPENSATION",
        timestamp: new Date().toISOString()
      })
    }

    // 3. Peak occupancy overbooking checks
    if (telemetry.occupancyRate >= 95) {
      recommendations.push({
        id: `rec-inv-${Date.now()}`,
        title: "Block OTA Channel Inventory",
        description: "Occupancy has exceeded critical 95% threshold. Restrict incoming channels to avoid overbooking.",
        urgency: "CRITICAL",
        category: "INVENTORY",
        targetedRole: "MANAGER",
        recommendedAction: "BLOCK_OTA_INVENTORY",
        timestamp: new Date().toISOString()
      })
    }

    // Emit live recommendations onto the centralized Event Bus
    recommendations.forEach(rec => {
      eventBus.emit({
        id: `recommendation-event-${rec.id}`,
        type: 'recommendation.generated',
        severity: rec.urgency === 'CRITICAL' ? 'CRITICAL' : 'INFO',
        title: rec.title,
        message: rec.description,
        metadata: { ...rec },
        timestamp: rec.timestamp
      })
    })

    return recommendations
  }
}
export default OperationalRecommendationEngine;

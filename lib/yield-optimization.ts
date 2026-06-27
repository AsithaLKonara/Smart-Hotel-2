import { eventBus } from './event-bus'

export interface YieldRecommendation {
  recommendedPrice: number
  multiplier: number
  appliedRules: string[]
  demandElasticity: number
  minLOS: number
  maxLOS: number
  timestamp: string
}

export class YieldOptimizationEngine {
  
  // Calculate demand elasticity: Inelastic (< 1.0) means we can increase price with low drop in demand
  static calculateDemandElasticity(occupancyRate: number): number {
    if (occupancyRate < 0 || occupancyRate > 1.0) {
      throw new Error('Occupancy rate must be a float between 0.0 and 1.0.')
    }

    if (occupancyRate >= 0.85) {
      return 0.35 // Highly Inelastic (High room compression, raise prices)
    } else if (occupancyRate >= 0.70) {
      return 0.65 // Moderately Inelastic
    } else if (occupancyRate >= 0.40) {
      return 1.00 // Unitary Elasticity
    } else {
      return 1.80 // Highly Elastic (Price sensitive, offer discounts to drive volume)
    }
  }

  // Calculate dynamic pricing based on DB-backed rules and competitor ingest
  static async calculateDynamicPrice(
    basePrice: number,
    occupancyRate: number,
    daysToArrival: number,
    dayOfWeek: 'weekday' | 'weekend',
    competitorAveragePrice?: number
  ): Promise<{ recommendedPrice: number; multiplier: number; appliedRules: string[] }> {
    if (basePrice <= 0) {
      throw new Error('Base price must be strictly positive.')
    }

    let multiplier = 1.0
    const appliedRules: string[] = []
    
    // Dynamic import to avoid circular dependencies if any
    const prisma = (await import('./db')).default

    // Fetch active rules from the database
    const rules = await prisma.yieldRule.findMany({
      where: { isActive: true }
    })

    for (const rule of rules) {
      if (rule.adjustmentType === 'DYNAMIC_TIER') {
        const meetsMin = rule.minOccupancy === null || occupancyRate >= rule.minOccupancy;
        const meetsMax = rule.maxOccupancy === null || occupancyRate <= rule.maxOccupancy;
        
        if (meetsMin && meetsMax) {
          multiplier += (rule.adjustmentValue / 100);
          appliedRules.push(`DB: ${rule.name}`);
        }
      }
    }

    // Retain legacy heuristics for Booking Window (Urgency)
    if (daysToArrival >= 30) {
      multiplier -= 0.10 // Early bird discount
      appliedRules.push('EARLY_BIRD_INCENTIVE')
    } else if (daysToArrival < 3) {
      if (occupancyRate >= 0.65) {
        multiplier += 0.15 // Last-minute premium
        appliedRules.push('LAST_MINUTE_PREMIUM')
      }
    }

    if (dayOfWeek === 'weekend') {
      multiplier += 0.10
      appliedRules.push('WEEKEND_PREMIUM')
    }

    // Ensure multiplier never crashes below 0.50 (minimum viable rate)
    multiplier = Math.max(0.50, parseFloat(multiplier.toFixed(2)))
    let recommendedPrice = Math.round(basePrice * multiplier * 100) / 100
    
    // Enforce Competitor Parity Cap (if ingest provided)
    if (competitorAveragePrice && recommendedPrice > competitorAveragePrice) {
      recommendedPrice = competitorAveragePrice
      appliedRules.push('COMPETITOR_PARITY_CAP')
      multiplier = recommendedPrice / basePrice
    }

    return {
      recommendedPrice,
      multiplier,
      appliedRules
    }
  }

  // Safe statistical overbooking buffer: computes ideal overbook threshold in line with cancellation patterns
  static calculateOverbookingBuffer(
    totalRooms: number,
    historicalCancellationRate: number, // float e.g. 0.12 (12%)
    confidenceLevel: number // percentage e.g. 95 (95% confidence)
  ): { safeBuffer: number; riskRating: 'LOW' | 'MEDIUM' | 'HIGH'; recommendedRoomsToOverbook: number } {
    if (historicalCancellationRate < 0 || historicalCancellationRate > 1.0) {
      throw new Error('Cancellation rate must be a float between 0.0 and 1.0.')
    }

    // Standard hospitality statistical overbooking model:
    // Expected cancellations = totalRooms * cancellationRate
    const expectedCancellations = totalRooms * historicalCancellationRate
    
    // safeBuffer standard adjustment: expected * confidence factor
    const confidenceFactor = confidenceLevel / 100
    const safeBuffer = Math.floor(expectedCancellations * confidenceFactor)

    let riskRating: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
    if (safeBuffer > totalRooms * 0.10) {
      riskRating = 'HIGH'
    } else if (safeBuffer > totalRooms * 0.05) {
      riskRating = 'MEDIUM'
    }

    return {
      safeBuffer,
      riskRating,
      recommendedRoomsToOverbook: safeBuffer
    }
  }

  // Length of Stay (LOS) constraints builder
  static recommendLengthOfStayLimit(occupancyRate: number): { minLOS: number; maxLOS: number; reason: string } {
    if (occupancyRate >= 0.85) {
      return {
        minLOS: 3,
        maxLOS: 14,
        reason: 'High occupancy compression. Setting minimum 3-night length of stay constraint to maximize property yield.'
      }
    } else if (occupancyRate >= 0.65) {
      return {
        minLOS: 2,
        maxLOS: 21,
        reason: 'Moderate compression. Setting minimum 2-night length of stay.'
      }
    } else {
      return {
        minLOS: 1,
        maxLOS: 30,
        reason: 'Low demand period. No stay constraints applied.'
      }
    }
  }

  // Full Orchestration Endpoint Recommendation
  static async generateOptimizationRecommendation(
    roomType: string,
    basePrice: number,
    occupancyRate: number,
    daysToArrival: number,
    dayOfWeek: 'weekday' | 'weekend',
    totalRooms: number,
    historicalCancellationRate = 0.10,
    competitorAveragePrice?: number
  ): Promise<YieldRecommendation> {
    const demandElasticity = this.calculateDemandElasticity(occupancyRate)
    const pricing = await this.calculateDynamicPrice(basePrice, occupancyRate, daysToArrival, dayOfWeek, competitorAveragePrice)
    const los = this.recommendLengthOfStayLimit(occupancyRate)

    const recommendation: YieldRecommendation = {
      recommendedPrice: pricing.recommendedPrice,
      multiplier: pricing.multiplier,
      appliedRules: pricing.appliedRules,
      demandElasticity,
      minLOS: los.minLOS,
      maxLOS: los.maxLOS,
      timestamp: new Date().toISOString()
    }

    eventBus.emit({
      id: `yield-rec-${roomType}-${Date.now()}`,
      type: 'yield.recommendation_generated',
      severity: 'INFO',
      title: `Yield recommendation: ${roomType}`,
      message: `Generated yield recommendation for ${roomType}. Price: $${pricing.recommendedPrice} (x${pricing.multiplier}). Elasticity: ${demandElasticity}.`,
      metadata: { roomType, basePrice, occupancyRate, ...recommendation },
      timestamp: recommendation.timestamp
    })

    return recommendation
  }
}

export default YieldOptimizationEngine;

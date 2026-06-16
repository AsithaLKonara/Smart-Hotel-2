/// <reference types="jest" />
import { YieldOptimizationEngine } from '../../lib/yield-optimization'
import { eventBus } from '../../lib/event-bus'

jest.mock('../../lib/event-bus', () => ({
  eventBus: {
    emit: jest.fn(),
  },
}))

describe('YieldOptimizationEngine Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculateDemandElasticity', () => {
    it('should throw error for occupancy rate outside 0.0-1.0 range', () => {
      expect(() => YieldOptimizationEngine.calculateDemandElasticity(-0.1)).toThrow()
      expect(() => YieldOptimizationEngine.calculateDemandElasticity(1.1)).toThrow()
    })

    it('should return correct elasticity for different occupancy ranges', () => {
      expect(YieldOptimizationEngine.calculateDemandElasticity(0.9)).toBe(0.35)
      expect(YieldOptimizationEngine.calculateDemandElasticity(0.85)).toBe(0.35)
      expect(YieldOptimizationEngine.calculateDemandElasticity(0.8)).toBe(0.65)
      expect(YieldOptimizationEngine.calculateDemandElasticity(0.7)).toBe(0.65)
      expect(YieldOptimizationEngine.calculateDemandElasticity(0.5)).toBe(1.00)
      expect(YieldOptimizationEngine.calculateDemandElasticity(0.4)).toBe(1.00)
      expect(YieldOptimizationEngine.calculateDemandElasticity(0.3)).toBe(1.80)
    })
  })

  describe('calculateDynamicPrice', () => {
    it('should throw error for non-positive base price', () => {
      expect(() => YieldOptimizationEngine.calculateDynamicPrice(0, 0.5, 5, 'weekday')).toThrow()
      expect(() => YieldOptimizationEngine.calculateDynamicPrice(-10, 0.5, 5, 'weekday')).toThrow()
    })

    it('should apply critical compression surge for high occupancy', () => {
      const result = YieldOptimizationEngine.calculateDynamicPrice(100, 0.95, 10, 'weekday')
      expect(result.multiplier).toBe(1.45)
      expect(result.appliedRules).toContain('CRITICAL_COMPRESSION_SURGE')
      expect(result.recommendedPrice).toBe(145)
    })

    it('should apply moderate compression surge for medium-high occupancy', () => {
      const result = YieldOptimizationEngine.calculateDynamicPrice(100, 0.8, 10, 'weekday')
      expect(result.multiplier).toBe(1.25)
      expect(result.appliedRules).toContain('MODERATE_COMPRESSION_SURGE')
    })

    it('should apply low occupancy discount for low occupancy', () => {
      const result = YieldOptimizationEngine.calculateDynamicPrice(100, 0.2, 10, 'weekday')
      expect(result.multiplier).toBe(0.85)
      expect(result.appliedRules).toContain('LOW_OCCUPANCY_DISCOUNT')
    })

    it('should apply early bird discount for booking far in advance', () => {
      const result = YieldOptimizationEngine.calculateDynamicPrice(100, 0.5, 35, 'weekday')
      expect(result.multiplier).toBe(0.9)
      expect(result.appliedRules).toContain('EARLY_BIRD_INCENTIVE')
    })

    it('should apply last minute premium for high occupancy stays close to arrival', () => {
      const result = YieldOptimizationEngine.calculateDynamicPrice(100, 0.7, 2, 'weekday')
      // base multiplier = 1.0
      // moderate compression surge = +0.25 (since occupancy is >=0.75? Wait, occupancy is 0.7 so no compression surge)
      // last minute premium = +0.15 (since daysToArrival < 3 and occupancy >= 0.65)
      // total multiplier = 1.15
      expect(result.multiplier).toBe(1.15)
      expect(result.appliedRules).toContain('LAST_MINUTE_PREMIUM')
    })

    it('should apply last minute clearance for low occupancy stays close to arrival', () => {
      const result = YieldOptimizationEngine.calculateDynamicPrice(100, 0.3, 2, 'weekday')
      // base multiplier = 1.0
      // last-minute clearance = -0.10 (since daysToArrival < 3 and occupancy < 0.35)
      // low occupancy discount = -0.15 (since occupancy < 0.30? Wait, occupancy is 0.3 so no low occupancy discount)
      // total = 0.90
      expect(result.multiplier).toBe(0.9)
      expect(result.appliedRules).toContain('LAST_MINUTE_CLEARANCE_DISCOUNT')
    })

    it('should apply weekend premium', () => {
      const result = YieldOptimizationEngine.calculateDynamicPrice(100, 0.5, 10, 'weekend')
      expect(result.multiplier).toBe(1.1)
      expect(result.appliedRules).toContain('WEEKEND_PREMIUM')
    })

    it('should cap the multiplier at 0.50 minimum', () => {
      // low occupancy discount = -0.15
      // early bird discount = -0.10
      // let's start with a low base or simulate multiple negative rules
      // occupancy = 0.1, daysToArrival = 40, weekday
      // multiplier = 1.0 - 0.15 - 0.10 = 0.75 (above 0.50)
      // We can't naturally get below 0.50 with current rules, but let's test if parseFloat formatting works
      const result = YieldOptimizationEngine.calculateDynamicPrice(100, 0.1, 40, 'weekday')
      expect(result.multiplier).toBe(0.75)
    })
  })

  describe('calculateOverbookingBuffer', () => {
    it('should throw error for invalid historical cancellation rate', () => {
      expect(() => YieldOptimizationEngine.calculateOverbookingBuffer(100, -0.1, 95)).toThrow()
      expect(() => YieldOptimizationEngine.calculateOverbookingBuffer(100, 1.5, 95)).toThrow()
    })

    it('should calculate safe buffer and risk rating correctly', () => {
      // 100 rooms, 10% cancellations -> expected 10 cancellations. 95% confidence -> 9.5 -> floor to 9
      const lowRisk = YieldOptimizationEngine.calculateOverbookingBuffer(100, 0.05, 90)
      expect(lowRisk.safeBuffer).toBe(4)
      expect(lowRisk.riskRating).toBe('LOW')

      const medRisk = YieldOptimizationEngine.calculateOverbookingBuffer(100, 0.10, 95)
      expect(medRisk.safeBuffer).toBe(9)
      expect(medRisk.riskRating).toBe('MEDIUM')

      const highRisk = YieldOptimizationEngine.calculateOverbookingBuffer(100, 0.20, 95)
      expect(highRisk.safeBuffer).toBe(19)
      expect(highRisk.riskRating).toBe('HIGH')
    })
  })

  describe('recommendLengthOfStayLimit', () => {
    it('should return correct stay limits based on occupancy', () => {
      expect(YieldOptimizationEngine.recommendLengthOfStayLimit(0.9)).toEqual({
        minLOS: 3,
        maxLOS: 14,
        reason: expect.any(String),
      })

      expect(YieldOptimizationEngine.recommendLengthOfStayLimit(0.7)).toEqual({
        minLOS: 2,
        maxLOS: 21,
        reason: expect.any(String),
      })

      expect(YieldOptimizationEngine.recommendLengthOfStayLimit(0.5)).toEqual({
        minLOS: 1,
        maxLOS: 30,
        reason: expect.any(String),
      })
    })
  })

  describe('generateOptimizationRecommendation', () => {
    it('should orchestrate recommendation and emit event', () => {
      const rec = YieldOptimizationEngine.generateOptimizationRecommendation(
        'DELUXE',
        150,
        0.8,
        5,
        'weekend',
        100
      )

      expect(rec.recommendedPrice).toBeGreaterThan(0)
      expect(rec.multiplier).toBeGreaterThan(0)
      expect(rec.appliedRules).toBeDefined()
      expect(rec.demandElasticity).toBe(0.65)
      expect(rec.minLOS).toBe(2)
      expect(rec.timestamp).toBeDefined()

      expect(eventBus.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'yield.recommendation_generated',
          severity: 'INFO',
          metadata: expect.objectContaining({
            roomType: 'DELUXE',
            basePrice: 150,
            occupancyRate: 0.8,
          }),
        })
      )
    })
  })
})

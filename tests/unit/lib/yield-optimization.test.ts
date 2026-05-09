import { YieldOptimizationEngine } from '../../../lib/yield-optimization'

describe('Revenue & Yield Optimization Engine', () => {
  
  test('should calculate demand elasticity correctly relative to occupancy boundaries', () => {
    // Occupancy >= 85%: Inelastic
    expect(YieldOptimizationEngine.calculateDemandElasticity(0.90)).toBe(0.35)
    
    // Occupancy 70% - 85%: Moderately Inelastic
    expect(YieldOptimizationEngine.calculateDemandElasticity(0.75)).toBe(0.65)
    
    // Occupancy 40% - 70%: Unitary Elastic
    expect(YieldOptimizationEngine.calculateDemandElasticity(0.50)).toBe(1.00)
    
    // Occupancy < 40%: Highly Elastic
    expect(YieldOptimizationEngine.calculateDemandElasticity(0.20)).toBe(1.80)
  })

  test('should calculate dynamic pricing with correct surge and discount multipliers', () => {
    const basePrice = 200.00

    // 1. Critical Compression Surge (occupancy >= 90%) + Weekend
    const rec1 = YieldOptimizationEngine.calculateDynamicPrice(basePrice, 0.95, 5, 'weekend')
    expect(rec1.multiplier).toBe(1.55) // 1.0 (base) + 0.45 (compression) + 0.10 (weekend)
    expect(rec1.recommendedPrice).toBe(310.00)
    expect(rec1.appliedRules).toContain('CRITICAL_COMPRESSION_SURGE')
    expect(rec1.appliedRules).toContain('WEEKEND_PREMIUM')

    // 2. Low Occupancy Discount + Early Bird Incentives (occupancy < 30%, window >= 30 days)
    const rec2 = YieldOptimizationEngine.calculateDynamicPrice(basePrice, 0.15, 45, 'weekday')
    expect(rec2.multiplier).toBe(0.75) // 1.0 (base) - 0.15 (low occupancy) - 0.10 (early bird)
    expect(rec2.recommendedPrice).toBe(150.00)
    expect(rec2.appliedRules).toContain('LOW_OCCUPANCY_DISCOUNT')
    expect(rec2.appliedRules).toContain('EARLY_BIRD_INCENTIVE')

    // 3. Last-minute clearance discount under low occupancy (arrival < 3 days, occupancy < 35%)
    const rec3 = YieldOptimizationEngine.calculateDynamicPrice(basePrice, 0.20, 2, 'weekday')
    expect(rec3.multiplier).toBe(0.75) // 1.0 (base) - 0.15 (low occupancy) - 0.10 (last minute clearance)
    expect(rec3.recommendedPrice).toBe(150.00)
    expect(rec3.appliedRules).toContain('LAST_MINUTE_CLEARANCE_DISCOUNT')
  })

  test('should compute statistical overbooking buffers based on cancellation confidence parameters', () => {
    // 100 rooms, 10% historical cancellation rate, 90% confidence
    const buffer1 = YieldOptimizationEngine.calculateOverbookingBuffer(100, 0.10, 90)
    expect(buffer1.safeBuffer).toBe(9) // floor(100 * 0.10 * 0.90) = floor(9) = 9
    expect(buffer1.riskRating).toBe('MEDIUM')

    const buffer2 = YieldOptimizationEngine.calculateOverbookingBuffer(50, 0.05, 80)
    expect(buffer2.safeBuffer).toBe(2) // floor(50 * 0.05 * 0.80) = floor(2) = 2
    expect(buffer2.riskRating).toBe('LOW') // 2 is 4% of 50, which is <= 5% (LOW)
  })

  test('should recommend correct stay limits and Length of Stay (LOS) constraints based on room sales velocity', () => {
    // High occupancy stay limitations
    const los1 = YieldOptimizationEngine.recommendLengthOfStayLimit(0.90)
    expect(los1.minLOS).toBe(3)
    expect(los1.reason).toContain('High occupancy compression')

    // Low occupancy flexible stay limits
    const los2 = YieldOptimizationEngine.recommendLengthOfStayLimit(0.25)
    expect(los2.minLOS).toBe(1)
  })

  test('should generate a comprehensive optimization recommendation', () => {
    const recommendation = YieldOptimizationEngine.generateOptimizationRecommendation(
      'Deluxe Suite',
      150.00,
      0.90, // high occupancy
      2,    // last minute check-in
      'weekend',
      100
    )

    expect(recommendation.recommendedPrice).toBeGreaterThan(150.00)
    expect(recommendation.demandElasticity).toBe(0.35) // inelastic
    expect(recommendation.minLOS).toBe(3) // minimum stay constraints applied
    expect(recommendation.timestamp).toBeDefined()
  })
})

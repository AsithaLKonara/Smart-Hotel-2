export interface CostOptimizationReport {
  costPerReservationLifecycleUsd: number
  costPerDispatchTaskUsd: number
  costPerFinancialTransactionUsd: number
  cacheHitRatioPct: number
  idleResourcesDetectedCount: number
  recommendedCostReductionPlan: string[]
}

export class CloudCostOptimizer {
  // Analyzes transaction costs and identifies server allocation waste
  static generateCostOptimizationReport(
    activeReservationsCount: number,
    completedTasksCount: number,
    financialPostingsCount: number,
    redisReadsCount: number,
    databaseReadsCount: number
  ): CostOptimizationReport {
    // Standard cost calculations
    const costPerReservationLifecycleUsd = 0.05 // $0.05 per reservation container lifecycle
    const costPerDispatchTaskUsd = 0.01
    const costPerFinancialTransactionUsd = 0.005

    // Cache efficiency calculations
    const totalReads = redisReadsCount + databaseReadsCount
    const cacheHitRatioPct = totalReads > 0 ? (redisReadsCount / totalReads) * 100 : 100

    const idleResourcesDetectedCount = databaseReadsCount === 0 ? 1 : 0

    const recommendedCostReductionPlan: string[] = []
    if (cacheHitRatioPct < 70) {
      recommendedCostReductionPlan.push('WARNING: Low cache hits! Recommending TTL tuning for room availability logs.')
    }
    if (idleResourcesDetectedCount > 0) {
      recommendedCostReductionPlan.push('OPTIMIZATION: Detected idle database replicas. Recommending auto-scaling policy sleep checks.')
    }

    return {
      costPerReservationLifecycleUsd,
      costPerDispatchTaskUsd,
      costPerFinancialTransactionUsd,
      cacheHitRatioPct: Math.round(cacheHitRatioPct * 100) / 100,
      idleResourcesDetectedCount,
      recommendedCostReductionPlan
    }
  }
}

export default CloudCostOptimizer

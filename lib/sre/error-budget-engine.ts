export interface SliMetrics {
  totalRequests: number
  failedRequests: number
  latenciesMs: number[]
}

export class ErrorBudgetEngine {
  private static serviceSlis = new Map<string, SliMetrics>()
  private static monthlyBudgetAllowedFailures = 10 // Max 10 failures allowed per month
  private static consumedFailures = 0

  static registerRequest(service: string, latencyMs: number, failed: boolean): void {
    if (!this.serviceSlis.has(service)) {
      this.serviceSlis.set(service, { totalRequests: 0, failedRequests: 0, latenciesMs: [] })
    }

    const sli = this.serviceSlis.get(service)!
    sli.totalRequests++
    sli.latenciesMs.push(latencyMs)
    if (failed) {
      sli.failedRequests++
      this.consumedFailures++
    }
  }

  // Calculates requested percentile latency (e.g. 95 for p95, 99 for p99)
  static calculatePercentile(service: string, percentile: number): number {
    const sli = this.serviceSlis.get(service)
    if (!sli || sli.latenciesMs.length === 0) return 0

    const sorted = [...sli.latenciesMs].sort((a, b) => a - b)
    const idx = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, idx)]
  }

  // Returns remaining error budget percentage (0.00% means budget is completely exhausted)
  static getRemainingBudgetPercentage(): number {
    const remaining = Math.max(0, this.monthlyBudgetAllowedFailures - this.consumedFailures)
    return (remaining / this.monthlyBudgetAllowedFailures) * 100
  }

  // Throttles deployment gates or active inbound traffic if error budget is fully consumed
  static isDeploymentThrottled(): boolean {
    return this.getRemainingBudgetPercentage() <= 0
  }

  // Evaluates budget depletions to route tiered SRE alert incidents
  static evaluateAlertEscalation(): { tier: 'GREEN' | 'L1_WARN' | 'L2_CRITICAL' | 'L3_ON_CALL'; alertMessage: string } {
    const budgetPct = this.getRemainingBudgetPercentage()

    if (budgetPct <= 0) {
      return {
        tier: 'L3_ON_CALL',
        alertMessage: 'SRE CATASTROPHIC: Error budget depleted! Triggering SRE On-call paging and locking deployment gates.'
      }
    }

    if (budgetPct <= 30) {
      return {
        tier: 'L2_CRITICAL',
        alertMessage: 'SRE WARNING: Error budget depletion exceeded 70%! Escalating incident to Engineering Leadership.'
      }
    }

    if (budgetPct <= 70) {
      return {
        tier: 'L1_WARN',
        alertMessage: 'SRE ALERT: Error budget depletion exceeded 30%. Notifying service leads.'
      }
    }

    return { tier: 'GREEN', alertMessage: 'All services operating within safe baseline parameters.' }
  }

  static clearMetrics(): void {
    this.serviceSlis.clear()
    this.consumedFailures = 0
  }
}

export default ErrorBudgetEngine

/**
 * Performance Monitoring Utilities
 * 
 * Tracks and reports performance metrics
 */

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
  id?: string
  rating?: 'good' | 'needs-improvement' | 'poor'
}

export interface PerformanceReport {
  metrics: PerformanceMetric[]
  summary: {
    totalMetrics: number
    averageValue: number
    minValue: number
    maxValue: number
  }
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private observers: Map<string, PerformanceObserver> = new Map()

  /**
   * Track a custom metric
   */
  track(metric: Partial<PerformanceMetric> & Pick<PerformanceMetric, 'name' | 'value' | 'unit'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: metric.timestamp || Date.now(),
      id: metric.id,
      rating: metric.rating,
    }

    this.metrics.push(fullMetric)

    // Send to analytics if available (browser only)
    if (typeof window !== 'undefined') {
      this.sendToAnalytics(fullMetric)
    }
  }

  /**
   * Measure function execution time
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      
      this.track({
        name,
        value: duration,
        unit: 'ms',
        rating: this.getRating('duration', duration),
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.track({
        name: `${name}:error`,
        value: duration,
        unit: 'ms',
        rating: 'poor',
      })
      throw error
    }
  }

  /**
   * Start performance observer
   */
  observe(entryType: string, callback: (entries: PerformanceEntry[]) => void): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return
    }

    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })

      observer.observe({ entryTypes: [entryType] })
      this.observers.set(entryType, observer)
    } catch (error) {
      console.warn('PerformanceObserver not supported:', error)
    }
  }

  /**
   * Stop performance observer
   */
  disconnect(entryType: string): void {
    const observer = this.observers.get(entryType)
    if (observer) {
      observer.disconnect()
      this.observers.delete(entryType)
    }
  }

  /**
   * Get performance report
   */
  getReport(): PerformanceReport {
    const values = this.metrics.map(m => m.value)
    
    return {
      metrics: [...this.metrics],
      summary: {
        totalMetrics: this.metrics.length,
        averageValue: values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0,
        minValue: values.length > 0 ? Math.min(...values) : 0,
        maxValue: values.length > 0 ? Math.max(...values) : 0,
      },
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * Get rating for metric
   */
  private getRating(type: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, { good: number; needsImprovement: number }> = {
      duration: { good: 100, needsImprovement: 300 },
      fcp: { good: 1800, needsImprovement: 3000 },
      lcp: { good: 2500, needsImprovement: 4000 },
      cls: { good: 0.1, needsImprovement: 0.25 },
      inp: { good: 200, needsImprovement: 500 },
      ttfb: { good: 800, needsImprovement: 1800 },
    }

    const threshold = thresholds[type] || thresholds.duration
    
    if (value <= threshold.good) return 'good'
    if (value <= threshold.needsImprovement) return 'needs-improvement'
    return 'poor'
  }

  /**
   * Send metric to analytics
   */
  private async sendToAnalytics(metric: PerformanceMetric): Promise<void> {
    try {
      await fetch('/api/performance/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      }).catch(() => {
        // Silently fail - don't block execution
      })
    } catch {
      // Ignore errors
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  if (typeof window === 'undefined') {
    return {
      measure: async <T,>(name: string, fn: () => Promise<T> | T) => fn(),
      track: () => {},
    }
  }

  return {
    measure: async <T,>(name: string, fn: () => Promise<T> | T) => {
      return performanceMonitor.measure(`${componentName}:${name}`, fn)
    },
    track: (metric: Omit<PerformanceMetric, 'timestamp'>) => {
      performanceMonitor.track({
        ...metric,
        name: `${componentName}:${metric.name}`,
      })
    },
  }
}

/**
 * Measure API call performance
 */
export async function measureApiCall<T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measure(`api:${name}`, apiCall)
}

/**
 * Measure render performance
 */
export function measureRender(componentName: string) {
  if (typeof window === 'undefined') return () => {}

  const start = performance.now()
  
  return () => {
    const duration = performance.now() - start
    performanceMonitor.track({
      name: `render:${componentName}`,
      value: duration,
      unit: 'ms',
      rating: duration < 16 ? 'good' : duration < 50 ? 'needs-improvement' : 'poor',
    })
  }
}


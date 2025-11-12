/**
 * Performance Monitoring Utilities
 * 
 * Tracks Web Vitals, database query performance, and API response times
 */

import { log } from './logger'

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  timestamp?: number
  tags?: Record<string, string>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 1000

  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now(),
    } as PerformanceMetric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log slow operations
    if (metric.unit === 'ms' && metric.value > 1000) {
      log.warn('Slow operation detected', {
        metric: metric.name,
        duration: metric.value,
        tags: metric.tags,
      })
    }
  }

  getMetrics(filter?: { name?: string; since?: number }): PerformanceMetric[] {
    let filtered = this.metrics

    if (filter?.name) {
      filtered = filtered.filter(m => m.name === filter.name)
    }

    if (filter?.since) {
      const cutoff = Date.now() - filter.since
      filtered = filtered.filter(m => m.timestamp !== undefined && m.timestamp >= cutoff)
    }

    return filtered
  }

  getStats(name: string, since?: number): {
    count: number
    avg: number
    min: number
    max: number
    p95: number
    p99: number
  } {
    const metrics = this.getMetrics({ name, since })
    if (metrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p95: 0, p99: 0 }
    }

    const values = metrics.map(m => m.value).sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const min = values[0]
    const max = values[values.length - 1]
    const p95Index = Math.floor(values.length * 0.95)
    const p99Index = Math.floor(values.length * 0.99)

    return {
      count: values.length,
      avg: Math.round(avg * 100) / 100,
      min,
      max,
      p95: values[p95Index] || 0,
      p99: values[p99Index] || 0,
    }
  }

  clear(): void {
    this.metrics = []
  }
}

const monitor = new PerformanceMonitor()

/**
 * Track database query performance
 */
export function trackDatabaseQuery(
  query: string,
  duration: number,
  tags?: Record<string, string>
): void {
  monitor.recordMetric({
    name: 'db.query',
    value: duration,
    unit: 'ms',
    tags: {
      query: query.substring(0, 50),
      ...tags,
    },
  })
}

/**
 * Track API endpoint performance
 */
export function trackAPIEndpoint(
  method: string,
  path: string,
  duration: number,
  statusCode: number,
  tags?: Record<string, string>
): void {
  monitor.recordMetric({
    name: 'api.request',
    value: duration,
    unit: 'ms',
    tags: {
      method,
      path,
      statusCode: statusCode.toString(),
      ...tags,
    },
  } as PerformanceMetric)
}

/**
 * Track Web Vitals (client-side)
 */
export function trackWebVital(
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB',
  value: number
): void {
  monitor.recordMetric({
    name: `web.vital.${name.toLowerCase()}`,
    value,
    unit: 'ms',
  })
}

/**
 * Track custom performance metric
 */
export function trackMetric(
  name: string,
  value: number,
  unit: 'ms' | 'bytes' | 'count' = 'ms',
  tags?: Record<string, string>
): void {
  monitor.recordMetric({
    name,
    value,
    unit,
    tags,
  })
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(
  metricName: string,
  since?: number
): ReturnType<PerformanceMonitor['getStats']> {
  return monitor.getStats(metricName, since)
}

/**
 * Get all metrics
 */
export function getAllMetrics(
  filter?: { name?: string; since?: number }
): PerformanceMetric[] {
  return monitor.getMetrics(filter)
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  monitor.clear()
}

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start
    trackMetric(name, duration, 'ms', tags)
    return result
  } catch (error) {
    const duration = Date.now() - start
    trackMetric(`${name}.error`, duration, 'ms', tags)
    throw error
  }
}

export default monitor


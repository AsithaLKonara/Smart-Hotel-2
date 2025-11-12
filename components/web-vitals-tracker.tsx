'use client'

/**
 * Web Vitals Tracking Component
 * 
 * Tracks Core Web Vitals and sends them to performance monitoring
 */

import { useEffect } from 'react'
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals'

export function WebVitalsTracker() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const sendToAnalytics = (metric: any) => {
      // Send to performance monitoring API
      fetch('/api/performance/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `web.vital.${metric.name.toLowerCase()}`,
          value: metric.value,
          unit: 'ms',
          id: metric.id,
          rating: metric.rating,
        }),
      }).catch(() => {
        // Silently fail in case of network issues
      })
    }

    onCLS(sendToAnalytics)
    onINP(sendToAnalytics) // Use INP instead of deprecated FID
    onFCP(sendToAnalytics)
    onLCP(sendToAnalytics)
    onTTFB(sendToAnalytics)
  }, [])

  return null
}


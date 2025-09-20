// Performance optimization utilities for SmartHotel

import { ComponentType, lazy, Suspense } from 'react'
import dynamic from 'next/dynamic'

// Lazy loading wrapper with loading fallback
export function withLazyLoading<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ComponentType
) {
  return lazy(importFunc)
}

// Dynamic imports for heavy components
export const LazyChartCard = dynamic(
  () => import('@/components/ui/chart-card').then(mod => ({ default: mod.ChartCard })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-2xl h-64 w-full"></div>
    )
  }
)

export const LazyOrderPortal = dynamic(
  () => import('@/components/ordering/order-portal').then(mod => ({ default: mod.OrderPortal })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }
)

export const LazyKitchenDashboard = dynamic(
  () => import('@/components/ordering/kitchen-dashboard').then(mod => ({ default: mod.KitchenDashboard })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }
)

export const LazyDashboardOverview = dynamic(
  () => import('@/components/dashboard/dashboard-overview').then(mod => ({ default: mod.DashboardOverview })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }
)

export const LazyRevenueAnalytics = dynamic(
  () => import('@/components/dashboard/revenue-analytics').then(mod => ({ default: mod.RevenueAnalytics })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }
)

// Image optimization utilities
export const imageOptimization = {
  // Lazy load images with intersection observer
  lazyLoadImages: () => {
    if (typeof window === 'undefined') return

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.classList.remove('lazy')
            observer.unobserve(img)
          }
        }
      })
    })

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img)
    })

    return () => imageObserver.disconnect()
  },

  // Preload critical images
  preloadImages: (imageUrls: string[]) => {
    if (typeof window === 'undefined') return

    imageUrls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)
    })
  }
}

// Bundle analysis utilities
export const bundleAnalysis = {
  // Analyze bundle size
  getBundleSize: async () => {
    if (typeof window === 'undefined') return null

    try {
      const response = await fetch('/api/bundle-analysis')
      return await response.json()
    } catch {
      return null
    }
  },

  // Monitor performance metrics
  getPerformanceMetrics: () => {
    if (typeof window === 'undefined') return null

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    
    return {
      // Core Web Vitals
      FCP: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      LCP: 0, // Will be measured by LCP observer
      FID: 0, // Will be measured by FID observer
      CLS: 0, // Will be measured by CLS observer
      
      // Navigation timing
      TTFB: navigation.responseStart - navigation.requestStart,
      DOMContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      LoadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      
      // Resource timing
      totalResources: performance.getEntriesByType('resource').length,
      totalSize: performance.getEntriesByType('resource').reduce((total, resource) => {
        return total + ((resource as any).transferSize || 0)
      }, 0)
    }
  }
}

// Memory optimization utilities
export const memoryOptimization = {
  // Clean up event listeners
  cleanupEventListeners: (element: HTMLElement) => {
    const newElement = element.cloneNode(true)
    element.parentNode?.replaceChild(newElement, element)
    return newElement as HTMLElement
  },

  // Debounce function calls
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null
    
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },

  // Throttle function calls
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
}

// Animation optimization utilities
export const animationOptimization = {
  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false
    
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  // Optimize animations for performance
  getOptimizedAnimationProps: (baseProps: any) => {
    const prefersReduced = animationOptimization.prefersReducedMotion()
    
    if (prefersReduced) {
      return {
        ...baseProps,
        animate: { opacity: 1 },
        transition: { duration: 0.1 }
      }
    }
    
    return baseProps
  },

  // Use transform instead of changing layout properties
  useTransformAnimations: true,
  
  // Will-change optimization
  setWillChange: (element: HTMLElement, property: string) => {
    element.style.willChange = property
    
    // Clean up after animation
    setTimeout(() => {
      element.style.willChange = 'auto'
    }, 300)
  }
}

// Caching utilities
export const caching = {
  // API response caching
  apiCache: new Map<string, { data: any; timestamp: number; ttl: number }>(),
  
  set: (key: string, data: any, ttl: number = 300000) => { // 5 minutes default
    caching.apiCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  },
  
  get: (key: string) => {
    const cached = caching.apiCache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      caching.apiCache.delete(key)
      return null
    }
    
    return cached.data
  },
  
  clear: () => {
    caching.apiCache.clear()
  },
  
  // Local storage with expiration
  setLocalStorage: (key: string, data: any, ttl: number = 86400000) => { // 24 hours default
    if (typeof window === 'undefined') return
    
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    }
    
    localStorage.setItem(key, JSON.stringify(item))
  },
  
  getLocalStorage: (key: string) => {
    if (typeof window === 'undefined') return null
    
    try {
      const item = localStorage.getItem(key)
      if (!item) return null
      
      const parsed = JSON.parse(item)
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(key)
        return null
      }
      
      return parsed.data
    } catch {
      localStorage.removeItem(key)
      return null
    }
  }
}

// Performance monitoring
export const performanceMonitoring = {
  // Measure component render time
  measureRenderTime: (componentName: string, renderFn: () => void) => {
    const start = performance.now()
    renderFn()
    const end = performance.now()
    
    console.log(`${componentName} render time: ${end - start}ms`)
    return end - start
  },
  
  // Monitor memory usage
  getMemoryUsage: () => {
    if (typeof window === 'undefined' || !('memory' in performance)) return null
    
    return {
      used: (performance as any).memory.usedJSHeapSize,
      total: (performance as any).memory.totalJSHeapSize,
      limit: (performance as any).memory.jsHeapSizeLimit
    }
  },
  
  // Report performance metrics
  reportMetrics: (metrics: any) => {
    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics
      console.log('Performance metrics:', metrics)
    } else {
      console.log('Performance metrics:', metrics)
    }
  }
}

// Critical resource hints
export const resourceHints = {
  // Preconnect to external domains
  preconnect: (domain: string) => {
    if (typeof document === 'undefined') return
    
    const link = document.createElement('link')
    link.rel = 'preconnect'
    link.href = domain
    document.head.appendChild(link)
  },
  
  // Prefetch resources
  prefetch: (url: string) => {
    if (typeof document === 'undefined') return
    
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
  },
  
  // DNS prefetch
  dnsPrefetch: (domain: string) => {
    if (typeof document === 'undefined') return
    
    const link = document.createElement('link')
    link.rel = 'dns-prefetch'
    link.href = domain
    document.head.appendChild(link)
  }
}

// Initialize performance optimizations
export const initializePerformanceOptimizations = () => {
  if (typeof window === 'undefined') return
  
  // Initialize image lazy loading
  imageOptimization.lazyLoadImages()
  
  // Preconnect to external domains
  resourceHints.preconnect('https://fonts.googleapis.com')
  resourceHints.preconnect('https://fonts.gstatic.com')
  
  // Monitor Core Web Vitals
  if ('web-vital' in window) {
    // LCP measurement
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      console.log('LCP:', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })
    
    // CLS measurement
    new PerformanceObserver((entryList) => {
      let clsValue = 0
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
      console.log('CLS:', clsValue)
    }).observe({ entryTypes: ['layout-shift'] })
  }
}

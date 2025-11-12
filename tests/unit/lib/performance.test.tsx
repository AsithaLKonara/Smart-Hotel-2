/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals'

jest.mock('next/dynamic', () => jest.fn(() => 'dynamic-component'))

const mockLazy = jest.fn(() => 'lazy-component')

jest.mock('react', () => {
  const actual = jest.requireActual('react')
  return {
    ...actual,
    lazy: mockLazy,
  }
})

describe('lib/performance', () => {
  const originalPerformance = global.performance
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.resetModules()
    mockLazy.mockClear()
    ;(require('next/dynamic') as jest.Mock).mockClear()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      writable: true,
      value: originalFetch,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    Object.defineProperty(global, 'performance', {
      configurable: true,
      writable: true,
      value: originalPerformance,
    })
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      writable: true,
      value: originalFetch,
    })
  })

  it('wraps lazy loading helper with react.lazy', async () => {
    const { withLazyLoading } = await import('@/lib/lazy-components')
    const importFn = jest.fn(async () => ({ default: () => null }))

    const result = withLazyLoading(importFn)

    expect(mockLazy).toHaveBeenCalledWith(importFn)
    expect(result).toBe('lazy-component')
  })

  it('lazy loads images via IntersectionObserver and disconnects on cleanup', async () => {
    const observe = jest.fn()
    const unobserve = jest.fn()
    const disconnect = jest.fn()
    let createdObserver: any

    class MockIntersectionObserver {
      callback: IntersectionObserverCallback
      constructor(cb: IntersectionObserverCallback) {
        this.callback = cb
        createdObserver = this
      }
      observe = observe
      unobserve = unobserve
      disconnect = disconnect
    }

    Object.defineProperty(global, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: MockIntersectionObserver,
    })

    document.body.innerHTML = `
      <img data-src="/image-1.jpg" class="lazy" />
      <img data-src="/image-2.jpg" class="lazy" />
    `

    const { imageOptimization } = await import('@/lib/lazy-components')
    const cleanup = imageOptimization.lazyLoadImages()

    expect(observe).toHaveBeenCalledTimes(2)

    const firstEntry = { isIntersecting: true, target: document.querySelector('img[data-src]')! } as IntersectionObserverEntry
    createdObserver.callback([firstEntry], createdObserver as unknown as IntersectionObserver)

    const img = firstEntry.target as HTMLImageElement
    expect(img.src).toContain('/image-1.jpg')
    expect(img.classList.contains('lazy')).toBe(false)
    expect(unobserve).toHaveBeenCalled()

    cleanup?.()
    expect(disconnect).toHaveBeenCalled()
  })

  it('preloads critical images into document head', async () => {
    const { imageOptimization } = await import('@/lib/lazy-components')
    imageOptimization.preloadImages(['/hero.jpg', '/gallery.jpg'])

    const links = Array.from(document.head.querySelectorAll('link[rel="preload"]'))
    expect(links).toHaveLength(2)
    expect(links.map(link => link.getAttribute('href'))).toEqual(['/hero.jpg', '/gallery.jpg'])
  })

  it('fetches bundle analysis data and handles failures', async () => {
    const fetchMock = jest.fn()
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    })

    const { bundleAnalysis } = await import('@/lib/lazy-components')

    fetchMock.mockResolvedValueOnce({ json: () => Promise.resolve({ size: 1024 }) })
    await expect(bundleAnalysis.getBundleSize()).resolves.toEqual({ size: 1024 })

    fetchMock.mockRejectedValueOnce(new Error('network'))
    await expect(bundleAnalysis.getBundleSize()).resolves.toBeNull()
  })

  it('returns performance metrics based on performance entries', async () => {
    const navigationEntry = {
      responseStart: 15,
      requestStart: 0,
      domContentLoadedEventEnd: 50,
      domContentLoadedEventStart: 40,
      loadEventEnd: 120,
      loadEventStart: 100,
    } as PerformanceNavigationTiming

    const paintEntries = [{ name: 'first-contentful-paint', startTime: 75 }] as PerformanceEntry[]
    const resourceEntries = [
      { transferSize: 200 },
      { transferSize: 300 },
    ] as PerformanceEntry[]

    Object.defineProperty(global, 'performance', {
      configurable: true,
      writable: true,
      value: {
        getEntriesByType: (type: string) => {
          if (type === 'navigation') return [navigationEntry]
          if (type === 'paint') return paintEntries
          if (type === 'resource') return resourceEntries
          return []
        },
      },
    })

    const { bundleAnalysis } = await import('@/lib/lazy-components')
    const metrics = bundleAnalysis.getPerformanceMetrics()

    expect(metrics).toMatchObject({
      FCP: 75,
      TTFB: 15,
      totalResources: 2,
      totalSize: 500,
    })
  })

  it('debounces and throttles functions within memoryOptimization', async () => {
    jest.useFakeTimers()
    const { memoryOptimization } = await import('@/lib/lazy-components')

    const spy = jest.fn()
    const debounced = memoryOptimization.debounce(spy, 200)

    debounced('first')
    debounced('second')
    jest.advanceTimersByTime(199)
    expect(spy).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(spy).toHaveBeenCalledWith('second')

    const throttleSpy = jest.fn()
    const throttled = memoryOptimization.throttle(throttleSpy, 100)
    throttled('call1')
    throttled('call2')
    expect(throttleSpy).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(100)
    throttled('call3')
    expect(throttleSpy).toHaveBeenCalledTimes(2)

    jest.useRealTimers()
  })

  it('sets and retrieves cached API and localStorage values', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(0)
    const { caching } = await import('@/lib/lazy-components')

    caching.set('key', { value: 1 }, 1000)
    expect(caching.get('key')).toEqual({ value: 1 })

    jest.advanceTimersByTime(1001)
    jest.setSystemTime(1001)
    expect(caching.get('key')).toBeNull()

    caching.setLocalStorage('localKey', { foo: 'bar' }, 1000)
    expect(caching.getLocalStorage('localKey')).toEqual({ foo: 'bar' })
    jest.advanceTimersByTime(1001)
    jest.setSystemTime(2002)
    expect(caching.getLocalStorage('localKey')).toBeNull()

    localStorage.setItem('invalid', 'not-json')
    expect(caching.getLocalStorage('invalid')).toBeNull()

    caching.clear()
    expect(caching.apiCache.size).toBe(0)
    jest.useRealTimers()
  })

  it('adjusts animation props when reduced motion preferred', async () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({ matches: query.includes('reduce') }),
    })

    const { animationOptimization } = await import('@/lib/lazy-components')

    const reducedProps = animationOptimization.getOptimizedAnimationProps({ animate: { opacity: 0 }, transition: { duration: 1 } })
    expect(reducedProps).toMatchObject({ animate: { opacity: 1 }, transition: { duration: 0.1 } })

    ;(window.matchMedia as any) = () => ({ matches: false })
    const normalProps = animationOptimization.getOptimizedAnimationProps({ animate: { opacity: 0 } })
    expect(normalProps).toMatchObject({ animate: { opacity: 0 } })
  })

  it('measures render time and reports performance metrics', async () => {
    const nowSpy = jest.spyOn(performance, 'now')
    nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(25)

    const { performanceMonitoring } = await import('@/lib/lazy-components')
    const duration = performanceMonitoring.measureRenderTime('Component', () => {})

    expect(duration).toBe(25)
    expect(console.log).toHaveBeenCalledWith('Component render time: 25ms')

    nowSpy.mockRestore()
  })

  it('appends resource hints to document head', async () => {
    const { resourceHints } = await import('@/lib/lazy-components')
    resourceHints.preconnect('https://example.com')
    resourceHints.prefetch('/app.js')
    resourceHints.dnsPrefetch('https://cdn.example.com')

    expect(document.head.querySelectorAll('link[rel="preconnect"]')).toHaveLength(1)
    expect(document.head.querySelectorAll('link[rel="prefetch"]')).toHaveLength(1)
    expect(document.head.querySelectorAll('link[rel="dns-prefetch"]')).toHaveLength(1)
  })

  it('logs performance metrics in production mode', async () => {
    jest.resetModules()
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    jest.spyOn(console, 'log').mockImplementation(() => {})

    const { performanceMonitoring } = await import('@/lib/lazy-components')
    performanceMonitoring.reportMetrics({ FCP: 123 })
    expect(console.log).toHaveBeenCalledWith('Performance metrics:', { FCP: 123 })

    process.env.NODE_ENV = originalEnv
  })

  it('returns memory usage when browser supports it', async () => {
    jest.resetModules()
    const originalPerformance = global.performance
    // @ts-expect-error override for test
    global.performance = {
      memory: {
        usedJSHeapSize: 1,
        totalJSHeapSize: 2,
        jsHeapSizeLimit: 3,
      },
    }

    const { performanceMonitoring } = await import('@/lib/lazy-components')
    expect(performanceMonitoring.getMemoryUsage()).toEqual({
      used: 1,
      total: 2,
      limit: 3,
    })

    global.performance = originalPerformance
  })

  it('returns null when memory information is unavailable', async () => {
    jest.resetModules()
    const originalPerformance = global.performance
    // @ts-expect-error override for test
    global.performance = {}

    const { performanceMonitoring } = await import('@/lib/lazy-components')
    expect(performanceMonitoring.getMemoryUsage()).toBeNull()

    global.performance = originalPerformance
  })

  it('sets and resets will-change hints on elements', async () => {
    jest.resetModules()
    jest.useFakeTimers()

    const { animationOptimization } = await import('@/lib/lazy-components')
    const element = document.createElement('div')
    animationOptimization.setWillChange(element, 'transform')

    expect(element.style.willChange).toBe('transform')
    jest.advanceTimersByTime(300)
    expect(element.style.willChange).toBe('auto')

    jest.useRealTimers()
  })

  it('initializes web vital observers when available', async () => {
    jest.resetModules()
    const originalPO = global.PerformanceObserver
    const observeMock = jest.fn()
    const poMock = jest.fn(() => ({ observe: observeMock }))
    global.PerformanceObserver = poMock as unknown as typeof PerformanceObserver
    ;(window as any)['web-vital'] = true

    const { initializePerformanceOptimizations } = await import('@/lib/lazy-components')
    initializePerformanceOptimizations()

    expect(poMock).toHaveBeenCalled()
    expect(observeMock).toHaveBeenCalled()

    delete (window as any)['web-vital']
    global.PerformanceObserver = originalPO
  })
})

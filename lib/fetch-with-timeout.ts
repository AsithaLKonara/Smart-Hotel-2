/**
 * Fetch utility with configurable timeout
 * 
 * Timeout guidelines:
 * - Public pages: 2.0-2.5s max
 * - Admin stats pages (heavy queries): 3.5s
 * - Dashboards: 2.5-3.0s
 * - Regular admin pages: 2.5-3.0s
 */

export type FetchTimeoutCategory = 'public' | 'admin' | 'dashboard' | 'analytics'

const TIMEOUTS: Record<FetchTimeoutCategory, number> = {
  public: 2500,      // 2.5s max for public pages
  admin: 3000,       // 3.0s for regular admin pages
  dashboard: 3000,   // 3.0s for dashboards
  analytics: 3500,   // 3.5s for heavy analytics queries
}

export function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  category: FetchTimeoutCategory = 'public',
  customTimeout?: number
): Promise<Response> {
  const timeoutMs = customTimeout ?? TIMEOUTS[category]
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  return fetch(input, {
    ...init,
    signal: controller.signal,
    cache: init.cache ?? 'no-store',
    credentials: init.credentials ?? 'include',
  })
    .finally(() => clearTimeout(timeoutId))
    .catch((error) => {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`)
      }
      throw error
    })
}


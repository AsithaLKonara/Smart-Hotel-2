/**
 * Monitoring and Error Tracking Utilities
 * 
 * Provides centralized error tracking and monitoring functions
 */

// Sentry is optional - use any to avoid TypeScript errors when not installed
let Sentry: any = null

// Lazy load Sentry to avoid issues in test environments
// Only attempt to load if SENTRY_DSN is configured
if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
  try {
    if (typeof window === 'undefined') {
      // Server-side - use dynamic require to avoid webpack bundling
      const sentryModule = '@sentry/nextjs'
      if (require.resolve && require.resolve(sentryModule)) {
        Sentry = require(sentryModule)
      }
    } else {
      // Client-side - Sentry is loaded via sentry.client.config.ts
      // Check if Sentry is available globally
      if (typeof (globalThis as any).Sentry !== 'undefined') {
        Sentry = (globalThis as any).Sentry
      }
    }
  } catch (error) {
    // Sentry not available, will use console fallback
    Sentry = null
  }
}

export interface ErrorContext {
  userId?: string
  userRole?: string
  requestId?: string
  [key: string]: unknown
}

/**
 * Capture an exception with context
 */
export function captureException(
  error: Error | unknown,
  context?: ErrorContext
): string {
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    console.error('Test environment - error logged:', error)
    return 'test-error-id'
  }

  // Try to use Sentry if available
  try {
    if (Sentry && typeof Sentry.captureException === 'function') {
      const errorId = Sentry.captureException(error, {
        tags: {
          environment: process.env.NODE_ENV || 'unknown',
          ...(context?.userRole && { userRole: context.userRole }),
        },
        user: context?.userId
          ? {
              id: context.userId,
            }
          : undefined,
        extra: {
          ...context,
          timestamp: new Date().toISOString(),
        },
      })
      return errorId || 'sentry-error-id'
    }
  } catch (err) {
    // Sentry failed, fall back to console
  }

  console.error('Error captured:', error, context)
  return 'console-error-id'
}

/**
 * Capture a message (non-error)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext
): string {
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    console.log(`Test environment - ${level}:`, message)
    return 'test-message-id'
  }

  // Try to use Sentry if available
  try {
    if (Sentry && typeof Sentry.captureMessage === 'function') {
      const messageId = Sentry.captureMessage(message, {
        level: level as any,
        tags: {
          environment: process.env.NODE_ENV || 'unknown',
          ...(context?.userRole && { userRole: context.userRole }),
        },
        user: context?.userId
          ? {
              id: context.userId,
            }
          : undefined,
        extra: {
          ...context,
          timestamp: new Date().toISOString(),
        },
      })
      return messageId || 'sentry-message-id'
    }
  } catch (err) {
    // Sentry failed, fall back to console
  }

  console.log(`[${level.toUpperCase()}]`, message, context)
  return 'console-message-id'
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    return
  }

  try {
    if (Sentry && typeof Sentry.addBreadcrumb === 'function') {
      Sentry.addBreadcrumb({
        message,
        category: category || 'default',
        level: level as any,
        data,
        timestamp: Date.now() / 1000,
      })
    }
  } catch (err) {
    // Sentry not available
  }
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; role?: string }): void {
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    return
  }

  try {
    if (Sentry && typeof Sentry.setUser === 'function') {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.email,
      })

      if (typeof Sentry.setTag === 'function') {
        Sentry.setTag('userRole', user.role || 'unknown')
      }
    }
  } catch (err) {
    // Sentry not available
  }
}

/**
 * Clear user context
 */
export function clearUser(): void {
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    return
  }

  try {
    if (Sentry && typeof Sentry.setUser === 'function') {
      Sentry.setUser(null)
    }
  } catch (err) {
    // Sentry not available
  }
}

/**
 * Wrap async function with error tracking
 */
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      captureException(error, context)
      throw error
    }
  }) as T
}

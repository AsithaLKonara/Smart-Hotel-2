// import 'server-only'
import * as Sentry from '@sentry/nextjs'

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

  // Use Sentry
  try {
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

  // Use Sentry
  try {
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
    Sentry.addBreadcrumb({
      message,
      category: category || 'default',
      level: level as any,
      data,
      timestamp: Date.now() / 1000,
    })
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
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.email,
    })

    Sentry.setTag('userRole', user.role || 'unknown')
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
    Sentry.setUser(null)
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

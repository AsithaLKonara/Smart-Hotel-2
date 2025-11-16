/**
 * Production-aware logging utility
 * - Removes console.logs in production builds
 * - Keeps console.error for critical issues
 * - Allows selective logging for debugging
 */

const isProduction = process.env.NODE_ENV === 'production'
const isClient = typeof window !== 'undefined'

export const logger = {
  log: (...args: any[]) => {
    if (!isProduction && isClient) {
      console.log(...args)
    }
  },
  error: (...args: any[]) => {
    // Always log errors, but structure them for production
    if (isProduction && isClient) {
      // In production, send to error tracking service
      // For now, just log minimal info
      const errorMessage = args[0]?.toString() || 'Unknown error'
      if (!errorMessage.includes('images.unsplash.com') && 
          !errorMessage.includes('player.vimeo.com')) {
        console.error(...args)
      }
    } else {
      console.error(...args)
    }
  },
  warn: (...args: any[]) => {
    if (!isProduction && isClient) {
      console.warn(...args)
    }
  },
  info: (...args: any[]) => {
    if (!isProduction && isClient) {
      console.info(...args)
    }
  },
  debug: (...args: any[]) => {
    if (!isProduction && isClient) {
      console.debug(...args)
    }
  },
}


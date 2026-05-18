/**
 * Structured Logging Utility
 * 
 * Provides consistent logging across the application with different log levels
 * and structured output for production monitoring.
 */

// import 'server-only'
import winston from 'winston'
import { captureException, captureMessage } from './monitoring'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(colors)

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
)

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info
    // Clean up internal winston symbols
    const cleanMeta = { ...meta }
    delete cleanMeta[Symbol.for('level') as any]
    delete cleanMeta[Symbol.for('message') as any]
    delete cleanMeta[Symbol.for('splat') as any]
    const metaStr = Object.keys(cleanMeta).length ? ` ${JSON.stringify(cleanMeta)}` : ''
    return `${timestamp} ${level}: ${message}${metaStr}${stack ? `\n${stack}` : ''}`
  })
)

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'info'
}

// Create transports
const transports = []

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
  })
)

// File transports for production (only if not in serverless environment)
// Vercel and other serverless platforms have read-only filesystems
const isServerless = 
  process.env.VERCEL === '1' || 
  !!process.env.AWS_LAMBDA_FUNCTION_NAME || 
  !!process.env.VERCEL_ENV

if (process.env.NODE_ENV === 'production' && !isServerless) {
  // Only use file transports in non-serverless production environments
  try {
    const fs = require('fs')
    const path = require('path')
    const logsDir = path.join(process.cwd(), 'logs')
    
    // Try to create logs directory (will fail in serverless)
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }
    
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  )
  } catch (error) {
    // If file transport fails (e.g., in serverless), just use console
    // This is expected in Vercel/serverless environments
    console.warn('File logging not available in serverless environment, using console only')
  }
}

// Create logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
})

// Create request ID generator
let requestIdCounter = 0
export function generateRequestId(): string {
  return `req-${Date.now()}-${++requestIdCounter}`
}

// Enhanced logger with request context
export interface LogContext {
  requestId?: string
  userId?: string
  userRole?: string
  method?: string
  path?: string
  statusCode?: number
  duration?: number
  [key: string]: unknown
}

class Logger {
  private requestId?: string
  private context: LogContext = {}

  setRequestId(requestId: string): this {
    this.requestId = requestId
    this.context.requestId = requestId
    return this
  }

  setContext(context: LogContext): this {
    this.context = { ...this.context, ...context }
    return this
  }

  private getMergedContext(meta?: Record<string, unknown>): Record<string, unknown> {
    return { ...this.context, ...meta }
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const fullMessage = error ? `${message}: ${errorMessage}` : message
    const mergedContext = this.getMergedContext(meta)
    
    logger.error(fullMessage, {
      error: error instanceof Error ? error.stack : error,
      ...mergedContext,
    })

    // Send to Sentry in production
    if (process.env.NODE_ENV === 'production' && error) {
      captureException(error, {
        ...mergedContext,
        logMessage: message,
      })
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    const mergedContext = this.getMergedContext(meta)
    logger.warn(message, mergedContext)
    
    // Send warnings to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      captureMessage(message, 'warning', mergedContext)
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    logger.info(message, this.getMergedContext(meta))
  }

  http(message: string, meta?: Record<string, unknown>): void {
    logger.http(message, this.getMergedContext(meta))
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    logger.debug(message, this.getMergedContext(meta))
  }
}

// Create default logger instance
const defaultLogger = new Logger()

// Export convenience functions
export const log = {
  error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) =>
    defaultLogger.error(message, error, meta),
  warn: (message: string, meta?: Record<string, unknown>) => defaultLogger.warn(message, meta),
  info: (message: string, meta?: Record<string, unknown>) => defaultLogger.info(message, meta),
  http: (message: string, meta?: Record<string, unknown>) => defaultLogger.http(message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => defaultLogger.debug(message, meta),
}

// Create logger with context
export function createLogger(context?: LogContext): Logger {
  const logger = new Logger()
  if (context) {
    logger.setContext(context)
  }
  return logger
}

// Export default logger instance
export default logger


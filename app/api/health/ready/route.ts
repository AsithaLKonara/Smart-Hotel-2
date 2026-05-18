import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

type HealthStatus = 'healthy' | 'unhealthy' | 'unknown'

function formatStatus(isHealthy: boolean | undefined | null): HealthStatus {
  if (isHealthy === true) return 'healthy'
  if (isHealthy === false) return 'unhealthy'
  return 'unknown'
}

function buildErrorMessage(entries: Array<{ source: string; message: string }>) {
  if (entries.length === 0) {
    return {
      error: undefined,
      errors: undefined
    }
  }

  const normalized = entries.map(({ source, message }) => {
    const label = source.charAt(0).toUpperCase() + source.slice(1)
    return `${label}: ${message}`
  })

  return {
    error: entries.length === 1 ? entries[0].message : normalized.join('; '),
    errors: entries.length > 1 ? normalized : undefined
  }
}

const DB_TIMEOUT_MS = 5000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Connection timeout'))
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

/**
 * Readiness probe - checks if the application is ready to serve traffic.
 * Aligns response contract with integration tests (string statuses, uptime, rich errors).
 */
export async function GET() {
  const errorEntries: Array<{ source: string; message: string }> = []

  const checks: Record<'database' | 'users' | 'bookings', HealthStatus> = {
    database: 'unknown',
    users: 'unknown',
    bookings: 'unknown'
  }

  const now = new Date()

  let databaseHealthy = false

  try {
    await withTimeout(prisma.$runCommandRaw({ ping: 1 }), DB_TIMEOUT_MS)
    checks.database = 'healthy'
    databaseHealthy = true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    checks.database = 'unhealthy'
    checks.users = 'unhealthy'
    checks.bookings = 'unhealthy'
    errorEntries.push({ source: 'database', message })
    databaseHealthy = false
  }

  if (databaseHealthy) {
    try {
      const userCount = await withTimeout(prisma.user.count(), DB_TIMEOUT_MS)
      checks.users = formatStatus(typeof userCount === 'number' && userCount >= 0)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      checks.users = 'unhealthy'
      errorEntries.push({ source: 'users', message })
    }

    try {
      const bookingCount = await withTimeout(prisma.booking.count(), DB_TIMEOUT_MS)
      checks.bookings = formatStatus(typeof bookingCount === 'number' && bookingCount >= 0)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      checks.bookings = 'unhealthy'
      errorEntries.push({ source: 'bookings', message })
    }
  }

  const isReady = Object.values(checks).every(status => status === 'healthy')
  const { error, errors } = buildErrorMessage(errorEntries)

  const response = {
    status: isReady ? 'ready' : 'not ready',
    timestamp: now.toISOString(),
    uptime: process.uptime(),
    checks,
    error,
    errors
  }

  return NextResponse.json(response, {
    status: isReady ? 200 : 503
  })
}

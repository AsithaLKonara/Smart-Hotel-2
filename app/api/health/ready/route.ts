import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

/**
 * Readiness probe - checks if the application is ready to serve traffic
 * Should check all critical dependencies (DB, Redis, external services)
 */
export async function GET() {
  const checks = {
    database: false,
    redis: false,
    stripe: false,
    email: false
  }

  const errors: string[] = []

  try {
    // Database connectivity check
    try {
      await prisma.$runCommandRaw({ ping: 1 })
      checks.database = true
    } catch (error) {
      errors.push(`Database: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Redis connectivity check (if implemented)
    try {
      // TODO: Implement Redis health check when Redis is added
      // const redis = await redisClient.ping()
      // checks.redis = redis === 'PONG'
      checks.redis = true // Placeholder until Redis is implemented
    } catch (error) {
      errors.push(`Redis: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Stripe API connectivity check
    try {
      if (process.env.STRIPE_SECRET_KEY) {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
        await stripe.balance.retrieve()
        checks.stripe = true
      } else {
        checks.stripe = true // Skip if not configured
      }
    } catch (error) {
      errors.push(`Stripe: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Email service check (if configured)
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        // TODO: Implement email service health check
        checks.email = true // Placeholder
      } else {
        checks.email = true // Skip if not configured
      }
    } catch (error) {
      errors.push(`Email: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    const allHealthy = Object.values(checks).every(check => check === true)

    const response = {
      status: allHealthy ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
      errors: errors.length > 0 ? errors : undefined
    }

    return NextResponse.json(response, { 
      status: allHealthy ? 200 : 503 
    })

  } catch (error) {
    console.error('Readiness check failed:', error)
    return NextResponse.json(
      { 
        status: 'not_ready', 
        error: 'Readiness check failed',
        timestamp: new Date().toISOString(),
        checks,
        errors: [...errors, `System: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }, 
      { status: 503 }
    )
  }
}

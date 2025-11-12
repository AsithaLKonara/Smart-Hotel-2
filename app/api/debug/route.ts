import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

/**
 * Debug endpoint to check environment variables and database connection
 * This helps diagnose 500 errors in production
 */
export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
    errors: [],
  }

  // Check DATABASE_URL
  try {
    const hasDatabaseUrl = !!process.env.DATABASE_URL
    debugInfo.checks.DATABASE_URL = {
      exists: hasDatabaseUrl,
      value: hasDatabaseUrl 
        ? process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@') 
        : 'NOT SET',
      formatted: hasDatabaseUrl 
        ? process.env.DATABASE_URL.substring(0, 50) + '...' 
        : 'MISSING'
    }
    
    if (!hasDatabaseUrl) {
      debugInfo.errors.push('DATABASE_URL environment variable is not set')
    }
  } catch (error: any) {
    debugInfo.errors.push(`Error checking DATABASE_URL: ${error.message}`)
  }

  // Check NEXTAUTH_URL
  try {
    debugInfo.checks.NEXTAUTH_URL = {
      exists: !!process.env.NEXTAUTH_URL,
      value: process.env.NEXTAUTH_URL || 'NOT SET'
    }
  } catch (error: any) {
    debugInfo.errors.push(`Error checking NEXTAUTH_URL: ${error.message}`)
  }

  // Test database connection
  try {
    debugInfo.checks.databaseConnection = {
      status: 'testing',
      message: 'Attempting to connect...'
    }
    
    await prisma.$connect()
    const userCount = await prisma.user.count().catch(() => 0)
    const roomCount = await prisma.room.count().catch(() => 0)
    
    debugInfo.checks.databaseConnection = {
      status: 'success',
      connected: true,
      userCount,
      roomCount,
      message: 'Database connection successful'
    }
  } catch (error: any) {
    debugInfo.checks.databaseConnection = {
      status: 'failed',
      connected: false,
      error: error.message,
      errorType: error.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
    debugInfo.errors.push(`Database connection failed: ${error.message}`)
  } finally {
    try {
      await prisma.$disconnect()
    } catch (e) {
      // Ignore disconnect errors
    }
  }

  // Check Prisma Client
  try {
    debugInfo.checks.prismaClient = {
      exists: !!prisma,
      type: typeof prisma,
      hasConnect: typeof prisma.$connect === 'function',
      hasDisconnect: typeof prisma.$disconnect === 'function',
    }
  } catch (error: any) {
    debugInfo.errors.push(`Error checking Prisma client: ${error.message}`)
  }

  // Overall status
  debugInfo.status = debugInfo.errors.length === 0 ? 'healthy' : 'unhealthy'
  debugInfo.summary = {
    totalChecks: Object.keys(debugInfo.checks).length,
    passedChecks: Object.values(debugInfo.checks).filter((c: any) => c.status === 'success' || c.exists).length,
    failedChecks: debugInfo.errors.length,
  }

  // Return appropriate status code
  const statusCode = debugInfo.errors.length === 0 ? 200 : 500

  return NextResponse.json(debugInfo, { 
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  })
}


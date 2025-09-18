import { NextResponse } from 'next/server'

/**
 * Liveness probe - checks if the application is running
 * Should be lightweight and not depend on external services
 */
export async function GET() {
  try {
    // Basic application health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }

    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    console.error('Liveness check failed:', error)
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Application not responding',
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    )
  }
}


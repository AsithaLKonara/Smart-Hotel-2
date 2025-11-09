import { NextResponse } from 'next/server'

/**
 * Liveness probe - checks if the application is running
 * Should be lightweight and not depend on external services
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    { status: 200 }
  )
}


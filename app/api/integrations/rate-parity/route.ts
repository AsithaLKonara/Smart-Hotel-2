import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    // CFG-004: Fail-closed on missing secret.
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      console.error('[RATE_PARITY] CRON_SECRET is not configured. Rejecting request.')
      return NextResponse.json({ error: 'Server Misconfiguration' }, { status: 500 })
    }

    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roomTypes = await prisma.roomType.findMany()

    let parityViolations = 0

    for (const room of roomTypes) {
      // Mock: Fetch current rate from OTA scraper API (e.g., Booking.com, Expedia)
      // In production, this would call an external rate shopping service
      const baseRateNumber = room.baseRate.toNumber()
      const mockOtaRate = baseRateNumber * 0.95 // Simulate OTA undercutting direct rate

      // Direct rate parity check: Are we more expensive than OTAs?
      if (baseRateNumber > mockOtaRate) {
        parityViolations++
        
        await prisma.auditLog.create({
          data: {
            action: 'RATE_PARITY_VIOLATION_DETECTED',
            resource: 'ROOM_TYPE',
            resourceId: room.id,
            actor: 'SYSTEM',
            details: {
              directRate: baseRateNumber,
              otaRate: mockOtaRate,
              difference: baseRateNumber - mockOtaRate
            }
          }
        })
        
        // In a real system, you would trigger an alert (e.g. email Revenue Manager)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Rate parity check complete. Found ${parityViolations} violations.`
    })
  } catch (error) {
    console.error('Rate parity check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

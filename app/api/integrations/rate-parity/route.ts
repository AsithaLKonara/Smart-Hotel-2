import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Scheduled cron job to check direct booking rates against OTA scraped rates
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-key'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roomTypes = await prisma.roomType.findMany()

    let parityViolations = 0

    for (const room of roomTypes) {
      // Mock: Fetch current rate from OTA scraper API (e.g., Booking.com, Expedia)
      // In production, this would call an external rate shopping service
      const mockOtaRate = room.baseRate * 0.95 // Simulate OTA undercutting direct rate

      // Direct rate parity check: Are we more expensive than OTAs?
      if (room.baseRate > mockOtaRate) {
        parityViolations++
        
        await prisma.auditLog.create({
          data: {
            action: 'RATE_PARITY_VIOLATION_DETECTED',
            resource: 'ROOM_TYPE',
            resourceId: room.id,
            actor: 'SYSTEM',
            details: {
              directRate: room.baseRate,
              otaRate: mockOtaRate,
              difference: room.baseRate - mockOtaRate
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

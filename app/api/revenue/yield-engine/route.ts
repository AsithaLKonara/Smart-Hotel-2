import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Yield Management AI rule engine
export async function GET(req: Request) {
  try {
    // CFG-004: Fail-closed on missing secret.
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      console.error('[YIELD_ENGINE] CRON_SECRET is not configured. Rejecting request.')
      return NextResponse.json({ error: 'Server Misconfiguration' }, { status: 500 })
    }

    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roomTypes = await prisma.roomType.findMany({
      include: {
        rooms: {
          include: {
            stays: {
              where: {
                status: 'EXPECTED', // Future stays
              }
            }
          }
        }
      }
    })

    let adjustments = 0

    for (const roomType of roomTypes) {
      const totalInventory = roomType.totalRooms
      if (totalInventory === 0) continue

      // Simplistic occupancy calculation for the near future
      let occupiedCount = 0
      roomType.rooms.forEach((room: any) => {
        if (room.stays.length > 0) occupiedCount++
      })

      const occupancyRate = occupiedCount / totalInventory

      // Simple Yield Rules:
      // If occupancy > 80%, increase rate by 15%
      // If occupancy < 30%, decrease rate by 10%
      let newBaseRate = roomType.baseRate

      if (occupancyRate > 0.8) {
        newBaseRate = roomType.baseRate * 1.15
      } else if (occupancyRate < 0.3) {
        newBaseRate = roomType.baseRate * 0.90
      }

      if (newBaseRate !== roomType.baseRate) {
        await prisma.roomType.update({
          where: { id: roomType.id },
          data: { baseRate: newBaseRate }
        })

        await prisma.auditLog.create({
          data: {
            action: 'YIELD_RATE_ADJUSTMENT',
            resource: 'ROOM_TYPE',
            resourceId: roomType.id,
            actor: 'YIELD_ENGINE',
            details: {
              oldRate: roomType.baseRate,
              newRate: newBaseRate,
              occupancyRate
            }
          }
        })
        adjustments++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Yield engine ran successfully. Made ${adjustments} rate adjustments.`
    })
  } catch (error) {
    console.error('Yield Engine error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

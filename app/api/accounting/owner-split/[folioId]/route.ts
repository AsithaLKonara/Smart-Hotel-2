import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Condo-hotel owner split rule
const OWNER_SPLIT_PERCENTAGE = 60 // Owner gets 60%, Hotel Management gets 40%
const MANAGEMENT_FEE_PERCENTAGE = 40

export async function POST(
  req: Request,
  { params }: { params: { folioId: string } }
) {
  try {
    const { folioId } = params

    const folio = await prisma.folio.findUnique({
      where: { id: folioId },
      include: {
        lineItems: true,
        booking: {
          include: {
            roomAssignments: {
              include: {
                room: true
              }
            }
          }
        }
      }
    })

    if (!folio || !folio.booking) {
      return NextResponse.json({ error: 'Folio or booking not found' }, { status: 404 })
    }

    const room = folio.booking.roomAssignments[0]?.room

    if (!room || !room.ownerId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Room is not part of the condo-hotel ownership program' 
      })
    }

    // Only split ROOM_CHARGE category revenue
    let roomRevenue = 0
    folio.lineItems.forEach(item => {
      if (item.category === 'ROOM_CHARGE' && item.amount > 0) {
        roomRevenue += item.amount
      }
    })

    if (roomRevenue <= 0) {
      return NextResponse.json({ success: true, message: 'No room revenue to split' })
    }

    const ownerShare = roomRevenue * (OWNER_SPLIT_PERCENTAGE / 100)
    const managementShare = roomRevenue * (MANAGEMENT_FEE_PERCENTAGE / 100)

    // In a real system, you'd write this to a ledger. We use AuditLog here for simplicity.
    await prisma.auditLog.create({
      data: {
        action: 'OWNER_REVENUE_SPLIT',
        resource: 'ROOM',
        resourceId: room.id,
        actor: 'SYSTEM',
        details: {
          folioId: folio.id,
          ownerId: room.ownerId,
          totalRoomRevenue: roomRevenue,
          ownerShare,
          managementShare,
          splitRatio: `${OWNER_SPLIT_PERCENTAGE}/${MANAGEMENT_FEE_PERCENTAGE}`
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Owner revenue split successfully calculated and logged.',
      breakdown: {
        totalRoomRevenue: roomRevenue,
        ownerShare,
        managementShare
      }
    })

  } catch (error) {
    console.error('Owner accounting error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getRequestSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getRequestSession(req)
    if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'CHECKED_IN'
      },
      include: {
        guest: true,
        roomAssignments: {
          include: {
            room: true
          }
        }
      }
    })

    const formatted = bookings.map((b: any) => ({
      id: b.id,
      guestName: b.guest?.name || 'Unknown',
      roomNumber: b.roomAssignments?.[0]?.room?.number || 'Unassigned',
      confirmationCode: b.confirmationCode
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching active bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
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

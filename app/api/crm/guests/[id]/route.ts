import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const guestId = params.id
    const guest = await prisma.user.findUnique({
      where: { id: guestId },
      include: {
        guestHistory: true,
        loyalty: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          }
        },
        guestPreferences: true,
        guestProfile: true,
        guestBookings: {
          orderBy: { checkIn: 'desc' },
          take: 5,
          include: {
            roomAssignments: {
              include: { room: { select: { number: true, type: { select: { name: true } } } } }
            }
          }
        }
      }
    })

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    return NextResponse.json(guest)
  } catch (error: any) {
    console.error('Fetch Guest Profile Error:', error)
    return NextResponse.json({ error: 'Failed to fetch guest profile' }, { status: 500 })
  }
}

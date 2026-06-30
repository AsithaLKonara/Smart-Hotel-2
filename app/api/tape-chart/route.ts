import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    if (!startDateParam || !endDateParam) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    const startDate = new Date(startDateParam)
    const endDate = new Date(endDateParam)

    const rooms = await prisma.room.findMany({
      where: {
        deletedAt: null
      },
      include: {
        roomType: true
      },
      orderBy: [
        { floor: 'asc' },
        { number: 'asc' }
      ]
    })

    const assignments = await prisma.roomAssignment.findMany({
      where: {
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate }
          }
        ]
      },
      include: {
        booking: {
          include: {
            guest: true
          }
        }
      }
    })

    return NextResponse.json({ rooms, assignments })
  } catch (error: any) {
    console.error('[TAPE_CHART_GET]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

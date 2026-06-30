import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId, startDate, endDate } = await req.json()

    // Validate
    if (!roomId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for conflicts
    const conflictingAssignment = await prisma.roomAssignment.findFirst({
      where: {
        roomId,
        id: { not: params.id },
        status: 'ACTIVE',
        OR: [
          {
            startDate: { lt: new Date(endDate) },
            endDate: { gt: new Date(startDate) }
          }
        ]
      }
    })

    if (conflictingAssignment) {
      return NextResponse.json({ error: 'Room is already assigned during this period' }, { status: 409 })
    }

    const updatedAssignment = await prisma.roomAssignment.update({
      where: { id: params.id },
      data: {
        roomId,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    })

    return NextResponse.json(updatedAssignment)
  } catch (error: any) {
    console.error('[TAPE_CHART_PATCH]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

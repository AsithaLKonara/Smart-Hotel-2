import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const propertyId = req.headers.get('x-property-id')
    if (!propertyId || propertyId === 'all') {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    const activeAttendances = await prisma.attendance.findMany({
      where: {
        employee: { propertyId },
        clockOut: null,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          }
        }
      },
      orderBy: { clockIn: 'desc' },
    })

    return NextResponse.json(activeAttendances)
  } catch (error) {
    console.error('Failed to fetch active attendances:', error)
    return NextResponse.json({ error: 'Failed to fetch active attendances' }, { status: 500 })
  }
}

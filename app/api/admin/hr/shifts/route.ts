import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({
      include: {
        employee: true,
      },
      orderBy: { startTime: 'desc' },
    })
    return NextResponse.json(shifts)
  } catch (error) {
    console.error('Failed to fetch shifts:', error)
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const shift = await prisma.shift.create({
      data: {
        employeeId: data.employeeId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        role: data.role,
        notes: data.notes,
      },
      include: {
        employee: true
      }
    })
    return NextResponse.json(shift, { status: 201 })
  } catch (error) {
    console.error('Failed to create shift:', error)
    return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 })
  }
}

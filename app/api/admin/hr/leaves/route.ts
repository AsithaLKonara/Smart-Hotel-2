import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      include: {
        employee: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(leaves)
  } catch (error) {
    console.error('Failed to fetch leaves:', error)
    return NextResponse.json({ error: 'Failed to fetch leaves' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
      },
      include: {
        employee: true
      }
    })
    return NextResponse.json(leave, { status: 201 })
  } catch (error) {
    console.error('Failed to create leave:', error)
    return NextResponse.json({ error: 'Failed to create leave' }, { status: 500 })
  }
}

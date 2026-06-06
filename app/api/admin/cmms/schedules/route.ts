import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const schedules = await prisma.maintenanceSchedule.findMany({
      include: {
        asset: true,
      },
      orderBy: { nextRun: 'asc' },
    })
    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Failed to fetch schedules:', error)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    // Calculate next run date
    const nextRun = new Date()
    nextRun.setDate(nextRun.getDate() + parseInt(data.frequencyDays))

    const schedule = await prisma.maintenanceSchedule.create({
      data: {
        assetId: data.assetId,
        taskName: data.taskName,
        frequencyDays: parseInt(data.frequencyDays),
        nextRun: nextRun,
        assignedToRole: data.assignedToRole,
      },
      include: {
        asset: true
      }
    })
    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error('Failed to create schedule:', error)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}

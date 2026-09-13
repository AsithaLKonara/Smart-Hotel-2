import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getEffectivePropertyId } from '@/lib/server-rbac'

export async function GET(req: NextRequest) {
  try {
    const propertyId = await getEffectivePropertyId(req)
    const propertyWhere = propertyId && propertyId !== 'all' ? { propertyId } : {}

    const schedules = await prisma.maintenanceSchedule.findMany({
      where: propertyWhere,
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

export async function POST(req: NextRequest) {
  try {
    const propertyId = await getEffectivePropertyId(req)
    if (!propertyId || propertyId === 'all') {
      return NextResponse.json({ error: 'Valid property context is required' }, { status: 400 })
    }

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
        propertyId: propertyId,
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

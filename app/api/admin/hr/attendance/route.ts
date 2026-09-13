import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { handleZodError } from '@/lib/api-utils'

const manualClockInSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  clockInTime: z.string().min(1, "Clock-In Time is required")
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const result = manualClockInSchema.safeParse(json)
    
    if (!result.success) {
      return handleZodError(result.error)
    }

    const { employeeId, clockInTime } = result.data

    // Check if the employee is already clocked in
    const active = await prisma.attendance.findFirst({
      where: { employeeId, clockOut: null }
    })

    if (active) {
      return NextResponse.json({ error: 'Employee is already clocked in' }, { status: 400 })
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: new Date(clockInTime),
        clockIn: new Date(clockInTime),
        status: 'PRESENT'
      }
    })

    // Try to find a scheduled shift for this employee today and mark it IN_PROGRESS
    const startOfDay = new Date(clockInTime)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(clockInTime)
    endOfDay.setHours(23, 59, 59, 999)

    const pendingShift = await prisma.shift.findFirst({
      where: {
        employeeId,
        status: 'SCHEDULED',
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: { startTime: 'asc' }
    })

    if (pendingShift) {
      await prisma.shift.update({
        where: { id: pendingShift.id },
        data: { status: 'IN_PROGRESS' }
      })
    }

    return NextResponse.json(attendance, { status: 201 })
  } catch (error) {
    console.error('Failed to manually clock in:', error)
    return NextResponse.json({ error: 'Failed to create attendance record' }, { status: 500 })
  }
}

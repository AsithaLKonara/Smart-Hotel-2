import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const propertyId = req.headers.get('x-property-id')

    // Find if the user is an employee
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id }
    })

    if (!employee) {
      return NextResponse.json({ isEmployee: false })
    }

    // Ensure they belong to the active property if one is provided
    if (propertyId && propertyId !== 'all' && employee.propertyId !== propertyId) {
       return NextResponse.json({ isEmployee: false })
    }

    // Find their active attendance record
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        clockOut: null
      },
      orderBy: { clockIn: 'desc' }
    })

    return NextResponse.json({
      isEmployee: true,
      employeeId: employee.id,
      activeAttendance
    })
  } catch (error) {
    console.error('Error fetching staff attendance status:', error)
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({ where: { userId: session.user.id } })
    if (!employee) return NextResponse.json({ error: 'Not an employee' }, { status: 403 })

    // Check if already clocked in
    const active = await prisma.attendance.findFirst({
      where: { employeeId: employee.id, clockOut: null }
    })

    if (active) {
      return NextResponse.json({ error: 'Already clocked in' }, { status: 400 })
    }

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date: new Date(),
        clockIn: new Date(),
        status: 'PRESENT'
      }
    })

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const pendingShift = await prisma.shift.findFirst({
      where: {
        employeeId: employee.id,
        status: 'SCHEDULED',
        startTime: { gte: startOfDay, lte: endOfDay }
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
    console.error('Error clocking in:', error)
    return NextResponse.json({ error: 'Failed to clock in' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employee = await prisma.employee.findUnique({ where: { userId: session.user.id } })
    if (!employee) return NextResponse.json({ error: 'Not an employee' }, { status: 403 })

    const { attendanceId } = await req.json()
    if (!attendanceId) return NextResponse.json({ error: 'Attendance ID required' }, { status: 400 })

    const active = await prisma.attendance.findUnique({ where: { id: attendanceId } })
    if (!active || active.employeeId !== employee.id || active.clockOut) {
      return NextResponse.json({ error: 'Invalid active shift' }, { status: 400 })
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        clockOut: new Date(),
        status: 'COMPLETED'
      }
    })

    const startOfDay = new Date(active.clockIn)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(active.clockIn)
    endOfDay.setHours(23, 59, 59, 999)

    const activeShift = await prisma.shift.findFirst({
      where: {
        employeeId: employee.id,
        status: 'IN_PROGRESS',
        startTime: { gte: startOfDay, lte: endOfDay }
      }
    })

    if (activeShift) {
      await prisma.shift.update({
        where: { id: activeShift.id },
        data: { status: 'COMPLETED' }
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error clocking out:', error)
    return NextResponse.json({ error: 'Failed to clock out' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const attendance = await prisma.attendance.findUnique({
      where: { id }
    })

    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    // LOCK ENFORCEMENT: Check if the attendance date falls within a finalized payroll run
    const overlappingPayroll = await prisma.payrollRun.findFirst({
      where: {
        status: 'FINALIZED',
        periodStart: { lte: attendance.date },
        periodEnd: { gte: attendance.date }
      }
    })

    if (overlappingPayroll) {
      return NextResponse.json(
        { error: 'MUTATION_LOCKED: Attendance record belongs to a finalized payroll ledger.' },
        { status: 423 } // 423 Locked
      )
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        clockOut: body.clockOut ? new Date(body.clockOut) : undefined,
        status: body.status,
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[Attendance Update Error]:', error)
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 })
  }
}

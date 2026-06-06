import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const payrolls = await prisma.payrollRecord.findMany({
      include: {
        employee: true,
      },
      orderBy: { periodStart: 'desc' },
    })
    return NextResponse.json(payrolls)
  } catch (error) {
    console.error('Failed to fetch payrolls:', error)
    return NextResponse.json({ error: 'Failed to fetch payrolls' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    // Auto-calculate Net Pay
    const baseAmount = parseFloat(data.baseAmount)
    const overtimeAmount = parseFloat(data.overtimeAmount || 0)
    const bonuses = parseFloat(data.bonuses || 0)
    const deductions = parseFloat(data.deductions || 0)
    
    const netPay = (baseAmount + overtimeAmount + bonuses) - deductions

    const payroll = await prisma.payrollRecord.create({
      data: {
        employeeId: data.employeeId,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        baseAmount,
        overtimeAmount,
        bonuses,
        deductions,
        netPay,
        status: data.status || 'DRAFT'
      },
      include: {
        employee: true
      }
    })
    return NextResponse.json(payroll, { status: 201 })
  } catch (error) {
    console.error('Failed to create payroll:', error)
    return NextResponse.json({ error: 'Failed to create payroll' }, { status: 500 })
  }
}

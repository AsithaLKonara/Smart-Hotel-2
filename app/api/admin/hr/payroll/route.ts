import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const payrolls = await prisma.payrollRecord.findMany({
      include: {
        employee: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({ payrolls, pagination: null })
  } catch (error) {
    console.error('Error fetching payrolls:', error)
    return NextResponse.json({ error: 'Failed to fetch payrolls' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.employeeId || !data.periodStart || !data.periodEnd) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const baseAmount = Number(data.baseAmount || 0)
    const overtimeAmount = Number(data.overtimeAmount || 0)
    const bonuses = Number(data.bonuses || 0)
    const deductions = Number(data.deductions || 0)
    const netPay = baseAmount + overtimeAmount + bonuses - deductions

    const record = await prisma.payrollRecord.create({
      data: {
        employeeId: data.employeeId,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        baseAmount,
        overtimeAmount,
        bonuses,
        deductions,
        netPay,
        status: 'PAID', // or DRAFT based on your business logic, the UI shows PAID/DRAFT.
        paidAt: new Date(),
      },
      include: {
        employee: true
      }
    })

    return NextResponse.json({ success: true, payroll: record })
  } catch (error) {
    console.error('Error creating payroll record:', error)
    return NextResponse.json({ error: 'Failed to generate payroll record' }, { status: 500 })
  }
}

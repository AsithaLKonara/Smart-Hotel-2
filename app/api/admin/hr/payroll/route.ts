import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { periodStart, periodEnd } = await request.json()

    if (!periodStart || !periodEnd) {
      return NextResponse.json({ error: 'Missing period dates' }, { status: 400 })
    }

    const start = new Date(periodStart)
    const end = new Date(periodEnd)

    // Atomic Payroll Finalization
    const payrollRun = await prisma.$transaction(async (tx: any) => {
      // 1. Gather all active employees
      const employees = await tx.employee.findMany({
        where: { status: 'ACTIVE' },
        include: {
          attendance: {
            where: {
              date: { gte: start, lte: end }
            }
          }
        }
      })

      let totalRunAmount = 0

      // 2. Create Payroll Run
      const run = await tx.payrollRun.create({
        data: {
          periodStart: start,
          periodEnd: end,
          status: 'FINALIZED',
          totalAmount: 0 // Will update after summation
        }
      })

      // 3. Process each employee
      for (const emp of employees) {
        // Simplified Logic: baseSalary + attendance
        const basePay = emp.baseSalary;
        let deductions = 0;
        let overtimePay = 0;

        // Example attendance deduction (missing days)
        const daysPresent = emp.attendance.length;
        if (daysPresent < 20) {
          deductions = (20 - daysPresent) * (basePay / 20) * 0.5; // Half-day deduction
        }

        const netPay = Math.max(0, basePay + overtimePay - deductions);
        totalRunAmount += netPay;

        await tx.payrollLineItem.create({
          data: {
            payrollRunId: run.id,
            employeeId: emp.id,
            basePay,
            overtimePay,
            deductions,
            netPay
          }
        })
      }

      // 4. Update Run Total
      await tx.payrollRun.update({
        where: { id: run.id },
        data: { totalAmount: totalRunAmount }
      })

      // 5. Enterprise Ledger Integration
      await tx.journalEntry.create({
        data: {
          accountId: 'PAYROLL-EXPENSE',
          debit: totalRunAmount,
          credit: 0,
          description: `Payroll Ledger Run ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`,
          postingDate: new Date(),
        }
      })

      return run
    })

    return NextResponse.json({ success: true, payrollRun })
  } catch (error) {
    console.error('[Payroll Ledger Error]:', error)
    return NextResponse.json({ error: 'Failed to generate finalized payroll ledger' }, { status: 500 })
  }
}

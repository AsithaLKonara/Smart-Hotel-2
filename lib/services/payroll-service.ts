import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'

export interface PayrollRunDTO {
  periodStart: Date | string
  periodEnd: Date | string
  defaultTaxRate?: number // e.g., 0.15 (15% standard federal/state deduction)
}

/**
 * Service: Workforce Payroll & Line-Item Itemization Engine
 * Purpose: Activating dead schema model PayrollLineItem
 */
export class PayrollService {
  /**
   * Executes a bi-weekly or monthly payroll calculation run across all active employees.
   * Itemizes specific base wage, overtime pay, and tax deduction figures into PayrollLineItem.
   */
  static async executePayrollRun(dto: PayrollRunDTO) {
    const start = new Date(dto.periodStart)
    const end = new Date(dto.periodEnd)
    const taxRate = dto.defaultTaxRate ?? 0.15

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Fetch active staff list
      const employees = await tx.employee.findMany({
        where: { status: 'ACTIVE' },
        include: {
          shifts: {
            where: {
              startTime: { gte: start },
              endTime: { lte: end },
              status: 'COMPLETED'
            }
          }
        }
      })

      if (employees.length === 0) {
        throw new Error('No active employees found for payroll generation')
      }

      // 2. Create parent PayrollRun header
      const payrollRun = await tx.payrollRun.create({
        data: {
          periodStart: start,
          periodEnd: end,
          status: 'COMPLETED',
          totalAmount: 0 // Will accumulate and update below
        }
      })

      let runTotalAmount = 0
      const lineItems = []

      // 3. Generate itemized PayrollLineItem rows per employee (Activating Dead Schema: PayrollLineItem)
      for (const emp of employees) {
        const baseSalary = Number(emp.baseSalary || 0)
        
        // Calculate standard base pay for period (approx bi-weekly fractional split if annual, or flat base)
        const basePay = baseSalary > 0 ? baseSalary / 24 : 1500.00 // fallback standard wage if unconfigured
        
        // Estimate overtime from completed shifts exceeding standard 8h duration
        let overtimePay = 0
        for (const shift of emp.shifts) {
          const durationHours = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60)
          if (durationHours > 8) {
            const otHours = durationHours - 8
            const hourlyRate = (basePay / 80) * 1.5 // 1.5x overtime rate
            overtimePay += otHours * hourlyRate
          }
        }

        const grossPay = basePay + overtimePay
        const deductions = Number((grossPay * taxRate).toFixed(2))
        const netPay = Number((grossPay - deductions).toFixed(2))

        const lineItem = await tx.payrollLineItem.create({
          data: {
            payrollRunId: payrollRun.id,
            employeeId: emp.id,
            basePay: Number(basePay.toFixed(2)),
            overtimePay: Number(overtimePay.toFixed(2)),
            deductions,
            netPay
          }
        })

        // Also record paired employee PayrollRecord ledger
        await tx.payrollRecord.create({
          data: {
            employeeId: emp.id,
            periodStart: start,
            periodEnd: end,
            baseAmount: Number(basePay.toFixed(2)),
            overtimeAmount: Number(overtimePay.toFixed(2)),
            deductions,
            bonuses: 0,
            netPay,
            status: 'FINALIZED',
            paidAt: new Date()
          }
        })

        runTotalAmount += netPay
        lineItems.push(lineItem)
      }

      // 4. Update master payroll run sum
      const finalizedRun = await tx.payrollRun.update({
        where: { id: payrollRun.id },
        data: { totalAmount: Number(runTotalAmount.toFixed(2)) }
      })

      return {
        payrollRun: finalizedRun,
        lineItemsCount: lineItems.length,
        totalDisbursed: runTotalAmount
      }
    })
  }

  /**
   * Retrieves all completed payroll runs alongside their itemized staff wage details.
   */
  static async getPayrollRuns() {
    return await prisma.payrollRun.findMany({
      include: {
        lineItems: {
          include: { employee: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }
}

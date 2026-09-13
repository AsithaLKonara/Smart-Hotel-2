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

    // 0. Prevent overlapping payroll runs (Critical Audit Fix)
    const existingRun = await prisma.payrollRun.findFirst({
      where: {
        OR: [
          { periodStart: { lte: end }, periodEnd: { gte: start } }
        ]
      }
    })

    if (existingRun) {
      throw new Error(`A payroll run already exists that overlaps with this period (${start.toLocaleDateString()} - ${end.toLocaleDateString()}).`)
    }

    // 1. Fetch active staff list OUTSIDE the transaction to prevent locking
    const employees = await prisma.employee.findMany({
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

    // Prepare in-memory calculation logic
    let runTotalAmount = 0
    const lineItemsData: any[] = []
    const recordsData: any[] = []

    for (const emp of employees) {
      const baseSalary = Number(emp.baseSalary || 0)
      
      // Calculate standard base pay for period (approx bi-weekly fractional split if annual, or flat base)
      const basePay = baseSalary > 0 ? baseSalary / 24 : 0
      
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

      runTotalAmount += netPay

      lineItemsData.push({
        employeeId: emp.id,
        basePay: Number(basePay.toFixed(2)),
        overtimePay: Number(overtimePay.toFixed(2)),
        deductions,
        netPay
      })

      recordsData.push({
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
      })
    }

    // 2. Fast Batch Transaction
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create parent PayrollRun header
      const payrollRun = await tx.payrollRun.create({
        data: {
          periodStart: start,
          periodEnd: end,
          status: 'COMPLETED',
          totalAmount: 0 // Will accumulate and update below
        }
      })

      // Link foreign key now that we have the header ID
      lineItemsData.forEach(li => li.payrollRunId = payrollRun.id)

      // Batch insert thousands of records efficiently
      await tx.payrollLineItem.createMany({ data: lineItemsData })
      await tx.payrollRecord.createMany({ data: recordsData })

      // Update master payroll run sum
      const finalizedRun = await tx.payrollRun.update({
        where: { id: payrollRun.id },
        data: { totalAmount: Number(runTotalAmount.toFixed(2)) }
      })

      return {
        payrollRun: finalizedRun,
        lineItemsCount: lineItemsData.length,
        totalDisbursed: runTotalAmount
      }
    }, { timeout: 15000 })
  }

  /**
   * Retrieves all completed payroll runs alongside their itemized staff wage details.
   */
  static async getPayrollRuns(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit
    const [runs, total] = await prisma.$transaction([
      prisma.payrollRun.findMany({
        skip,
        take: limit,
        include: {
          lineItems: {
            include: { employee: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payrollRun.count()
    ])

    return {
      runs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Retrieves a single payroll run by its ID, including all itemized line items and associated employee records.
   */
  static async getPayrollRunById(id: string) {
    const run = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        lineItems: {
          include: { employee: true },
          orderBy: { employee: { firstName: 'asc' } }
        }
      }
    })

    if (!run) {
      throw new Error('Payroll run not found')
    }

    return run
  }
}

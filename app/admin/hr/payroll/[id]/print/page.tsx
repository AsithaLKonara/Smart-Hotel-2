import prisma from '@/lib/db'
import { notFound } from 'next/navigation'
import PrintPayslipClient from './client'

export default async function PrintPayslipPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
  const payslip = await prisma.payrollRecord.findUnique({
    where: { id: params.id },
    include: {
      employee: true
    }
  })

  if (!payslip) {
    notFound()
  }

  // Convert Decimals to Numbers for the Client Component
  const serializedPayslip = {
    ...payslip,
    baseAmount: Number(payslip.baseAmount),
    overtimeAmount: Number(payslip.overtimeAmount),
    bonuses: Number(payslip.bonuses),
    deductions: Number(payslip.deductions),
    netPay: Number(payslip.netPay),
    employee: payslip.employee ? {
      ...payslip.employee,
      baseSalary: Number(payslip.employee.baseSalary)
    } : null
  }

  return (
    <>
      <PrintPayslipClient payslip={serializedPayslip} />
    </>
  )
}

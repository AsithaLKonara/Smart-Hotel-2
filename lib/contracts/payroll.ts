import { z } from 'zod'

export const PayrollSchema = z.object({
  employeeId: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  overtimeAmount: z.number().min(0).default(0),
  bonuses: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  status: z.string().optional().default('DRAFT')
})

export type PayrollRequest = z.infer<typeof PayrollSchema>

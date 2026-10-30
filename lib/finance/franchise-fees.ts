import { prisma } from '@/lib/db'

export interface FranchiseFeeSchedule {
  royaltyPercentage: number // Default: 3.0%
  marketingPercentage: number // Default: 2.0%
  techFeePerOccupiedNight: number // Default: $3.50 per room night
}

export interface PropertyFeeAssessment {
  propertyId: string
  propertyName: string
  propertyCode: string
  billingMonth: string // e.g. "2026-10"
  grossRevenue: number
  roomNightsSold: number
  fees: {
    royaltyFee: number
    marketingFee: number
    techFee: number
    totalFeeDue: number
  }
}

export interface ChainFranchiseFeesReport {
  billingMonth: string
  totalPropertiesAssessed: number
  totalGrossRevenue: number
  totalChainFeesDue: number
  scheduleApplied: FranchiseFeeSchedule
  propertyAssessments: PropertyFeeAssessment[]
}

const DEFAULT_FEE_SCHEDULE: FranchiseFeeSchedule = {
  royaltyPercentage: 3.0,
  marketingPercentage: 2.0,
  techFeePerOccupiedNight: 3.5
}

/**
 * Calculates monthly franchise fees and brand management royalties across all properties
 */
export async function calculateChainFranchiseFees(
  billingMonth: string, // YYYY-MM
  schedule: Partial<FranchiseFeeSchedule> = {}
): Promise<ChainFranchiseFeesReport> {
  const feeSchedule: FranchiseFeeSchedule = {
    ...DEFAULT_FEE_SCHEDULE,
    ...schedule
  }

  const [yearStr, monthStr] = billingMonth.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)

  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59))

  const properties = await prisma.property.findMany({
    where: { status: 'ACTIVE' },
    include: {
      bookings: {
        where: {
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
          checkIn: { lte: endDate },
          checkOut: { gte: startDate }
        }
      }
    }
  })

  let totalGrossRevenue = 0
  let totalChainFeesDue = 0
  const propertyAssessments: PropertyFeeAssessment[] = []

  for (const prop of properties) {
    let grossRev = 0
    let nightsSold = 0

    for (const bkg of prop.bookings) {
      grossRev += Number(bkg.totalAmount)
      const nights = Math.max(
        1,
        Math.round((bkg.checkOut.getTime() - bkg.checkIn.getTime()) / (1000 * 60 * 60 * 24))
      )
      nightsSold += nights
    }

    // Apply corporate brand formulas
    const royaltyFee = Math.round((grossRev * (feeSchedule.royaltyPercentage / 100)) * 100) / 100
    const marketingFee = Math.round((grossRev * (feeSchedule.marketingPercentage / 100)) * 100) / 100
    const techFee = Math.round((nightsSold * feeSchedule.techFeePerOccupiedNight) * 100) / 100
    const totalFeeDue = Math.round((royaltyFee + marketingFee + techFee) * 100) / 100

    totalGrossRevenue += grossRev
    totalChainFeesDue += totalFeeDue

    propertyAssessments.push({
      propertyId: prop.id,
      propertyName: prop.name,
      propertyCode: prop.code,
      billingMonth,
      grossRevenue: Math.round(grossRev * 100) / 100,
      roomNightsSold: nightsSold,
      fees: {
        royaltyFee,
        marketingFee,
        techFee,
        totalFeeDue
      }
    })
  }

  return {
    billingMonth,
    totalPropertiesAssessed: properties.length,
    totalGrossRevenue: Math.round(totalGrossRevenue * 100) / 100,
    totalChainFeesDue: Math.round(totalChainFeesDue * 100) / 100,
    scheduleApplied: feeSchedule,
    propertyAssessments
  }
}

/**
 * Assesses and commits monthly franchise fee invoices with double-entry journal postings
 */
export async function assessAndPostFranchiseFees(params: {
  billingMonth: string
  propertyId: string
  customSchedule?: Partial<FranchiseFeeSchedule>
  actorUserId?: string
}) {
  const { billingMonth, propertyId, customSchedule } = params

  const chainReport = await calculateChainFranchiseFees(billingMonth, customSchedule)
  const assessment = chainReport.propertyAssessments.find((p) => p.propertyId === propertyId)

  if (!assessment) {
    throw new Error(`Property ${propertyId} assessment not found`)
  }

  const transactionId = `HQ-ROYALTY-${billingMonth}-${assessment.propertyCode}`
  const now = new Date()

  // Post Double-Entry Journal Entries:
  // In Property Ledger:
  // Debit: CORPORATE_FRANCHISE_FEE_EXPENSE
  // Credit: DUE_TO_CORPORATE_HQ
  await prisma.$transaction([
    prisma.journalEntry.create({
      data: {
        transactionId,
        accountId: `FRANCHISE_EXPENSE_${assessment.propertyId}`,
        debit: assessment.fees.totalFeeDue,
        credit: 0,
        description: `[Corporate Royalty] Month ${billingMonth} Brand & System Fees`,
        postingDate: now
      }
    }),
    prisma.journalEntry.create({
      data: {
        transactionId,
        accountId: `DUE_TO_HQ_${assessment.propertyId}`,
        debit: 0,
        credit: assessment.fees.totalFeeDue,
        description: `[HQ Payable] Month ${billingMonth} Brand & System Fees Due`,
        postingDate: now
      }
    })
  ])

  return {
    success: true,
    transactionId,
    billingMonth,
    assessment,
    postedAt: now.toISOString()
  }
}

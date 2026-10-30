import { prisma } from '@/lib/db'

export interface InterCompanyChargeInput {
  debtorPropertyId: string // Property A (e.g., Guest staying here owes the money)
  creditorPropertyId: string // Property B (e.g., Restaurant/Spa provided service)
  amount: number
  category: 'F_AND_B' | 'SPA' | 'TRANSPORT' | 'LINEN_AMENITIES' | 'GUEST_RELOCATION'
  referenceId: string // Folio, Order, or Booking ID
  description: string
  postingDate?: Date
}

export interface InterCompanyBilateralStatement {
  propertyA: {
    id: string
    name: string
    code: string
  }
  propertyB: {
    id: string
    name: string
    code: string
  }
  propertyADueFromB: number // What B owes A
  propertyADueToB: number // What A owes B
  netClearingBalance: number // Positive: B owes A, Negative: A owes B
  settlementStatus: 'PROPERTY_A_OWES_B' | 'PROPERTY_B_OWES_A' | 'SETTLED_IN_BALANCE'
  recentTransactions: {
    transactionId: string
    postingDate: string
    description: string
    amount: number
  }[]
}

/**
 * Records a 4-legged balanced inter-company transaction across sister properties (USALI Standard)
 */
export async function recordInterCompanyCrossCharge(input: InterCompanyChargeInput) {
  const {
    debtorPropertyId,
    creditorPropertyId,
    amount,
    category,
    referenceId,
    description,
    postingDate = new Date()
  } = input

  if (debtorPropertyId === creditorPropertyId) {
    throw new Error('Inter-company charges must be between two different properties')
  }

  if (amount <= 0) {
    throw new Error('Charge amount must be positive')
  }

  const [propA, propB] = await Promise.all([
    prisma.property.findUnique({ where: { id: debtorPropertyId }, select: { id: true, name: true, code: true } }),
    prisma.property.findUnique({ where: { id: creditorPropertyId }, select: { id: true, name: true, code: true } })
  ])

  if (!propA || !propB) {
    throw new Error('Both debtor and creditor properties must exist')
  }

  const transactionId = `IC-TX-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  // 4-Legged USALI Double Entry:
  // Leg 1: Debtor Property (Property A) Debits Guest Folio/Receivable
  // Leg 2: Debtor Property (Property A) Credits Due-To Property B
  // Leg 3: Creditor Property (Property B) Debits Due-From Property A
  // Leg 4: Creditor Property (Property B) Credits Department Revenue
  const entries = await prisma.$transaction([
    // Leg 1: Debtor Property A Guest Ledger
    prisma.journalEntry.create({
      data: {
        transactionId,
        accountId: `GUEST_LEDGER_${propA.id}`,
        debit: amount,
        credit: 0,
        description: `[Inter-Co Charge] ${description} (Ref: ${referenceId})`,
        postingDate
      }
    }),
    // Leg 2: Debtor Property A Due-To Property B
    prisma.journalEntry.create({
      data: {
        transactionId,
        accountId: `DUE_TO_PROPERTY_${propB.id}`,
        debit: 0,
        credit: amount,
        description: `[Inter-Co Payable] Due to ${propB.name} (${propB.code}) for ${category}`,
        postingDate
      }
    }),
    // Leg 3: Creditor Property B Due-From Property A
    prisma.journalEntry.create({
      data: {
        transactionId,
        accountId: `DUE_FROM_PROPERTY_${propA.id}`,
        debit: amount,
        credit: 0,
        description: `[Inter-Co Receivable] Due from ${propA.name} (${propA.code}) for ${category}`,
        postingDate
      }
    }),
    // Leg 4: Creditor Property B Department Revenue
    prisma.journalEntry.create({
      data: {
        transactionId,
        accountId: `REVENUE_${category}_${propB.id}`,
        debit: 0,
        credit: amount,
        description: `[Inter-Co Revenue] Service provided to ${propA.code} guest (Ref: ${referenceId})`,
        postingDate
      }
    })
  ])

  return {
    success: true,
    transactionId,
    amount,
    debtorProperty: propA,
    creditorProperty: propB,
    category,
    entriesCount: entries.length,
    balanced: true
  }
}

/**
 * Calculates bilateral Due-To / Due-From Statement and net clearing balance
 */
export async function getInterCompanyStatement(
  propertyAId: string,
  propertyBId: string
): Promise<InterCompanyBilateralStatement> {
  const [propA, propB] = await Promise.all([
    prisma.property.findUnique({ where: { id: propertyAId }, select: { id: true, name: true, code: true } }),
    prisma.property.findUnique({ where: { id: propertyBId }, select: { id: true, name: true, code: true } })
  ])

  if (!propA || !propB) {
    throw new Error('Both properties must exist')
  }

  // Find all journal entries between these two properties
  const entries = await prisma.journalEntry.findMany({
    where: {
      OR: [
        { accountId: `DUE_FROM_PROPERTY_${propB.id}` }, // What B owes A
        { accountId: `DUE_TO_PROPERTY_${propB.id}` }, // What A owes B
        { accountId: `DUE_FROM_PROPERTY_${propA.id}` }, // What A owes B (from B's perspective)
        { accountId: `DUE_TO_PROPERTY_${propA.id}` } // What B owes A (from B's perspective)
      ]
    },
    orderBy: { createdAt: 'desc' }
  })

  let propertyADueFromB = 0 // What B owes A
  let propertyADueToB = 0 // What A owes B

  for (const entry of entries) {
    if (entry.accountId === `DUE_FROM_PROPERTY_${propB.id}`) {
      propertyADueFromB += Number(entry.debit) - Number(entry.credit)
    } else if (entry.accountId === `DUE_TO_PROPERTY_${propB.id}`) {
      propertyADueToB += Number(entry.credit) - Number(entry.debit)
    }
  }

  const netClearingBalance = propertyADueFromB - propertyADueToB
  let settlementStatus: InterCompanyBilateralStatement['settlementStatus'] = 'SETTLED_IN_BALANCE'

  if (netClearingBalance > 0) {
    settlementStatus = 'PROPERTY_B_OWES_A'
  } else if (netClearingBalance < 0) {
    settlementStatus = 'PROPERTY_A_OWES_B'
  }

  const recentTransactions = entries.slice(0, 10).map((e) => ({
    transactionId: e.transactionId || e.id,
    postingDate: e.postingDate.toISOString().split('T')[0],
    description: e.description,
    amount: Number(e.debit) > 0 ? Number(e.debit) : Number(e.credit)
  }))

  return {
    propertyA: propA,
    propertyB: propB,
    propertyADueFromB: Math.max(0, propertyADueFromB),
    propertyADueToB: Math.max(0, propertyADueToB),
    netClearingBalance: Math.round(netClearingBalance * 100) / 100,
    settlementStatus,
    recentTransactions
  }
}

/**
 * Clears and settles outstanding bilateral inter-company balance
 */
export async function settleInterCompanyBalance(params: {
  payingPropertyId: string
  receivingPropertyId: string
  settleAmount: number
  settlementReference?: string
}) {
  const { payingPropertyId, receivingPropertyId, settleAmount, settlementReference } = params

  if (settleAmount <= 0) {
    throw new Error('Settlement amount must be positive')
  }

  const [payingProp, receivingProp] = await Promise.all([
    prisma.property.findUnique({ where: { id: payingPropertyId }, select: { id: true, name: true, code: true } }),
    prisma.property.findUnique({ where: { id: receivingPropertyId }, select: { id: true, name: true, code: true } })
  ])

  if (!payingProp || !receivingProp) {
    throw new Error('Both properties must exist')
  }

  const transactionId = `IC-SETTLE-${Date.now()}`
  const now = new Date()

  // Settle clearing entry:
  // Paying property: Debit DUE_TO_PROPERTY, Credit BANK_CASH
  // Receiving property: Debit BANK_CASH, Credit DUE_FROM_PROPERTY
  await prisma.$transaction([
    prisma.journalEntry.create({
      data: {
        transactionId,
        accountId: `DUE_TO_PROPERTY_${receivingProp.id}`,
        debit: settleAmount,
        credit: 0,
        description: `[Inter-Co Settlement] Payment to ${receivingProp.name} (Ref: ${settlementReference || transactionId})`,
        postingDate: now
      }
    }),
    prisma.journalEntry.create({
      data: {
        transactionId,
        accountId: `BANK_CASH_${payingProp.id}`,
        debit: 0,
        credit: settleAmount,
        description: `[Inter-Co Settlement Outflow] Transfer to ${receivingProp.code}`,
        postingDate: now
      }
    }),
    prisma.journalEntry.create({
      data: {
        transactionId,
        accountId: `BANK_CASH_${receivingProp.id}`,
        debit: settleAmount,
        credit: 0,
        description: `[Inter-Co Settlement Inflow] Transfer from ${payingProp.code}`,
        postingDate: now
      }
    }),
    prisma.journalEntry.create({
      data: {
        transactionId,
        accountId: `DUE_FROM_PROPERTY_${payingProp.id}`,
        debit: 0,
        credit: settleAmount,
        description: `[Inter-Co Cleared] Cleared by ${payingProp.name} (Ref: ${settlementReference || transactionId})`,
        postingDate: now
      }
    })
  ])

  return {
    success: true,
    transactionId,
    settleAmount,
    payingProperty: payingProp,
    receivingProperty: receivingProp,
    settledAt: now.toISOString()
  }
}

import prisma from '@/lib/db'
import { Prisma } from '@prisma/client'

export interface ChargePayload {
  bookingId: string
  amount: number
  category: string
  description: string
  transactionCodeId?: string
}

export async function postCharge(payload: ChargePayload, tx?: any) {
  const db = tx || prisma
  // 1. Get all open folios for this booking
  const folios = await db.folio.findMany({
    where: { bookingId: payload.bookingId, status: 'OPEN' },
    include: {
      routingRulesSource: true
    },
    orderBy: { windowNumber: 'asc' }
  })

  if (folios.length === 0) {
    throw new Error('No open folio found for this booking.')
  }

  // 2. The primary folio is Window 1 (Guest Folio)
  let targetFolioId = folios[0].id // Default to first folio
  const primaryFolio = folios.find((f: any) => f.windowNumber === 1) || folios[0]
  targetFolioId = primaryFolio.id

  let isRouted = false

  // 3. Evaluate routing rules from the primary folio
  // If there's a routing rule matching the category, route to the target folio
  for (const rule of primaryFolio.routingRulesSource) {
    const criteria = rule.criteria as { category?: string, transactionCodeId?: string }
    
    let matches = false
    if (criteria.category && criteria.category === payload.category) {
      matches = true
    }
    if (criteria.transactionCodeId && criteria.transactionCodeId === payload.transactionCodeId) {
      matches = true
    }

    if (matches) {
      // Rule matched, override target folio
      targetFolioId = rule.targetFolioId
      isRouted = true
      break
    }
  }

  // 4. Post the charge to the chosen folio
  const lineItem = await db.folioLineItem.create({
    data: {
      folioId: targetFolioId,
      amount: payload.amount,
      category: payload.category,
      description: payload.description,
      transactionCodeId: payload.transactionCodeId,
      isRouted: isRouted
    }
  })

  // 5. Create a Journal Entry for strictly double-entry accounting (simplified)
  // Debit Accounts Receivable (Guest Ledger), Credit Revenue
  await db.journalEntry.create({
    data: {
      accountId: 'AR-GUEST-LEDGER',
      debit: payload.amount,
      credit: 0,
      description: `AR: ${payload.description}`,
      postingDate: new Date(),
    }
  })

  await db.journalEntry.create({
    data: {
      accountId: `REV-${payload.category}`,
      debit: 0,
      credit: payload.amount,
      description: `Revenue: ${payload.description}`,
      postingDate: new Date(),
    }
  })

  return {
    success: true,
    lineItem,
    targetFolioId,
    isRouted
  }
}

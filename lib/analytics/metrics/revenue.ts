import prisma from '@/lib/db'

export async function getRevenueMetrics(params: {
  propertyId?: string
  startDate?: Date
  endDate?: Date
}) {
  const { propertyId, startDate, endDate } = params

  const whereFolio = {
    ...(propertyId && { propertyId }),
    ...(startDate && endDate && {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    })
  }

  // 1. Calculate Folio Items breakdown (Actual realized revenue)
  const folioItems = await prisma.folioLineItem.groupBy({
    by: ['category'],
    where: {
      folio: whereFolio
    },
    _sum: {
      amount: true
    }
  })

  // Ensure canonical definitions
  const breakdown = {
    ROOMS: 0,
    FNB: 0,
    EVENTS: 0,
    SPA: 0,
    OTHER: 0
  }

  folioItems.forEach((item: any) => {
    const val = item._sum.amount ? item._sum.amount.toNumber() : 0
    if (item.category === 'ROOM_CHARGE') breakdown.ROOMS += val
    else if (item.category === 'FOOD_AND_BEVERAGE' || item.category === 'MINIBAR') breakdown.FNB += val
    else breakdown.OTHER += val // Add SPA/EVENTS mapping when folios support it
  })

  // 2. Fetch POS explicitly (if not all POS is routed to folios yet)
  const posOrders = await prisma.internalOrder.aggregate({
    _sum: { totalAmount: true },
    where: {
      status: 'COMPLETED',
      ...(propertyId && { outlet: { propertyId } }),
      ...(startDate && endDate && { createdAt: { gte: startDate, lte: endDate } })
    }
  })

  // Add stand-alone POS to F&B if it hasn't been charged to a room folio
  // (In a true unified engine, we'd ensure no double counting. For now we assume stand-alone POS isn't in FolioItems)
  breakdown.FNB += posOrders._sum.totalAmount ? posOrders._sum.totalAmount.toNumber() : 0

  const totalRevenue = Object.values(breakdown).reduce((a, b) => a + b, 0)

  return {
    totalRevenue,
    breakdown,
  }
}

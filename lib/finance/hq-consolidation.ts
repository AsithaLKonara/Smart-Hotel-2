import { prisma } from '@/lib/db'

// Central Corporate Daily FX Matrix (Rates relative to USD baseline 1.0)
const FX_RATES_MATRIX: { [currency: string]: number } = {
  USD: 1.0,
  EUR: 0.92, // 1 USD = 0.92 EUR
  GBP: 0.79, // 1 USD = 0.79 GBP
  LKR: 305.5, // 1 USD = 305.5 LKR
  AED: 3.67, // 1 USD = 3.67 AED
  SGD: 1.35, // 1 USD = 1.35 SGD
  JPY: 154.2 // 1 USD = 154.2 JPY
}

export function getFxRates() {
  return { ...FX_RATES_MATRIX }
}

export function updateFxRate(currency: string, rateToUsd: number) {
  if (rateToUsd <= 0) {
    throw new Error('Exchange rate must be positive')
  }
  FX_RATES_MATRIX[currency.toUpperCase()] = Number(rateToUsd)
  return { currency: currency.toUpperCase(), rateToUsd: Number(rateToUsd) }
}

export function convertAmount(amount: number, fromCurrency: string, toCurrency: string = 'USD'): number {
  const from = fromCurrency.toUpperCase()
  const to = toCurrency.toUpperCase()

  if (from === to) return amount

  const fromRate = FX_RATES_MATRIX[from] || 1.0
  const toRate = FX_RATES_MATRIX[to] || 1.0

  // Convert to USD first, then to target currency
  const inUsd = amount / fromRate
  const targetAmount = inUsd * toRate

  return Math.round(targetAmount * 100) / 100
}

export interface PropertyFinancialBreakdown {
  propertyId: string
  propertyName: string
  propertyCode: string
  city: string
  country: string
  localCurrency: string
  fxRateToHq: number
  totalRooms: number
  totalRoomNightsSold: number
  localRevenue: {
    roomRevenue: number
    fAndBRevenue: number
    extraServicesRevenue: number
    totalRevenue: number
  }
  hqRevenue: {
    roomRevenue: number
    fAndBRevenue: number
    extraServicesRevenue: number
    totalRevenue: number
  }
  metrics: {
    occupancyRate: number
    adrHq: number
    revParHq: number
    contributionPercentage: number
  }
}

export interface ConsolidatedGroupFinancialsReport {
  hqReportingCurrency: string
  startDate: string
  endDate: string
  daysCount: number
  totalChainProperties: number
  totalChainRooms: number
  consolidatedMetrics: {
    totalGroupRevenue: number
    totalRoomNightsSold: number
    portfolioOccupancyRate: number
    portfolioAdr: number
    portfolioRevPar: number
  }
  fxRatesApplied: { [currency: string]: number }
  propertyBreakdowns: PropertyFinancialBreakdown[]
}

/**
 * Computes consolidated group financial performance, RevPAR, and ADR in HQ reporting currency
 */
export async function getConsolidatedGroupFinancials(params: {
  startDate: Date
  endDate: Date
  hqCurrency?: string
}): Promise<ConsolidatedGroupFinancialsReport> {
  const { startDate, endDate, hqCurrency = 'USD' } = params

  const daysCount = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  )

  const properties = await prisma.property.findMany({
    where: { status: 'ACTIVE' },
    include: {
      bookings: {
        where: {
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
          OR: [
            { AND: [{ checkIn: { lte: endDate } }, { checkOut: { gte: startDate } }] }
          ]
        },
        include: {
          folios: {
            include: { lineItems: true }
          }
        }
      }
    }
  })

  let totalChainRooms = 0
  let totalChainNightsSold = 0
  let totalGroupRevenueHq = 0

  const propertyData: {
    property: (typeof properties)[0]
    localCurrency: string
    localRoomRev: number
    localFbRev: number
    localExtraRev: number
    localTotalRev: number
    roomNightsSold: number
  }[] = []

  for (const prop of properties) {
    const totalRooms = prop.totalRooms || 10
    totalChainRooms += totalRooms

    // Determine local currency from country or property code
    let localCurrency = 'USD'
    if (prop.country.toLowerCase().includes('sri lanka')) localCurrency = 'LKR'
    else if (prop.country.toLowerCase().includes('france') || prop.country.toLowerCase().includes('germany') || prop.city.toLowerCase() === 'aspen') localCurrency = 'EUR'
    else if (prop.country.toLowerCase().includes('uae') || prop.country.toLowerCase().includes('dubai')) localCurrency = 'AED'

    let localRoomRev = 0
    let localFbRev = 0
    let localExtraRev = 0
    let nightsSold = 0

    for (const booking of prop.bookings) {
      const bkgNights = Math.max(
        1,
        Math.round((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24))
      )
      nightsSold += bkgNights

      // Check folio line items if present
      let hasLineItems = false
      for (const folio of booking.folios) {
        for (const item of folio.lineItems) {
          hasLineItems = true
          const amt = Number(item.amount)
          if (item.category === 'ROOM') localRoomRev += amt
          else if (item.category === 'F_AND_B') localFbRev += amt
          else localExtraRev += amt
        }
      }

      if (!hasLineItems) {
        localRoomRev += Number(booking.totalAmount)
      }
    }

    const localTotal = localRoomRev + localFbRev + localExtraRev
    totalChainNightsSold += nightsSold

    propertyData.push({
      property: prop,
      localCurrency,
      localRoomRev: Math.round(localRoomRev * 100) / 100,
      localFbRev: Math.round(localFbRev * 100) / 100,
      localExtraRev: Math.round(localExtraRev * 100) / 100,
      localTotalRev: Math.round(localTotal * 100) / 100,
      roomNightsSold: nightsSold
    })
  }

  // Calculate HQ converted numbers
  const propertyBreakdowns: PropertyFinancialBreakdown[] = []

  for (const item of propertyData) {
    const hqRoomRev = convertAmount(item.localRoomRev, item.localCurrency, hqCurrency)
    const hqFbRev = convertAmount(item.localFbRev, item.localCurrency, hqCurrency)
    const hqExtraRev = convertAmount(item.localExtraRev, item.localCurrency, hqCurrency)
    const hqTotalRev = hqRoomRev + hqFbRev + hqExtraRev

    totalGroupRevenueHq += hqTotalRev

    const totalRooms = item.property.totalRooms || 10
    const availableRoomNights = totalRooms * daysCount
    const occupancyRate =
      availableRoomNights > 0
        ? Math.min(100, Math.round((item.roomNightsSold / availableRoomNights) * 1000) / 10)
        : 0

    const adrHq =
      item.roomNightsSold > 0 ? Math.round((hqTotalRev / item.roomNightsSold) * 100) / 100 : 0
    const revParHq =
      availableRoomNights > 0 ? Math.round((hqTotalRev / availableRoomNights) * 100) / 100 : 0

    const fxRate = FX_RATES_MATRIX[item.localCurrency.toUpperCase()] || 1.0

    propertyBreakdowns.push({
      propertyId: item.property.id,
      propertyName: item.property.name,
      propertyCode: item.property.code,
      city: item.property.city,
      country: item.property.country,
      localCurrency: item.localCurrency,
      fxRateToHq: fxRate,
      totalRooms,
      totalRoomNightsSold: item.roomNightsSold,
      localRevenue: {
        roomRevenue: item.localRoomRev,
        fAndBRevenue: item.localFbRev,
        extraServicesRevenue: item.localExtraRev,
        totalRevenue: item.localTotalRev
      },
      hqRevenue: {
        roomRevenue: hqRoomRev,
        fAndBRevenue: hqFbRev,
        extraServicesRevenue: hqExtraRev,
        totalRevenue: hqTotalRev
      },
      metrics: {
        occupancyRate,
        adrHq,
        revParHq,
        contributionPercentage: 0 // calculated next
      }
    })
  }

  // Calculate revenue contribution percentage
  for (const prop of propertyBreakdowns) {
    prop.metrics.contributionPercentage =
      totalGroupRevenueHq > 0
        ? Math.round((prop.hqRevenue.totalRevenue / totalGroupRevenueHq) * 1000) / 10
        : 0
  }

  // Sort properties by revenue contribution descending
  propertyBreakdowns.sort(
    (a, b) => b.hqRevenue.totalRevenue - a.hqRevenue.totalRevenue
  )

  const totalAvailableChainNights = totalChainRooms * daysCount
  const portfolioOccupancyRate =
    totalAvailableChainNights > 0
      ? Math.min(100, Math.round((totalChainNightsSold / totalAvailableChainNights) * 1000) / 10)
      : 0
  const portfolioAdr =
    totalChainNightsSold > 0 ? Math.round((totalGroupRevenueHq / totalChainNightsSold) * 100) / 100 : 0
  const portfolioRevPar =
    totalAvailableChainNights > 0
      ? Math.round((totalGroupRevenueHq / totalAvailableChainNights) * 100) / 100
      : 0

  return {
    hqReportingCurrency: hqCurrency.toUpperCase(),
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    daysCount,
    totalChainProperties: properties.length,
    totalChainRooms,
    consolidatedMetrics: {
      totalGroupRevenue: Math.round(totalGroupRevenueHq * 100) / 100,
      totalRoomNightsSold: totalChainNightsSold,
      portfolioOccupancyRate,
      portfolioAdr,
      portfolioRevPar
    },
    fxRatesApplied: { ...FX_RATES_MATRIX },
    propertyBreakdowns
  }
}

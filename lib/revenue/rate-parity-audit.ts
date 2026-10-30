import { prisma } from '@/lib/db'

export interface RateParityViolation {
  id: string
  type: 'OTA_UNDERCUT' | 'RATE_DESYNC_RISK' | 'REGIONAL_CANNIBALIZATION'
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  propertyName: string
  propertyCode: string
  details: string
  currentValue: number | string
  benchmarkValue: number | string
  recommendedAction: string
}

export interface RateParityAuditReport {
  timestamp: string
  totalPropertiesAudited: number
  totalRatePlansAudited: number
  totalChannelMappingsAudited: number
  parityScore: number // 0 - 100%
  healthGrade: 'EXCELLENT' | 'GOOD' | 'AT_RISK'
  violationsCount: number
  violations: RateParityViolation[]
  clusterAnalysis: {
    city: string
    averageRate: number
    propertiesCount: number
    disparitySpreadPercent: number
  }[]
}

/**
 * Conducts a comprehensive Rate Parity Audit across chain properties and OTA channels
 */
export async function auditRateParity(params?: {
  clusterCity?: string
}): Promise<RateParityAuditReport> {
  const { clusterCity } = params || {}

  const properties = await prisma.property.findMany({
    where: {
      status: 'ACTIVE',
      ...(clusterCity
        ? { city: { equals: clusterCity, mode: 'insensitive' } }
        : {})
    },
    include: {
      roomTypes: true,
      ratePlans: true,
      ChannelConnection: {
        include: {
          provider: true,
          rateMappings: true
        }
      }
    }
  })

  const violations: RateParityViolation[] = []
  let totalRatePlansCount = 0
  let totalChannelMappingsCount = 0

  for (const prop of properties) {
    totalRatePlansCount += prop.ratePlans.length

    // Audit OTA channels
    for (const conn of prop.ChannelConnection) {
      totalChannelMappingsCount += conn.rateMappings.length
      const channelLabel = conn.provider?.name || 'OTA Channel'

      for (const mapping of conn.rateMappings) {
        const markup = Number(mapping.priceMarkupPercentage)

        // Violation: OTA is cheaper than direct website (Negative Markup = Undercut)
        if (markup < 0) {
          violations.push({
            id: `PARITY-UNDERCUT-${mapping.id}`,
            type: 'OTA_UNDERCUT',
            severity: 'HIGH',
            propertyName: prop.name,
            propertyCode: prop.code,
            details: `Channel ${channelLabel} rate plan ${mapping.externalRateId} undercuts direct rate by ${Math.abs(markup)}%`,
            currentValue: `${markup}%`,
            benchmarkValue: '>= 0.0%',
            recommendedAction: `Increase priceMarkupPercentage on ${channelLabel} to at least 0% to protect direct booking channel.`
          })
        }

        // Warning: Rates sync is disabled
        if (!mapping.syncRates) {
          violations.push({
            id: `PARITY-DESYNC-${mapping.id}`,
            type: 'RATE_DESYNC_RISK',
            severity: 'MEDIUM',
            propertyName: prop.name,
            propertyCode: prop.code,
            details: `Automatic rate synchronization is disabled on ${channelLabel}`,
            currentValue: 'syncRates: false',
            benchmarkValue: 'syncRates: true',
            recommendedAction: `Enable syncRates on channel mapping ${mapping.id} to avoid stale OTA pricing.`
          })
        }
      }
    }
  }

  // Audit Regional Cannibalization within the same city
  const cityGroups = new Map<string, typeof properties>()
  for (const prop of properties) {
    const key = prop.city.toLowerCase()
    if (!cityGroups.has(key)) {
      cityGroups.set(key, [])
    }
    cityGroups.get(key)!.push(prop)
  }

  const clusterAnalysis = []

  for (const [cityKey, cityProps] of Array.from(cityGroups.entries())) {
    const cityName = cityProps[0].city
    const allRates = cityProps.flatMap((p) =>
      p.roomTypes.map((rt) => Number(rt.baseRate))
    )

    if (allRates.length > 0) {
      const minRate = Math.min(...allRates)
      const maxRate = Math.max(...allRates)
      const avgRate = Math.round(allRates.reduce((a, b) => a + b, 0) / allRates.length)
      const spreadPercent = minRate > 0 ? Math.round(((maxRate - minRate) / minRate) * 100) : 0

      clusterAnalysis.push({
        city: cityName,
        averageRate: avgRate,
        propertiesCount: cityProps.length,
        disparitySpreadPercent: spreadPercent
      })

      // If multiple properties in the same city have > 50% price spread for basic categories
      if (cityProps.length > 1 && spreadPercent > 50) {
        violations.push({
          id: `PARITY-CANNIBAL-${cityKey}`,
          type: 'REGIONAL_CANNIBALIZATION',
          severity: 'MEDIUM',
          propertyName: `${cityProps.map((p) => p.code).join(' vs ')}`,
          propertyCode: cityName.toUpperCase().slice(0, 3),
          details: `Sister branches in ${cityName} have an extreme ${spreadPercent}% price divergence ($${minRate} vs $${maxRate})`,
          currentValue: `${spreadPercent}% spread`,
          benchmarkValue: '<= 35% cluster spread',
          recommendedAction: `Harmonize baseline rates across ${cityName} cluster to prevent sister hotels cannibalizing bookings.`
        })
      }
    }
  }

  // Calculate Parity Health Score
  const deduction = violations.reduce((acc, v) => {
    if (v.severity === 'HIGH') return acc + 15
    if (v.severity === 'MEDIUM') return acc + 8
    return acc + 4
  }, 0)

  const parityScore = Math.max(0, Math.min(100, 100 - deduction))
  const healthGrade: RateParityAuditReport['healthGrade'] =
    parityScore >= 90 ? 'EXCELLENT' : parityScore >= 75 ? 'GOOD' : 'AT_RISK'

  return {
    timestamp: new Date().toISOString(),
    totalPropertiesAudited: properties.length,
    totalRatePlansAudited: totalRatePlansCount,
    totalChannelMappingsAudited: totalChannelMappingsCount,
    parityScore,
    healthGrade,
    violationsCount: violations.length,
    violations,
    clusterAnalysis
  }
}

/**
 * Automatically enforces rate parity by resetting negative OTA markups to zero
 */
export async function enforceRateParity() {
  const result = await prisma.channelRateMapping.updateMany({
    where: {
      priceMarkupPercentage: { lt: 0 }
    },
    data: {
      priceMarkupPercentage: 0.0,
      syncRates: true
    }
  })

  return {
    success: true,
    remediatedMappingsCount: result.count,
    message: `Successfully enforced rate parity across ${result.count} OTA channel mappings.`
  }
}

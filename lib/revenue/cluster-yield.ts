import { prisma } from '@/lib/db'

export interface ClusterYieldRuleInput {
  name: string
  clusterCity?: string
  propertyIds?: string[]
  startDate: Date
  endDate: Date
  minOccupancy?: number
  maxOccupancy?: number
  adjustmentType?: 'PERCENTAGE' | 'FIXED'
  adjustmentValue: number
  description?: string
}

export interface ClusterYieldRuleSummary {
  clusterRuleTag: string
  name: string
  description?: string | null
  startDate: string
  endDate: string
  minOccupancy: number | null
  maxOccupancy: number | null
  adjustmentType: string
  adjustmentValue: number
  targetPropertiesCount: number
  participatingProperties: {
    propertyId: string
    propertyName: string
    propertyCode: string
    city: string
    yieldRuleId: string
  }[]
}

/**
 * Creates a Coordinated Cluster-Wide Dynamic Pricing Yield Rule across a regional property cluster
 */
export async function createClusterYieldRule(
  input: ClusterYieldRuleInput
): Promise<ClusterYieldRuleSummary> {
  const {
    name,
    clusterCity,
    propertyIds,
    startDate,
    endDate,
    minOccupancy,
    maxOccupancy,
    adjustmentType = 'PERCENTAGE',
    adjustmentValue,
    description
  } = input

  if (!name || adjustmentValue == null || !startDate || !endDate) {
    throw new Error('name, adjustmentValue, startDate, and endDate are required')
  }

  // 1. Fetch matching properties in cluster
  const properties = await prisma.property.findMany({
    where: {
      status: 'ACTIVE',
      ...(propertyIds && propertyIds.length > 0
        ? { id: { in: propertyIds } }
        : clusterCity
        ? { city: { equals: clusterCity, mode: 'insensitive' } }
        : {})
    },
    select: { id: true, name: true, code: true, city: true }
  })

  if (properties.length === 0) {
    throw new Error('No active properties found for the specified cluster')
  }

  const clusterRuleTag = `[CLUSTER-${Date.now().toString().slice(-4)}]`
  const fullName = `${clusterRuleTag} ${name}`

  // 2. Execute coordination in transaction
  const participatingProperties: ClusterYieldRuleSummary['participatingProperties'] = []

  await prisma.$transaction(async (tx) => {
    for (const prop of properties) {
      const createdRule = await tx.yieldRule.create({
        data: {
          name: fullName,
          description: description || `Coordinated cluster dynamic pricing rule for ${prop.city}`,
          startDate,
          endDate,
          minOccupancy: minOccupancy != null ? Number(minOccupancy) : null,
          maxOccupancy: maxOccupancy != null ? Number(maxOccupancy) : null,
          adjustmentType,
          adjustmentValue: Number(adjustmentValue),
          isActive: true,
          propertyId: prop.id
        }
      })

      participatingProperties.push({
        propertyId: prop.id,
        propertyName: prop.name,
        propertyCode: prop.code,
        city: prop.city,
        yieldRuleId: createdRule.id
      })
    }
  })

  return {
    clusterRuleTag,
    name,
    description: description || null,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    minOccupancy: minOccupancy != null ? Number(minOccupancy) : null,
    maxOccupancy: maxOccupancy != null ? Number(maxOccupancy) : null,
    adjustmentType,
    adjustmentValue: Number(adjustmentValue),
    targetPropertiesCount: participatingProperties.length,
    participatingProperties
  }
}

/**
 * Evaluates cluster occupancy and dynamic rate surge for a specific date
 */
export async function evaluateClusterYield(params: {
  clusterCity?: string
  propertyIds?: string[]
  evaluationDate: Date
}) {
  const { clusterCity, propertyIds, evaluationDate } = params

  const properties = await prisma.property.findMany({
    where: {
      status: 'ACTIVE',
      ...(propertyIds && propertyIds.length > 0
        ? { id: { in: propertyIds } }
        : clusterCity
        ? { city: { equals: clusterCity, mode: 'insensitive' } }
        : {})
    },
    include: {
      rooms: {
        where: { deletedAt: null, status: { notIn: ['MAINTENANCE', 'OUT_OF_ORDER'] } }
      },
      yieldRules: {
        where: {
          isActive: true,
          startDate: { lte: evaluationDate },
          endDate: { gte: evaluationDate }
        }
      }
    }
  })

  if (properties.length === 0) {
    return {
      totalClusterRooms: 0,
      occupiedRooms: 0,
      clusterOccupancyRate: 0,
      appliedSurgeMultiplier: 1.0,
      activeClusterRules: []
    }
  }

  const propIds = properties.map((p) => p.id)
  let totalClusterRooms = 0
  for (const prop of properties) {
    totalClusterRooms += prop.rooms.length
  }

  // Count active room assignments for evaluationDate
  const nextDay = new Date(evaluationDate.getTime() + 86400000)
  const activeAssignments = await prisma.roomAssignment.count({
    where: {
      status: 'ACTIVE',
      room: { propertyId: { in: propIds } },
      startDate: { lte: evaluationDate },
      endDate: { gt: evaluationDate }
    }
  })

  const clusterOccupancyRate =
    totalClusterRooms > 0
      ? Math.round((activeAssignments / totalClusterRooms) * 1000) / 10
      : 0

  // Check matching yield rule across cluster
  let maxAdjustment = 0
  let matchedRuleName: string | null = null

  for (const prop of properties) {
    for (const rule of prop.yieldRules) {
      const minOcc = rule.minOccupancy ? Number(rule.minOccupancy) : 0
      const maxOcc = rule.maxOccupancy ? Number(rule.maxOccupancy) : 100

      if (clusterOccupancyRate >= minOcc && clusterOccupancyRate <= maxOcc) {
        const val = Number(rule.adjustmentValue)
        if (val > maxAdjustment) {
          maxAdjustment = val
          matchedRuleName = rule.name
        }
      }
    }
  }

  const appliedSurgeMultiplier =
    maxAdjustment > 0 ? 1 + maxAdjustment / 100 : 1.0

  return {
    clusterCity: clusterCity || 'Chain Wide',
    totalClusterProperties: properties.length,
    totalClusterRooms,
    occupiedRooms: activeAssignments,
    clusterOccupancyRate,
    matchedRule: matchedRuleName,
    surgePercentage: maxAdjustment,
    appliedSurgeMultiplier: Math.round(appliedSurgeMultiplier * 100) / 100
  }
}

/**
 * Lists cluster yield rules grouped by coordinated rule name
 */
export async function listClusterYieldRules() {
  const rules = await prisma.yieldRule.findMany({
    where: { name: { startsWith: '[CLUSTER-' } },
    include: { property: true }
  })

  const grouped = new Map<string, typeof rules>()
  for (const r of rules) {
    if (!grouped.has(r.name)) {
      grouped.set(r.name, [])
    }
    grouped.get(r.name)!.push(r)
  }

  return Array.from(grouped.entries()).map(([name, groupRules]) => {
    const first = groupRules[0]
    return {
      name,
      startDate: first.startDate.toISOString(),
      endDate: first.endDate.toISOString(),
      adjustmentType: first.adjustmentType,
      adjustmentValue: Number(first.adjustmentValue),
      minOccupancy: first.minOccupancy ? Number(first.minOccupancy) : null,
      maxOccupancy: first.maxOccupancy ? Number(first.maxOccupancy) : null,
      isActive: first.isActive,
      propertiesCount: groupRules.length,
      properties: groupRules.map((gr) => ({
        id: gr.property.id,
        name: gr.property.name,
        code: gr.property.code,
        city: gr.property.city
      }))
    }
  })
}

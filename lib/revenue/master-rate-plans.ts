import { prisma } from '@/lib/db'

export interface MasterRatePlanInput {
  name: string
  code: string
  description?: string
  baseMultiplier: number
  cancelPolicy?: 'FLEXIBLE' | 'MODERATE' | 'STRICT'
  nonRefundable?: boolean
  isDefault?: boolean
  targetPropertyIds?: string[]
}

export interface MasterRatePlanSummary {
  code: string
  name: string
  description?: string | null
  baseMultiplier: number
  cancelPolicy: string
  nonRefundable: boolean
  isDefault: boolean
  targetPropertiesCount: number
  cascadedRoomTypesCount: number
  participatingProperties: {
    propertyId: string
    propertyName: string
    propertyCode: string
    roomTypesCount: number
    sampleRatePlans: {
      roomTypeName: string
      baseRate: number
      effectiveRate: number
    }[]
  }[]
}

/**
 * Creates or updates a Master Rate Plan and cascades it to all child properties and room types
 */
export async function createAndCascadeMasterRatePlan(
  input: MasterRatePlanInput
): Promise<MasterRatePlanSummary> {
  const {
    name,
    code,
    description,
    baseMultiplier,
    cancelPolicy = 'FLEXIBLE',
    nonRefundable = false,
    isDefault = false,
    targetPropertyIds
  } = input

  if (!name || !code || baseMultiplier == null) {
    throw new Error('name, code, and baseMultiplier are required')
  }

  // 1. Fetch properties in scope
  const properties = await prisma.property.findMany({
    where: {
      status: 'ACTIVE',
      ...(targetPropertyIds && targetPropertyIds.length > 0
        ? { id: { in: targetPropertyIds } }
        : {})
    },
    include: {
      roomTypes: true
    }
  })

  if (properties.length === 0) {
    throw new Error('No active properties found for rate plan cascade')
  }

  const masterName = `[${code.toUpperCase()}] ${name}`
  let cascadedRoomTypesCount = 0
  const participatingPropertiesSummary: MasterRatePlanSummary['participatingProperties'] = []

  // 2. Execute cascade in transaction
  await prisma.$transaction(async (tx) => {
    for (const prop of properties) {
      const samplePlans = []

      for (const rt of prop.roomTypes) {
        await tx.ratePlan.upsert({
          where: {
            name_roomTypeId: {
              name: masterName,
              roomTypeId: rt.id
            }
          },
          create: {
            name: masterName,
            description: description || null,
            baseMultiplier,
            cancelPolicy,
            nonRefundable,
            isDefault,
            active: true,
            propertyId: prop.id,
            roomTypeId: rt.id
          },
          update: {
            description: description || null,
            baseMultiplier,
            cancelPolicy,
            nonRefundable,
            active: true
          }
        })

        cascadedRoomTypesCount++

        samplePlans.push({
          roomTypeName: rt.name,
          baseRate: Number(rt.baseRate),
          effectiveRate: Math.round(Number(rt.baseRate) * baseMultiplier * 100) / 100
        })
      }

      participatingPropertiesSummary.push({
        propertyId: prop.id,
        propertyName: prop.name,
        propertyCode: prop.code,
        roomTypesCount: prop.roomTypes.length,
        sampleRatePlans: samplePlans
      })
    }
  })

  return {
    code: code.toUpperCase(),
    name,
    description: description || null,
    baseMultiplier,
    cancelPolicy,
    nonRefundable,
    isDefault,
    targetPropertiesCount: properties.length,
    cascadedRoomTypesCount,
    participatingProperties: participatingPropertiesSummary
  }
}

/**
 * Lists all active Master Rate Plans with child property adoption statistics
 */
export async function listMasterRatePlans(): Promise<MasterRatePlanSummary[]> {
  const masterPlans = await prisma.ratePlan.findMany({
    where: {
      name: { startsWith: '[' }
    },
    include: {
      property: true,
      roomType: true
    }
  })

  // Group by master plan name
  const grouped = new Map<string, typeof masterPlans>()
  for (const plan of masterPlans) {
    if (!grouped.has(plan.name)) {
      grouped.set(plan.name, [])
    }
    grouped.get(plan.name)!.push(plan)
  }

  const results: MasterRatePlanSummary[] = []

  for (const [fullName, plans] of Array.from(grouped.entries())) {
    const match = fullName.match(/\[(.*?)\]\s*(.*)/)
    const code = match ? match[1] : 'MASTER'
    const cleanName = match ? match[2] : fullName
    const firstPlan = plans[0]

    // Distinct properties
    const propertyMap = new Map<string, { property: any; plans: typeof plans }>()
    for (const p of plans) {
      if (!propertyMap.has(p.propertyId)) {
        propertyMap.set(p.propertyId, { property: p.property, plans: [] })
      }
      propertyMap.get(p.propertyId)!.plans.push(p)
    }

    const participatingProperties = Array.from(propertyMap.values()).map(
      ({ property, plans: propPlans }) => ({
        propertyId: property.id,
        propertyName: property.name,
        propertyCode: property.code,
        roomTypesCount: propPlans.length,
        sampleRatePlans: propPlans.map((pp) => ({
          roomTypeName: pp.roomType.name,
          baseRate: Number(pp.roomType.baseRate),
          effectiveRate:
            Math.round(Number(pp.roomType.baseRate) * Number(pp.baseMultiplier) * 100) / 100
        }))
      })
    )

    results.push({
      code,
      name: cleanName,
      description: firstPlan.description,
      baseMultiplier: Number(firstPlan.baseMultiplier),
      cancelPolicy: firstPlan.cancelPolicy,
      nonRefundable: firstPlan.nonRefundable,
      isDefault: firstPlan.isDefault,
      targetPropertiesCount: participatingProperties.length,
      cascadedRoomTypesCount: plans.length,
      participatingProperties
    })
  }

  return results
}

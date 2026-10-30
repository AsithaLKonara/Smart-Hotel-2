import { prisma } from '@/lib/db'

export interface ClusterAvailabilityParams {
  checkIn: Date
  checkOut: Date
  targetPropertyId?: string
  clusterCity?: string
  capacity?: number
  maxDistanceKm?: number
}

export interface RoomTypeAvailability {
  roomTypeId: string
  name: string
  description?: string
  baseRate: number
  capacity: number
  amenities: string[]
  images: string[]
  availableRoomsCount: number
}

export interface SisterPropertyRecommendation {
  propertyId: string
  propertyName: string
  propertyCode: string
  city: string
  country: string
  distanceKm: number | null
  availableRoomsCount: number
  lowestRate: number
  currency: string
  availableRoomTypes: RoomTypeAvailability[]
  crossSellPerks: string[]
}

export interface PropertyAvailabilityOverview {
  propertyId: string
  propertyName: string
  propertyCode: string
  city: string
  country: string
  latitude: number | null
  longitude: number | null
  isSoldOut: boolean
  totalRooms: number
  availableRoomsCount: number
  lowestRate: number | null
  roomTypes: RoomTypeAvailability[]
}

export interface ClusterAvailabilityResult {
  checkIn: string
  checkOut: string
  capacity: number | null
  targetProperty: {
    propertyId: string
    propertyName: string
    propertyCode: string
    city: string
    country: string
    isSoldOut: boolean
    availableRoomsCount: number
    lowestRate: number | null
    availableRoomTypes: RoomTypeAvailability[]
  } | null
  isTargetSoldOut: boolean
  crossSellingRecommendations: SisterPropertyRecommendation[]
  clusterOverview: PropertyAvailabilityOverview[]
}

/**
 * Calculates Great-Circle Distance between two coordinates in kilometers using Haversine formula
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10 // Rounded to 1 decimal place
}

/**
 * Executes a Cluster / Chain-Wide Availability Search with Automatic Cross-Selling
 */
export async function searchClusterAvailability(
  params: ClusterAvailabilityParams
): Promise<ClusterAvailabilityResult> {
  const { checkIn, checkOut, targetPropertyId, clusterCity, capacity, maxDistanceKm } = params

  // 1. Fetch properties in scope
  const properties = await prisma.property.findMany({
    where: {
      status: 'ACTIVE',
      ...(clusterCity
        ? {
            city: {
              equals: clusterCity,
              mode: 'insensitive'
            }
          }
        : {})
    },
    select: {
      id: true,
      name: true,
      code: true,
      city: true,
      country: true,
      latitude: true,
      longitude: true,
      totalRooms: true
    }
  })

  if (properties.length === 0) {
    return {
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      capacity: capacity || null,
      targetProperty: null,
      isTargetSoldOut: false,
      crossSellingRecommendations: [],
      clusterOverview: []
    }
  }

  const propertyIds = properties.map((p) => p.id)

  // 2. Fetch all usable rooms across these properties
  const allRooms = await prisma.room.findMany({
    where: {
      propertyId: { in: propertyIds },
      deletedAt: null,
      status: { notIn: ['MAINTENANCE', 'OUT_OF_ORDER'] },
      ...(capacity ? { capacity: { gte: Number(capacity) } } : {})
    },
    include: {
      roomType: true
    }
  })

  // 3. Find conflicting active room assignments during the requested interval
  const conflictingAssignments = await prisma.roomAssignment.findMany({
    where: {
      status: 'ACTIVE',
      room: {
        propertyId: { in: propertyIds }
      },
      OR: [
        {
          AND: [
            { startDate: { gte: checkIn } },
            { startDate: { lt: checkOut } }
          ]
        },
        {
          AND: [
            { endDate: { gt: checkIn } },
            { endDate: { lte: checkOut } }
          ]
        },
        {
          AND: [
            { startDate: { lte: checkIn } },
            { endDate: { gte: checkOut } }
          ]
        }
      ]
    },
    select: {
      roomId: true
    }
  })

  const bookedRoomIds = new Set(conflictingAssignments.map((a) => a.roomId))

  // 4. Map available rooms by property
  const propertyAvailabilityMap = new Map<
    string,
    {
      availableRooms: typeof allRooms
      totalRoomsCount: number
    }
  >()

  for (const property of properties) {
    const propRooms = allRooms.filter((r) => r.propertyId === property.id)
    const available = propRooms.filter((r) => !bookedRoomIds.has(r.id))
    propertyAvailabilityMap.set(property.id, {
      availableRooms: available,
      totalRoomsCount: propRooms.length
    })
  }

  // 5. Build Property Availability Overviews
  const clusterOverview: PropertyAvailabilityOverview[] = []

  for (const property of properties) {
    const data = propertyAvailabilityMap.get(property.id)!
    const availableRooms = data.availableRooms

    // Group available rooms by roomType
    const roomTypeMap = new Map<string, RoomTypeAvailability>()
    for (const room of availableRooms) {
      const rt = room.roomType
      if (!roomTypeMap.has(rt.id)) {
        roomTypeMap.set(rt.id, {
          roomTypeId: rt.id,
          name: rt.name,
          description: rt.description,
          baseRate: Number(rt.baseRate),
          capacity: rt.capacity,
          amenities: rt.amenities || [],
          images: rt.images || [],
          availableRoomsCount: 1
        })
      } else {
        const existing = roomTypeMap.get(rt.id)!
        existing.availableRoomsCount += 1
      }
    }

    const roomTypes = Array.from(roomTypeMap.values()).sort(
      (a, b) => a.baseRate - b.baseRate
    )
    const lowestRate = roomTypes.length > 0 ? roomTypes[0].baseRate : null

    clusterOverview.push({
      propertyId: property.id,
      propertyName: property.name,
      propertyCode: property.code,
      city: property.city,
      country: property.country,
      latitude: property.latitude,
      longitude: property.longitude,
      isSoldOut: availableRooms.length === 0,
      totalRooms: data.totalRoomsCount,
      availableRoomsCount: availableRooms.length,
      lowestRate,
      roomTypes
    })
  }

  // 6. Handle Target Property and Cross-Selling Logic
  let targetPropertyResult: ClusterAvailabilityResult['targetProperty'] = null
  let isTargetSoldOut = false
  const crossSellingRecommendations: SisterPropertyRecommendation[] = []

  const targetPropMeta = targetPropertyId
    ? properties.find((p) => p.id === targetPropertyId)
    : null

  if (targetPropMeta) {
    const targetOverview = clusterOverview.find((p) => p.propertyId === targetPropMeta.id)
    if (targetOverview) {
      isTargetSoldOut = targetOverview.isSoldOut
      targetPropertyResult = {
        propertyId: targetOverview.propertyId,
        propertyName: targetOverview.propertyName,
        propertyCode: targetOverview.propertyCode,
        city: targetOverview.city,
        country: targetOverview.country,
        isSoldOut: targetOverview.isSoldOut,
        availableRoomsCount: targetOverview.availableRoomsCount,
        lowestRate: targetOverview.lowestRate,
        availableRoomTypes: targetOverview.roomTypes
      }
    }

    // Generate cross-selling recommendations if target property is sold out OR has low availability (< 2 rooms)
    const sisterProperties = clusterOverview.filter(
      (p) => p.propertyId !== targetPropMeta.id && !p.isSoldOut && p.availableRoomsCount > 0
    )

    for (const sister of sisterProperties) {
      let distanceKm: number | null = null
      if (
        targetPropMeta.latitude != null &&
        targetPropMeta.longitude != null &&
        sister.latitude != null &&
        sister.longitude != null
      ) {
        distanceKm = calculateHaversineDistanceKm(
          targetPropMeta.latitude,
          targetPropMeta.longitude,
          sister.latitude,
          sister.longitude
        )
      }

      if (maxDistanceKm != null && distanceKm != null && distanceKm > maxDistanceKm) {
        continue
      }

      const perks: string[] = [
        'Direct Chain Guarantee',
        'Loyalty Points Transferable'
      ]
      if (distanceKm != null && distanceKm < 20) {
        perks.push(`Nearby Sister Branch (${distanceKm} km away)`)
      }
      if (sister.city.toLowerCase() === targetPropMeta.city.toLowerCase()) {
        perks.push('Same City Center Cluster')
      }

      crossSellingRecommendations.push({
        propertyId: sister.propertyId,
        propertyName: sister.propertyName,
        propertyCode: sister.propertyCode,
        city: sister.city,
        country: sister.country,
        distanceKm,
        availableRoomsCount: sister.availableRoomsCount,
        lowestRate: sister.lowestRate || 0,
        currency: 'USD',
        availableRoomTypes: sister.roomTypes,
        crossSellPerks: perks
      })
    }

    // Sort cross-selling recommendations: closest distance first, then lowest rate
    crossSellingRecommendations.sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm
      }
      return a.lowestRate - b.lowestRate
    })
  }

  return {
    checkIn: checkIn.toISOString(),
    checkOut: checkOut.toISOString(),
    capacity: capacity || null,
    targetProperty: targetPropertyResult,
    isTargetSoldOut,
    crossSellingRecommendations,
    clusterOverview
  }
}

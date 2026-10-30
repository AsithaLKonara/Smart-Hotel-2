import { prisma } from '@/lib/db'

export interface PropertyBlockAllocation {
  propertyId: string
  roomTypeId: string
  blockedCount: number
  contractedRate: number
}

export interface CreateMasterContractInput {
  contractName: string
  contractCode?: string
  organizerName: string
  organizerEmail: string
  startDate: Date
  endDate: Date
  expectedAttendees?: number
  allocations: PropertyBlockAllocation[]
}

export interface MasterContractSummary {
  contractCode: string
  contractName: string
  organizerName: string
  organizerEmail: string
  startDate: string
  endDate: string
  totalProperties: number
  totalRoomsBlocked: number
  consolidatedNightlyRate: number
  status: string
  participatingProperties: {
    propertyId: string
    propertyName: string
    propertyCode: string
    eventId: string
    blocks: {
      blockId: string
      roomTypeId: string
      roomTypeName: string
      blockedCount: number
      contractedRate: number
    }[]
  }[]
}

/**
 * Creates a Multi-Property Master Group Block Contract split across sister hotels
 */
export async function createMasterGroupContract(
  input: CreateMasterContractInput
): Promise<MasterContractSummary> {
  const {
    contractName,
    organizerName,
    organizerEmail,
    startDate,
    endDate,
    expectedAttendees,
    allocations
  } = input

  if (!allocations || allocations.length === 0) {
    throw new Error('At least one property room allocation is required')
  }

  const contractCode =
    input.contractCode ||
    `MC-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${new Date().getFullYear()}`

  // Group allocations by property
  const allocationsByProperty = new Map<string, PropertyBlockAllocation[]>()
  for (const alloc of allocations) {
    if (!allocationsByProperty.has(alloc.propertyId)) {
      allocationsByProperty.set(alloc.propertyId, [])
    }
    allocationsByProperty.get(alloc.propertyId)!.push(alloc)
  }

  // Execute in transaction
  return await prisma.$transaction(async (tx) => {
    const participatingProperties: MasterContractSummary['participatingProperties'] = []
    let totalRoomsBlocked = 0
    let consolidatedNightlyRate = 0

    for (const [propertyId, propAllocations] of Array.from(allocationsByProperty.entries())) {
      const property = await tx.property.findUnique({
        where: { id: propertyId }
      })
      if (!property) {
        throw new Error(`Property ${propertyId} not found`)
      }

      // Create property-level master banqueting event anchor
      const event = await tx.banquetingEvent.create({
        data: {
          name: `[${contractCode}] ${contractName}`,
          type: 'MASTER_GROUP_CONTRACT',
          status: 'CONFIRMED',
          startDate,
          endDate,
          expectedAttendees: expectedAttendees || 50,
          organizerName,
          organizerEmail,
          propertyId
        }
      })

      const blockDetails = []

      for (const alloc of propAllocations) {
        const roomType = await tx.roomType.findUnique({
          where: { id: alloc.roomTypeId }
        })
        if (!roomType) {
          throw new Error(`Room type ${alloc.roomTypeId} not found for property ${property.name}`)
        }

        const block = await tx.groupBlock.create({
          data: {
            eventId: event.id,
            roomTypeId: alloc.roomTypeId,
            blockedCount: Number(alloc.blockedCount),
            contractedRate: Number(alloc.contractedRate)
          }
        })

        totalRoomsBlocked += Number(alloc.blockedCount)
        consolidatedNightlyRate += Number(alloc.blockedCount) * Number(alloc.contractedRate)

        blockDetails.push({
          blockId: block.id,
          roomTypeId: roomType.id,
          roomTypeName: roomType.name,
          blockedCount: block.blockedCount,
          contractedRate: Number(block.contractedRate)
        })
      }

      participatingProperties.push({
        propertyId: property.id,
        propertyName: property.name,
        propertyCode: property.code,
        eventId: event.id,
        blocks: blockDetails
      })
    }

    return {
      contractCode,
      contractName,
      organizerName,
      organizerEmail,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalProperties: participatingProperties.length,
      totalRoomsBlocked,
      consolidatedNightlyRate,
      status: 'CONFIRMED',
      participatingProperties
    }
  })
}

/**
 * Retrieves a Master Group Contract by its Code
 */
export async function getMasterGroupContractByCode(
  contractCode: string
): Promise<MasterContractSummary | null> {
  const events = await prisma.banquetingEvent.findMany({
    where: {
      type: 'MASTER_GROUP_CONTRACT',
      name: { startsWith: `[${contractCode}]` }
    },
    include: {
      property: true,
      groupBlocks: {
        include: { roomType: true }
      }
    }
  })

  if (events.length === 0) return null

  const firstEvent = events[0]
  // Extract clean contract name
  const rawName = firstEvent.name
  const nameMatch = rawName.match(/\[(.*?)\]\s*(.*)/)
  const cleanName = nameMatch ? nameMatch[2] : rawName

  let totalRoomsBlocked = 0
  let consolidatedNightlyRate = 0

  const participatingProperties = events.map((ev) => {
    const blocks = ev.groupBlocks.map((b) => {
      totalRoomsBlocked += b.blockedCount
      consolidatedNightlyRate += b.blockedCount * Number(b.contractedRate)
      return {
        blockId: b.id,
        roomTypeId: b.roomTypeId,
        roomTypeName: b.roomType.name,
        blockedCount: b.blockedCount,
        contractedRate: Number(b.contractedRate)
      }
    })

    return {
      propertyId: ev.property.id,
      propertyName: ev.property.name,
      propertyCode: ev.property.code,
      eventId: ev.id,
      blocks
    }
  })

  return {
    contractCode,
    contractName: cleanName,
    organizerName: firstEvent.organizerName,
    organizerEmail: firstEvent.organizerEmail || '',
    startDate: firstEvent.startDate.toISOString(),
    endDate: firstEvent.endDate.toISOString(),
    totalProperties: participatingProperties.length,
    totalRoomsBlocked,
    consolidatedNightlyRate,
    status: firstEvent.status,
    participatingProperties
  }
}

/**
 * Releases unpicked allocations of a master contract back to inventory across all properties
 */
export async function releaseMasterContract(contractCode: string) {
  const events = await prisma.banquetingEvent.findMany({
    where: {
      type: 'MASTER_GROUP_CONTRACT',
      name: { startsWith: `[${contractCode}]` }
    }
  })

  if (events.length === 0) {
    throw new Error(`Master contract with code ${contractCode} not found`)
  }

  await prisma.$transaction(async (tx) => {
    await tx.banquetingEvent.updateMany({
      where: {
        type: 'MASTER_GROUP_CONTRACT',
        name: { startsWith: `[${contractCode}]` }
      },
      data: {
        status: 'RELEASED'
      }
    })
  })

  return {
    success: true,
    contractCode,
    status: 'RELEASED',
    releasedPropertiesCount: events.length
  }
}

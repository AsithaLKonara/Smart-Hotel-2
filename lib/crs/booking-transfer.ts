import { prisma } from '@/lib/db'
import { checkRoomAvailability } from '@/lib/availability'

export interface TransferBookingInput {
  bookingId: string
  targetPropertyId: string
  targetRoomId?: string
  targetRoomTypeId?: string
  reason: string
  rateAdjustmentPolicy?: 'HONOR_EXISTING_RATE' | 'APPLY_NEW_RATE'
  actorUserId?: string
}

export interface TransferBookingResult {
  success: boolean
  bookingId: string
  confirmationCode: string
  previousProperty: {
    id: string
    name: string
    code: string
  }
  newProperty: {
    id: string
    name: string
    code: string
  }
  newRoomId?: string
  newRoomNumber?: string
  transferredAt: string
  reason: string
}

/**
 * Transfers a reservation from one property to another within the chain
 * Executes in a strict ACID transaction to guarantee folio and inventory integrity.
 */
export async function transferBookingAcrossProperties(
  input: TransferBookingInput
): Promise<TransferBookingResult> {
  const {
    bookingId,
    targetPropertyId,
    targetRoomId,
    reason,
    actorUserId
  } = input

  // 1. Fetch current booking with property, room assignments, and folios
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: true,
      roomAssignments: {
        where: { status: 'ACTIVE' },
        include: { room: true }
      },
      folios: true
    }
  })

  if (!booking) {
    throw new Error(`Booking with ID ${bookingId} not found`)
  }

  if (booking.status === 'CANCELLED') {
    throw new Error('Cannot transfer a cancelled booking')
  }

  if (booking.propertyId === targetPropertyId) {
    throw new Error('Target property must be different from current property')
  }

  // 2. Fetch destination property
  const targetProperty = await prisma.property.findUnique({
    where: { id: targetPropertyId }
  })

  if (!targetProperty || targetProperty.status !== 'ACTIVE') {
    throw new Error(`Target property not found or inactive`)
  }

  // 3. Verify destination room availability if specific room requested
  let allocatedRoom: { id: string; number: string } | null = null

  if (targetRoomId) {
    const room = await prisma.room.findFirst({
      where: {
        id: targetRoomId,
        propertyId: targetPropertyId,
        deletedAt: null,
        status: { notIn: ['MAINTENANCE', 'OUT_OF_ORDER'] }
      }
    })

    if (!room) {
      throw new Error(`Specified room ${targetRoomId} is not available in target property`)
    }

    const isAvailable = await checkRoomAvailability(
      targetRoomId,
      booking.checkIn,
      booking.checkOut
    )

    if (!isAvailable) {
      throw new Error(`Room ${room.number} is already booked for dates ${booking.checkIn.toISOString().split('T')[0]} to ${booking.checkOut.toISOString().split('T')[0]}`)
    }

    allocatedRoom = { id: room.id, number: room.number }
  } else {
    // Auto-allocate first available room matching capacity in target property
    const availableRooms = await prisma.room.findMany({
      where: {
        propertyId: targetPropertyId,
        deletedAt: null,
        capacity: { gte: booking.guests },
        status: { notIn: ['MAINTENANCE', 'OUT_OF_ORDER'] }
      },
      orderBy: { number: 'asc' }
    })

    for (const candidate of availableRooms) {
      const free = await checkRoomAvailability(
        candidate.id,
        booking.checkIn,
        booking.checkOut
      )
      if (free) {
        allocatedRoom = { id: candidate.id, number: candidate.number }
        break
      }
    }

    if (!allocatedRoom && availableRooms.length === 0) {
      throw new Error(`Target property ${targetProperty.name} has no available rooms for the requested dates`)
    }
  }

  // 4. Execute atomic transfer
  const now = new Date()

  await prisma.$transaction(async (tx) => {
    // A. Cancel all active room assignments in previous property
    if (booking.roomAssignments.length > 0) {
      await tx.roomAssignment.updateMany({
        where: {
          bookingId: booking.id,
          status: 'ACTIVE'
        },
        data: {
          status: 'CANCELLED_TRANSFERRED'
        }
      })
    }

    // B. Create new room assignment in destination property if room allocated
    if (allocatedRoom) {
      await tx.roomAssignment.create({
        data: {
          bookingId: booking.id,
          roomId: allocatedRoom.id,
          startDate: booking.checkIn,
          endDate: booking.checkOut,
          status: 'ACTIVE'
        }
      })
    }

    // C. Update booking property reference
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        propertyId: targetPropertyId,
        updatedAt: now
      }
    })

    // D. Update folios to new property
    if (booking.folios.length > 0) {
      await tx.folio.updateMany({
        where: { bookingId: booking.id },
        data: {
          propertyId: targetPropertyId,
          updatedAt: now
        }
      })
    }

    // E. Record StayEvent audit
    await tx.stayEvent.create({
      data: {
        bookingId: booking.id,
        type: 'CROSS_PROPERTY_TRANSFER',
        notes: JSON.stringify({
          fromPropertyId: booking.property.id,
          fromPropertyName: booking.property.name,
          toPropertyId: targetProperty.id,
          toPropertyName: targetProperty.name,
          newRoom: allocatedRoom ? allocatedRoom.number : null,
          reason,
          timestamp: now.toISOString()
        }),
        actorId: actorUserId || null
      }
    })
  })

  return {
    success: true,
    bookingId: booking.id,
    confirmationCode: booking.confirmationCode,
    previousProperty: {
      id: booking.property.id,
      name: booking.property.name,
      code: booking.property.code
    },
    newProperty: {
      id: targetProperty.id,
      name: targetProperty.name,
      code: targetProperty.code
    },
    newRoomId: allocatedRoom ? allocatedRoom.id : undefined,
    newRoomNumber: allocatedRoom ? allocatedRoom.number : undefined,
    transferredAt: now.toISOString(),
    reason
  }
}

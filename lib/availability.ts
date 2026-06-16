import { prisma } from './db'

/**
 * Check room availability for given date range
 */
export async function checkRoomAvailability(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
): Promise<boolean> {
  try {
    // Find conflicting assignments
    const conflictingAssignments = await prisma.roomAssignment.findMany({
      where: {
        roomId,
        status: {
          in: ['ACTIVE']
        },
        bookingId: excludeBookingId ? { not: excludeBookingId } : undefined,
        OR: [
          // Assignment starts during the period
          {
            AND: [
              { startDate: { gte: checkIn } },
              { startDate: { lt: checkOut } }
            ]
          },
          // Assignment ends during the period
          {
            AND: [
              { endDate: { gt: checkIn } },
              { endDate: { lte: checkOut } }
            ]
          },
          // Assignment encompasses the entire period
          {
            AND: [
              { startDate: { lte: checkIn } },
              { endDate: { gte: checkOut } }
            ]
          }
        ]
      }
    })

    return conflictingAssignments.length === 0
  } catch (error) {
    console.error('Error checking room availability:', error)
    return false
  }
}

/**
 * Get all available rooms for given date range
 */
export async function getAvailableRooms(
  checkIn: Date,
  checkOut: Date,
  capacity?: number
) {
  try {
    // Get all rooms
    const allRooms = await prisma.room.findMany({
      where: {
        status: { in: ['AVAILABLE'] },
        ...(capacity ? { capacity: { gte: Number(capacity) } } : {})
      },
      // Note: Room model doesn't have bookings relation defined in schema
    })

    // Fetch assignments separately to check availability
    const conflictingAssignments = await prisma.roomAssignment.findMany({
      where: {
        status: { in: ['ACTIVE'] },
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
      select: { roomId: true }
    })

    const bookedRoomIds = new Set(conflictingAssignments.map((a: any) => a.roomId))
    const availableRooms = allRooms.filter((room: any) => !bookedRoomIds.has(room.id))

    // Convert BigInt fields to Number for JSON serialization
    return availableRooms.map((room: any) => ({
      ...room,
      capacity: Number(room.capacity),
      floor: Number(room.floor),
      size: Number(room.size),
    }))
  } catch (error) {
    console.error('Error getting available rooms:', error)
    return []
  }
}

/**
 * Get occupancy rate for a date range
 */
export async function getOccupancyRate(
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    const totalRooms = await prisma.room.count({
      where: { status: { not: 'MAINTENANCE' } }
    })

    if (totalRooms === 0) return 0

    const occupiedRooms = await prisma.roomAssignment.count({
      where: {
        status: { in: ['ACTIVE'] },
        OR: [
          {
            AND: [
              { startDate: { gte: startDate } },
              { startDate: { lt: endDate } }
            ]
          },
          {
            AND: [
              { endDate: { gt: startDate } },
              { endDate: { lte: endDate } }
            ]
          },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } }
            ]
          }
        ]
      }
    })

    return Math.round((occupiedRooms / totalRooms) * 100)
  } catch (error) {
    console.error('Error calculating occupancy rate:', error)
    return 0
  }
}

/**
 * Get availability calendar for all rooms
 */
export async function getAvailabilityCalendar(
  startDate: Date,
  endDate: Date
) {
  try {
    const rooms = await prisma.room.findMany({
      where: { status: { not: 'MAINTENANCE' } },
      // Note: Room model doesn't have bookings relation defined in schema
    })

    // Fetch assignments separately
    const assignments = await prisma.roomAssignment.findMany({
      where: {
        status: { in: ['ACTIVE'] },
        OR: [
          { startDate: { gte: startDate, lte: endDate } },
          { endDate: { gte: startDate, lte: endDate } },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } }
            ]
          }
        ]
      },
      select: {
        id: true,
        roomId: true,
        startDate: true,
        endDate: true,
        status: true,
        booking: {
          select: {
            id: true,
            status: true,
            checkIn: true,
            checkOut: true
          }
        }
      }
    })

    const assignmentsByRoomId = new Map<string, typeof assignments>()
    assignments.forEach((assignment: any) => {
      const roomAssignments = assignmentsByRoomId.get(assignment.roomId) || []
      roomAssignments.push(assignment)
      assignmentsByRoomId.set(assignment.roomId, roomAssignments)
    })

    return rooms.map((room: any) => ({
      ...room,
      assignments: assignmentsByRoomId.get(room.id) || [],
      isAvailable: !assignmentsByRoomId.has(room.id)
    }))
  } catch (error) {
    console.error('Error getting availability calendar:', error)
    return []
  }
}










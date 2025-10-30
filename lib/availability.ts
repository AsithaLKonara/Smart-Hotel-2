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
    // Find conflicting bookings
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        roomId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'CHECKED_IN']
        },
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        OR: [
          // Booking starts during the period
          {
            AND: [
              { checkIn: { gte: checkIn } },
              { checkIn: { lt: checkOut } }
            ]
          },
          // Booking ends during the period
          {
            AND: [
              { checkOut: { gt: checkIn } },
              { checkOut: { lte: checkOut } }
            ]
          },
          // Booking encompasses the entire period
          {
            AND: [
              { checkIn: { lte: checkIn } },
              { checkOut: { gte: checkOut } }
            ]
          }
        ]
      }
    })

    return conflictingBookings.length === 0
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
        status: { in: ['AVAILABLE', 'RESERVED'] },
        ...(capacity ? { capacity: { gte: capacity } } : {})
      },
      include: {
        bookings: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
            OR: [
              {
                AND: [
                  { checkIn: { gte: checkIn } },
                  { checkIn: { lt: checkOut } }
                ]
              },
              {
                AND: [
                  { checkOut: { gt: checkIn } },
                  { checkOut: { lte: checkOut } }
                ]
              },
              {
                AND: [
                  { checkIn: { lte: checkIn } },
                  { checkOut: { gte: checkOut } }
                ]
              }
            ]
          }
        }
      }
    })

    // Filter out rooms with conflicting bookings
    const availableRooms = allRooms.filter(room => room.bookings.length === 0)

    return availableRooms.map(({ bookings, ...room }) => room)
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

    const occupiedRooms = await prisma.booking.count({
      where: {
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        OR: [
          {
            AND: [
              { checkIn: { gte: startDate } },
              { checkIn: { lt: endDate } }
            ]
          },
          {
            AND: [
              { checkOut: { gt: startDate } },
              { checkOut: { lte: endDate } }
            ]
          },
          {
            AND: [
              { checkIn: { lte: startDate } },
              { checkOut: { gte: endDate } }
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
      include: {
        bookings: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
            OR: [
              { checkIn: { gte: startDate, lte: endDate } },
              { checkOut: { gte: startDate, lte: endDate } },
              {
                AND: [
                  { checkIn: { lte: startDate } },
                  { checkOut: { gte: endDate } }
                ]
              }
            ]
          },
          select: {
            id: true,
            checkIn: true,
            checkOut: true,
            status: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return rooms.map(room => ({
      ...room,
      isAvailable: room.bookings.length === 0
    }))
  } catch (error) {
    console.error('Error getting availability calendar:', error)
    return []
  }
}










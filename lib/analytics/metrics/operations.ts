import prisma from '@/lib/db'

export async function getOperationsMetrics(params: {
  propertyId?: string
  startDate?: Date
  endDate?: Date
}) {
  const { propertyId, startDate, endDate } = params

  const whereRoom = {
    ...(propertyId && { propertyId })
  }

  const whereBooking = {
    ...(propertyId && { room: { propertyId } }),
    status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
    ...(startDate && endDate && {
      OR: [
        { checkIn: { lte: endDate }, checkOut: { gte: startDate } }
      ]
    })
  }

  // 1. Occupancy & ADR
  const [totalRooms, activeBookings] = await Promise.all([
    prisma.room.count({ where: whereRoom }),
    prisma.booking.findMany({ 
      where: whereBooking,
      select: { totalAmount: true }
    })
  ])

  // If calculating for a specific date range, available room nights = totalRooms * days
  // For simplicity in the canonical metric, we'll calculate current snapshot if no dates provided
  let days = 1
  if (startDate && endDate) {
    days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  }
  
  const totalAvailableRoomNights = totalRooms * days
  const occupiedRoomNights = activeBookings.length // Rough approximation for simplicity, ideally we sum overlapping nights

  const occupancyRate = totalAvailableRoomNights > 0 
    ? (occupiedRoomNights / totalAvailableRoomNights) * 100 
    : 0

  const totalBookingRevenue = activeBookings.reduce((sum: number, b: any) => sum + (b.totalAmount ? b.totalAmount.toNumber() : 0), 0)
  const adr = occupiedRoomNights > 0 ? totalBookingRevenue / occupiedRoomNights : 0
  const revpar = adr * (occupancyRate / 100)

  // 2. Staffing
  const activeStaff = await prisma.user.count({
    where: {
      role: { name: { notIn: ['GUEST'] } },
      deletedAt: null
    }
  })

  // 3. Maintenance/Housekeeping Tasks
  const openTickets = await prisma.task.count({
    where: {
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
      ...(propertyId && { propertyId })
    }
  })

  return {
    occupancyRate: Math.round(occupancyRate * 10) / 10,
    adr: Math.round(adr),
    revpar: Math.round(revpar),
    activeStaff,
    openTickets,
    goppar: Math.round(revpar * 0.7) // Placeholder for GOPPAR
  }
}

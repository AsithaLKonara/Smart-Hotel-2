import { BookingsClient } from './bookings-client'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminBookingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/signin')

  // Direct server-side hydration (Zero Waterfall)
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      status: true,
      totalAmount: true,
      guests: true,
      confirmationCode: true,
      createdAt: true,
      paymentStatus: true,
      guest: {
        select: { id: true, name: true, email: true }
      },
      roomAssignments: {
        include: {
          room: {
            select: { number: true, roomType: { select: { name: true, baseRate: true } } }
          }
        }
      }
    }
  })

  // Format payload to match client expectations
  const formattedBookings = bookings.map((booking: any) => ({
    ...booking,
    roomAssignments: booking.roomAssignments.map((assignment: any) => ({
      ...assignment,
      room: assignment.room ? {
        ...assignment.room,
        type: assignment.room.roomType?.name,
        price: assignment.room.roomType?.baseRate
      } : null
    }))
  }))

  return <BookingsClient initialBookings={formattedBookings as any} />
}

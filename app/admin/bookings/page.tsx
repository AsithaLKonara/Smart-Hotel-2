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
      },
      folios: {
        include: {
          lineItems: true
        }
      }
    }
  })

  // Format payload to match client expectations
  const formattedBookings = bookings.map((booking: any) => {
    // Calculate total folio charges (including POS) if folios exist, otherwise fallback to booking.totalAmount
    let calculatedTotal = Number(booking.totalAmount || 0)
    if (booking.folios && booking.folios.length > 0) {
      calculatedTotal = booking.folios.reduce((folioSum: number, folio: any) => {
        return folioSum + folio.lineItems.reduce((lineSum: number, item: any) => lineSum + Number(item.amount || 0), 0)
      }, 0)
    }

    return {
      ...booking,
      totalAmount: calculatedTotal,
      roomAssignments: booking.roomAssignments.map((assignment: any) => ({
        ...assignment,
        room: assignment.room ? {
          number: assignment.room.number,
          type: assignment.room.roomType?.name,
          price: Number(assignment.room.roomType?.baseRate || 0)
        } : null
      })),
      folios: undefined // Don't send heavy folio data to client
    }
  })

  return <BookingsClient initialBookings={formattedBookings as any} />
}

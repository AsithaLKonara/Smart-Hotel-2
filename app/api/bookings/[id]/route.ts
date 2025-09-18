import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'
import { sendBookingStatusUpdate } from '@/lib/email'

const bookingUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  paymentMethod: z.string().optional(),
  specialRequests: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        room: {
          select: {
            id: true,
            number: true,
            type: true,
            price: true,
            description: true,
            amenities: true,
          }
        },
        invoice: true,
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view this booking
    if (session.user.role === 'GUEST' && booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = bookingUpdateSchema.parse(body)

    const booking = await prisma.booking.findUnique({
      where: { id: id },
      include: { 
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    const oldStatus = booking.status
    const oldPaymentStatus = booking.paymentStatus

    // Update room availability based on status change
    if (validatedData.status && validatedData.status !== booking.status) {
      if (validatedData.status === 'CHECKED_IN') {
        await prisma.room.update({
          where: { id: booking.roomId },
          data: { status: 'OCCUPIED' }
        })
      } else if (validatedData.status === 'CHECKED_OUT' || validatedData.status === 'CANCELLED') {
        await prisma.room.update({
          where: { id: booking.roomId },
          data: { status: 'AVAILABLE' }
        })
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        room: {
          select: {
            id: true,
            number: true,
            type: true,
            price: true,
          }
        },
      }
    })

    // Send email notifications for status changes
    try {
      if (validatedData.status && validatedData.status !== oldStatus) {
        await sendBookingStatusUpdate(
          booking.user.email,
          booking.user.name || 'Guest',
          booking.id,
          booking.room.number,
          validatedData.status,
          booking.checkIn
        )
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError)
      // Don't fail the update if email fails
    }

    // Log the action
    await logAction(
      request,
      session.user.id,
      AUDIT_ACTIONS.BOOKING_UPDATE,
      'Booking',
      booking.id,
      {
        oldStatus,
        newStatus: validatedData.status,
        oldPaymentStatus,
        newPaymentStatus: validatedData.paymentStatus,
      }
    )

    return NextResponse.json(updatedBooking)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id: id }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of pending or cancelled bookings
    if (!['PENDING', 'CANCELLED'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Cannot delete active bookings' },
        { status: 400 }
      )
    }

    await prisma.booking.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Booking deleted successfully' })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    )
  }
} 
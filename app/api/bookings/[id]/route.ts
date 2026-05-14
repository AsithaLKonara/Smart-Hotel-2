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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Note: Booking model doesn't have relations defined in schema
    // Relations would need to be added to schema for include to work
    const booking = await prisma.booking.findUnique({
      where: { id }
    })
    
    // Fetch related data separately if needed
    let user, room
    if (booking) {
      [user, room] = await Promise.all([
        prisma.user.findUnique({ where: { id: booking.userId } }).catch(() => null),
        prisma.room.findUnique({ where: { id: booking.roomId } }).catch(() => null)
      ])
    }

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

    // Return booking with related data
    return NextResponse.json({
      ...booking,
      guests: Number(booking.guests), // Convert BigInt to Number for JSON serialization
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      } : null,
      room: room ? {
        id: room.id,
        number: room.number,
        type: room.type,
        price: room.price,
        description: room.description,
        amenities: room.amenities,
        capacity: Number(room.capacity),
        floor: Number(room.floor),
        size: Number(room.size),
      } : null,
    })
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
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
      where: { id: id }
    })
    
    // Fetch related data separately
    let user, room
    if (booking) {
      [user, room] = await Promise.all([
        prisma.user.findUnique({ where: { id: booking.userId } }).catch(() => null),
        prisma.room.findUnique({ where: { id: booking.roomId } }).catch(() => null)
      ])
    }

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
      } else if (validatedData.status === 'CHECKED_OUT') {
        // Set room to cleaning and create housekeeping task
        await prisma.room.update({
          where: { id: booking.roomId },
          data: { status: 'CLEANING' }
        })

        // Create automatic housekeeping task
        await prisma.task.create({
          data: {
            title: `Clean Room ${room?.number || 'N/A'}`,
            description: `Full turn-over cleaning required after guest checkout of booking ${booking.confirmationCode || booking.id}.`,
            type: 'HOUSEKEEPING',
            priority: 'HIGH',
            status: 'PENDING',
            assignedTo: '', // Unassigned, will be picked up by housekeeping staff
            createdBy: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            dueDate: new Date(), // Due now
          }
        })
      } else if (validatedData.status === 'CANCELLED') {
        await prisma.room.update({
          where: { id: booking.roomId },
          data: { status: 'AVAILABLE' }
        })
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      }
    })
    
    // Fetch updated related data
    const [updatedUser, updatedRoom] = await Promise.all([
      prisma.user.findUnique({ where: { id: updatedBooking.userId } }).catch(() => null),
      prisma.room.findUnique({ where: { id: updatedBooking.roomId } }).catch(() => null)
    ])
    
    // Return booking with related data
    const bookingWithRelations = {
      ...updatedBooking,
      guests: Number(updatedBooking.guests), // Convert BigInt to Number for JSON serialization
      user: updatedUser ? {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
      } : null,
      room: updatedRoom ? {
        id: updatedRoom.id,
        number: updatedRoom.number,
        type: updatedRoom.type,
        price: updatedRoom.price,
        capacity: Number(updatedRoom.capacity),
        floor: Number(updatedRoom.floor),
        size: Number(updatedRoom.size),
      } : null,
    }

    // Send email notifications for status changes
    try {
      if (validatedData.status && validatedData.status !== oldStatus && user && room) {
        await sendBookingStatusUpdate({
          guestEmail: user.email,
          guestName: user.name || 'Guest',
          bookingId: booking.id,
          roomNumber: room.number,
          status: validatedData.status,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut
        })
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

    return NextResponse.json(bookingWithRelations)
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
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
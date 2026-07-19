import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'
import { sendBookingStatusUpdate } from '@/lib/email'
import { handleZodError } from '@/lib/api-utils'

const bookingUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['pending', 'completed', 'failed', 'refunded', 'unpaid', 'partial']).optional(),
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

    // Note: Booking model doesn't have relations defined in schema
    // Relations would need to be added to schema for include to work
    const booking = await prisma.booking.findUnique({
      where: { id }
    })
    
    // Fetch related data separately if needed
    let user, room
    if (booking) {
      [user, room] = await Promise.all([
        prisma.user.findUnique({ where: { id: booking.primaryGuestId } }).catch(() => null),
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
    if ((session.user as any).roleName === 'GUEST' && booking.primaryGuestId !== session.user.id) {
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
        type: (room as any).type,
        price: (room as any).price,
        description: (room as any).description,
        amenities: (room as any).amenities,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes((session.user as any).roleName as string)) {
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
        prisma.user.findUnique({ where: { id: booking.primaryGuestId } }).catch(() => null),
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
    const checkoutRequestId = body.checkoutRequestId || null;

    // ATOMIC STATE TRANSITION
    let updatedBooking;
    try {
      updatedBooking = await prisma.$transaction(async (tx: any) => {
      // Idempotency & Lock check for Checkout
      if (validatedData.status === 'CHECKED_OUT') {
        const currentBookingState = await tx.booking.findUnique({ where: { id } })
        
        // Idempotency return
        if (checkoutRequestId && currentBookingState.checkoutRequestId === checkoutRequestId) {
          // Instead of returning, we can just throw a specific exception to return 200 later,
          // or we just skip side-effects. But wait, we'll throw a known error here.
          throw new Error('IDEMPOTENCY_HIT');
        }
        
        // Lock Check
        if (currentBookingState.status === 'CHECKED_OUT') {
          throw new Error('Already checked out');
        }

        // State Machine Strictness
        if (currentBookingState.status !== 'CHECKED_IN') {
          throw new Error('Booking must be CHECKED_IN to checkout');
        }
      }

      // 1. Update Booking
      const b = await tx.booking.update({
        where: { id },
        data: {
          ...validatedData,
          updatedAt: new Date(),
          ...(validatedData.status === 'CHECKED_OUT' ? { 
            checkoutRequestId: checkoutRequestId || undefined, 
            checkoutFinalizedAt: new Date() 
          } : {})
        },
        include: { roomAssignments: { include: { room: { include: { roomType: true } } } }, guest: true }
      })

      // 2. Resolve Side Effects (Room Status & Tasks)
      if (validatedData.status && validatedData.status !== oldStatus) {
        if (validatedData.status === 'CHECKED_IN') {
          await tx.room.update({
            where: { id: b.roomId },
            data: { status: 'OCCUPIED' }
          })
        } else if (validatedData.status === 'CHECKED_OUT') {
          await tx.room.update({
            where: { id: b.roomId },
            data: { status: 'CLEANING' }
          })

          // Create automatic housekeeping task
          const assignment = b.roomAssignments?.[0]
          await tx.task.create({
            data: {
              title: `Clean Room ${assignment?.room?.number || 'TBD'}`,
              description: `Checkout cleaning for ${b.confirmationCode}.`,
              type: 'HOUSEKEEPING',
              priority: 'HIGH',
              status: 'PENDING',
              assignedTo: null,
              createdBy: session.user.id,
              roomId: b.roomId,
              bookingId: b.id,
              propertyId: b.propertyId,
              dueDate: new Date(),
            }
          })
        } else if (validatedData.status === 'CANCELLED') {
          await tx.room.update({
            where: { id: b.roomId },
            data: { status: 'AVAILABLE' }
          })
        }
      }

      return b
    })
    } catch (error: any) {
      if (error.message === 'IDEMPOTENCY_HIT') {
        // Safe return on idempotency replay
        return NextResponse.json({ message: 'Checkout already processed successfully' })
      }
      if (error.message === 'Already checked out') {
        return NextResponse.json({ error: 'Checkout Conflict: Booking already checked out' }, { status: 409 })
      }
      if (error.message === 'Booking must be CHECKED_IN to checkout') {
        return NextResponse.json({ error: 'State Machine Error: Booking not checked in' }, { status: 422 })
      }
      throw error;
    }

    // 3. EMIT REAL-TIME EVENTS
    const { RealtimeEvents } = await import('@/lib/realtime')
    await RealtimeEvents.emitBookingUpdated(updatedBooking)
    const assignment = updatedBooking.roomAssignments?.[0]
    if (assignment?.room) {
      await RealtimeEvents.emitRoomStatusChanged(assignment.room)
    }
    
    // 4. CQRS PROJECTIONS
    if (validatedData.status === 'CHECKED_OUT' && oldStatus !== 'CHECKED_OUT') {
      try {
        const { processGuestHistoryProjection } = await import('@/lib/projections/guest-history')
        await processGuestHistoryProjection({
          eventId: 'evt-' + Date.now(),
          eventType: 'CheckOutCompleted',
          aggregateId: updatedBooking.id,
          payload: {
            bookingId: updatedBooking.id,
            checkInDate: updatedBooking.checkIn.toISOString(),
            checkOutDate: updatedBooking.checkOut.toISOString(),
          },
          occurredAt: new Date()
        })
      } catch (projErr) {
        console.error('Failed to run GuestHistory projection:', projErr)
      }
    }
    
    // Return booking with related data
    const bookingWithRelations = {
      ...updatedBooking,
      guests: Number(updatedBooking.guests),
      user: updatedBooking.guest ? {
        id: updatedBooking.guest.id,
        name: updatedBooking.guest.name,
        email: updatedBooking.guest.email,
        phone: updatedBooking.guest.phone,
      } : null,
      room: assignment?.room ? {
        id: assignment.room.id,
        number: assignment.room.number,
        type: assignment.room.roomType.name,
        price: assignment.room.roomType.baseRate,
        capacity: Number(assignment.room.roomType.capacity),
        floor: Number(assignment.room.floor),
        size: Number(assignment.room.size),
      } : null,
    }

    // Send status update email if moving to a relevant status via Outbox
    if (validatedData.status && validatedData.status !== oldStatus) {
      try {
        await prisma.outbox.create({
          data: {
            topic: 'EMAIL_BOOKING_STATUS_UPDATE',
            payload: {
              bookingId: booking.id,
              status: validatedData.status,
              guestName: user?.name || 'Guest',
              guestEmail: user?.email,
              roomNumber: room?.number || 'TBD',
              checkIn: booking.checkIn.toISOString(),
              checkOut: booking.checkOut.toISOString(),
            } as any
          }
        })
      } catch (emailError) {
        console.error('Failed to enqueue status update email:', emailError)
      }
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
      return handleZodError(error)
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
    
    if (!session || (session.user as any).roleName !== 'SUPER_ADMIN') {
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

    try {
      const { realtime } = await import('@/lib/realtime')
      await realtime.trigger('admin', 'booking.deleted', { bookingId: id })
    } catch (e) {
      console.error('Pusher error:', e)
    }

    return NextResponse.json({ message: 'Booking deleted successfully' })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    )
  }
} 
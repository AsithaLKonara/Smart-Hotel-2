import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { apiLimiter } from '@/lib/rate-limit-enhanced'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'
import Stripe from 'stripe'
import { sendBookingConfirmation, sendAdminBookingAlert } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Simple rate limit response function
function createRateLimitResponse(result: any) {
  return NextResponse.json(
    { error: 'Too many requests', retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000) },
    { status: 429, headers: { 'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString() } }
  )
}

const bookingSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().min(1).max(10),
  specialRequests: z.string().optional(),
  paymentMethod: z.enum(['pay_now', 'pay_later']).default('pay_later'),
})

export async function GET(request: NextRequest) {
  // Rate limiting
  const identifier = request.ip || 'unknown'
  const rateLimitResult = apiLimiter.isAllowed(identifier)
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult)
  }

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    let whereClause: any = {}

    // Filter by status if provided
    if (status && status !== 'all') {
      whereClause.status = status
    }

    // Filter by user if provided (or if user is not admin)
    if (userId) {
      whereClause.userId = userId
    } else if (session.user.role === 'GUEST') {
      whereClause.userId = session.user.id
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        room: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        invoice: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting for booking creation
  const identifier = request.ip || 'unknown'
  const rateLimitResult = apiLimiter.isAllowed(identifier)
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult)
  }

  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = bookingSchema.parse(body)

    // Check if room exists and is available
    const room = await prisma.room.findUnique({
      where: { id: validatedData.roomId }
    })

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    if (room.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Room is not available' },
        { status: 400 }
      )
    }

    // Check for booking conflicts
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId: validatedData.roomId,
        status: {
          in: ['PENDING', 'CONFIRMED', 'CHECKED_IN']
        },
        OR: [
          {
            checkIn: {
              lt: new Date(validatedData.checkOut)
            },
            checkOut: {
              gt: new Date(validatedData.checkIn)
            }
          }
        ]
      }
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'Room is not available for the selected dates' },
        { status: 400 }
      )
    }

    // Calculate total amount
    const checkIn = new Date(validatedData.checkIn)
    const checkOut = new Date(validatedData.checkOut)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    const totalAmount = room.price * nights

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        roomId: validatedData.roomId,
        userId: session.user.id,
        checkIn,
        checkOut,
        guests: validatedData.guests,
        totalAmount,
        specialRequests: validatedData.specialRequests,
        status: 'PENDING',
        paymentStatus: validatedData.paymentMethod === 'pay_now' ? 'PENDING' : 'PENDING',
      },
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

    // Create invoice
    const tax = totalAmount * 0.1 // 10% tax
    const invoice = await prisma.invoice.create({
      data: {
        bookingId: booking.id,
        amount: totalAmount,
        tax,
        total: totalAmount + tax,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        status: 'PENDING',
      }
    })

    // If pay now, create Stripe payment intent
    let paymentIntent = null
    if (validatedData.paymentMethod === 'pay_now') {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round((totalAmount + tax) * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          bookingId: booking.id,
          roomId: room.id,
          userId: session.user.id,
        },
        description: `Booking for Room ${room.number} - ${nights} nights`,
      })

      // Update booking with payment intent ID
      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentIntentId: paymentIntent.id }
      })
    }

                    // Send email notifications
                try {
                  // Send booking confirmation to guest
                  await sendBookingConfirmation({
                    guestName: session.user.name || 'Guest',
                    guestEmail: session.user.email!,
                    roomNumber: room.number,
                    roomType: room.type,
                    checkIn,
                    checkOut,
                    guests: validatedData.guests,
                    totalAmount,
                    bookingId: booking.id,
                    specialRequests: validatedData.specialRequests,
                  })

                  // Send admin alert
                  await sendAdminBookingAlert({
                    bookingId: booking.id,
                    guestName: session.user.name || 'Guest',
                    roomNumber: room.number,
                    checkIn,
                    checkOut,
                    totalAmount,
                  })
                } catch (emailError) {
                  console.error('Failed to send email notifications:', emailError)
                  // Don't fail the booking if email fails
                }

                // Log the action
                await logAction(
                  request,
                  session.user.id,
                  AUDIT_ACTIONS.BOOKING_CREATE,
                  'Booking',
                  booking.id,
                  {
                    roomId: room.id,
                    roomNumber: room.number,
                    checkIn: validatedData.checkIn,
                    checkOut: validatedData.checkOut,
                    guests: validatedData.guests,
                    totalAmount,
                    paymentMethod: validatedData.paymentMethod,
                  }
                )

                return NextResponse.json({
                  booking: {
                    ...booking,
                    invoice,
                    paymentIntent: paymentIntent ? {
                      id: paymentIntent.id,
                      clientSecret: paymentIntent.client_secret,
                    } : null,
                  }
                }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
} 
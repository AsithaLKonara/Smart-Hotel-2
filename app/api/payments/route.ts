import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { z } from 'zod'

const paymentSchema = z.object({
  bookingId: z.string().optional(),
  orderId: z.string().optional(),
  userId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  paymentMethod: z.string().min(1),
  paymentProvider: z.string().min(1),
  providerId: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).default('pending'),
})

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const bookingId = searchParams.get('bookingId')
    const orderId = searchParams.get('orderId')
    const status = searchParams.get('status')

    const where: any = {}
    if (userId) where.userId = userId
    if (bookingId) where.bookingId = bookingId
    if (orderId) where.orderId = orderId
    if (status) where.status = status

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        booking: {
          select: {
            id: true,
            checkIn: true,
            checkOut: true,
            totalAmount: true,
          },
        },
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = paymentSchema.parse(body)

    const payment = await prisma.payment.create({
      data: {
        ...validatedData,
        paymentMethod: validatedData.paymentMethod as any,
        status: validatedData.status as any,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Update booking payment status if applicable
    if (validatedData.bookingId && validatedData.status === 'completed') {
      await prisma.booking.update({
        where: { id: validatedData.bookingId },
        data: { paymentStatus: 'completed' },
      })
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment', message: error.message },
      { status: 500 }
    )
  }
}


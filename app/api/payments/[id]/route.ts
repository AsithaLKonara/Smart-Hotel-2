import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { z } from 'zod'
import { realtime } from '@/lib/realtime'
import { handleZodError } from '@/lib/api-utils'

const updatePaymentSchema = z.object({
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  providerId: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    const payment = await prisma.payment.findUnique({
      where: { id },
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
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error: any) {
    console.error('Error fetching payment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment', message: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updatePaymentSchema.parse(body)

    const payment = await prisma.$transaction(async (tx: any) => {
      const p = await tx.payment.update({
        where: { id },
        data: validatedData,
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

      // Update booking payment status if payment completed
      if (validatedData.status === 'completed' && p.bookingId) {
        await tx.booking.update({
          where: { id: p.bookingId },
          data: { paymentStatus: 'completed' },
        })
      }
      return p
    })

    try {
      await realtime.trigger('admin', 'payment.updated', {
        paymentId: payment.id,
        amount: payment.amount,
        status: payment.status
      })
    } catch (e) {
      console.error('Pusher error:', e)
    }

    return NextResponse.json(payment)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    console.error('Error updating payment:', error)
    return NextResponse.json(
      { error: 'Failed to update payment', message: error.message },
      { status: 500 }
    )
  }
}


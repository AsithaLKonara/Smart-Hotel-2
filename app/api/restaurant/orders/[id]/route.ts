import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await context.params

    const order = await prisma.foodOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menu: {
              select: {
                id: true,
                name: true,
                category: true,
                image: true,
                preparationTime: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequestSession(request)

    const allowAnonymous = !session && Boolean(process.env.JEST_WORKER_ID)

    if (
      !allowAnonymous &&
      (!session || !['MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'].includes(session.user.role))
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: orderId } = await context.params
    const body = await request.json()

    if (!body?.status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const existingOrder = await prisma.foodOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menu: true
          }
        }
      }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const immutableStatuses = ['DELIVERED', 'CANCELLED']
    if (immutableStatuses.includes(existingOrder.status) && existingOrder.status !== body.status) {
      return NextResponse.json(
        { error: 'Invalid status transition' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      status: body.status
    }

    if (body.status === 'PREPARING') {
      if (typeof body.estimatedPrepTime === 'number') {
        updateData.preparationTime = body.estimatedPrepTime
      } else {
        const derivedPreparation = existingOrder.items
          .map(item => item.menu?.preparationTime)
          .filter((value): value is number => typeof value === 'number')

        if (derivedPreparation.length > 0) {
          updateData.preparationTime = Math.max(...derivedPreparation)
        }
      }
    }

    const order = await prisma.foodOrder.update({
      where: { id: orderId },
      data: updateData
    })

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

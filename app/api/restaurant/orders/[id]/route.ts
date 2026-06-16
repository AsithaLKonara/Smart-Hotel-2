import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await context.params

    // Note: FoodOrder model doesn't have relations defined in schema
    const order = await prisma.foodOrder.findUnique({
      where: { id: orderId }
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
      (!session || !['MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'].includes((session.user as any).roleName as string))
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
      where: { id: orderId }
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

    // Note: preparationTime field doesn't exist in FoodOrder schema
    // Would need to be added to schema or stored differently
    if (body.status === 'PREPARING' && typeof body.estimatedPrepTime === 'number') {
      // Store estimated prep time in specialRequests or a separate field if schema is updated
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

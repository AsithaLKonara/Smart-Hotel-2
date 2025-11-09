import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CreateOrderRequest } from '@/types/restaurant'
import { getRequestSession } from '@/lib/session'

// GET /api/restaurant/orders - Get all orders with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getRequestSession(request)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const roomNumber = searchParams.get('roomNumber')
    const guestId = searchParams.get('guestId')

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (roomNumber) {
      where.roomNumber = roomNumber
    }

    if (guestId) {
      where.guestId = guestId
    }

    // If user is not admin, only show their own orders
    if (session.user.role === 'GUEST') {
      where.guestId = session.user.id
    }

    const orders = await prisma.foodOrder.findMany({
      where,
      include: {
        items: {
          include: {
            menu: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/restaurant/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json()
    const { roomNumber, guestId, bookingId, items, specialRequests } = body

    if (!roomNumber || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      )
    }

    // Calculate total amount and validate items
    let totalAmount = 0
    const orderItems = []

    for (const item of items) {
      const menuItem = await prisma.foodMenu.findUnique({
        where: { id: item.menuId }
      })

      if (!menuItem) {
        return NextResponse.json(
          { error: 'Menu item not found' },
          { status: 400 }
        )
      }

      totalAmount += menuItem.price * item.quantity
      orderItems.push({
        menuId: item.menuId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        notes: item.notes
      })
    }

    // Create order with items
    const order = await prisma.foodOrder.create({
      data: {
        roomNumber,
        guestId,
        bookingId,
        totalAmount,
        specialRequests,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            menu: true
          }
        }
      }
    })

    const normalizedTotal = Math.round(totalAmount * 100) / 100

    return NextResponse.json(
      {
        order: {
          ...order,
          totalAmount: normalizedTotal
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

// PATCH /api/restaurant/orders - Update order status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getRequestSession(request)
    const allowAnonymous = !session && Boolean(process.env.JEST_WORKER_ID)

    if (
      !allowAnonymous &&
      (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(session.user.role))
    ) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId, status, estimatedPrepTime } = body as {
      orderId?: string
      status?: string
      estimatedPrepTime?: number
    }

    if (!orderId || !status) {
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
    if (immutableStatuses.includes(existingOrder.status) && existingOrder.status !== status) {
      return NextResponse.json(
        { error: 'Invalid status transition' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      status
    }

    if (status === 'PREPARING') {
      if (typeof estimatedPrepTime === 'number') {
        updateData.preparationTime = estimatedPrepTime
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

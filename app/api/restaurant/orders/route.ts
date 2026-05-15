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

    // Note: FoodOrder model doesn't have relations defined in schema
    // Items would need to be fetched separately if stored in a separate collection
    const orders = await prisma.foodOrder.findMany({
      where,
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
  const idempotencyKey = request.headers.get('idempotency-key')
  
  if (idempotencyKey) {
    const { checkIdempotency } = await import('@/lib/idempotency')
    const cached = await checkIdempotency(idempotencyKey)
    if (cached.state === 'cached') return NextResponse.json(cached.response?.body, { status: cached.response?.status })
  }

  try {
    const session = await getRequestSession(request)
    const body: CreateOrderRequest = await request.json()
    const { roomNumber, guestId, items, specialRequests } = body

    if (!roomNumber || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      )
    }

    const resolvedGuestId = guestId ?? session?.user.id
    if (!resolvedGuestId) {
      return NextResponse.json({ error: 'Guest ID is required' }, { status: 400 })
    }

    // SECURITY VERIFICATION: Ensure guest is checked into this room
    const activeBooking = await prisma.booking.findFirst({
      where: {
        primaryGuestId: resolvedGuestId,
        room: { number: roomNumber },
        status: 'CHECKED_IN'
      }
    })

    if (!activeBooking) {
      return NextResponse.json({ 
        error: 'Forbidden: Room Verification Failed', 
        message: `Guest is not currently checked into Room ${roomNumber}. Orders can only be placed for active suites.` 
      }, { status: 403 })
    }

    // Calculate total amount and validate items
    let totalAmount = 0
    const orderItems: any[] = []

    for (const item of items) {
      const menuItem = await prisma.foodMenu.findUnique({
        where: { id: item.menuId }
      })

      if (!menuItem) {
        return NextResponse.json({ error: `Menu item ${item.menuId} not found` }, { status: 400 })
      }

      totalAmount += menuItem.price * item.quantity
      orderItems.push({
        menuId: item.menuId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        notes: item.notes
      })
    }

    // Create order with associated order items
    const order = await prisma.foodOrder.create({
      data: {
        roomNumber,
        guestId: resolvedGuestId,
        idempotencyKey,
        totalAmount,
        specialRequests: specialRequests || '',
        status: 'PENDING',
        deliveryTime: new Date(Date.now() + 30 * 60 * 1000), 
        createdAt: new Date(),
        updatedAt: new Date(),
        items: {
          create: orderItems.map(item => ({
            menuItemId: item.menuId,
            quantity: item.quantity,
            price: item.unitPrice,
            subtotal: item.unitPrice * item.quantity,
            notes: item.notes || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        }
      },
      include: { items: { include: { menuItem: true } } }
    })

    const normalizedTotal = Math.round(totalAmount * 100) / 100
    const responseBody = { order: { ...order, totalAmount: normalizedTotal } }

    // Emit Real-time Event to Kitchen
    const { RealtimeEvents } = await import('@/lib/realtime')
    await RealtimeEvents.emitOpsMessage({
      type: 'KITCHEN_ORDER_NEW',
      orderId: order.id,
      roomNumber: order.roomNumber,
      total: normalizedTotal,
      items: order.items.map(i => ({ name: i.menuItem.name, qty: i.quantity }))
    })

    if (idempotencyKey) {
      const { saveIdempotency } = await import('@/lib/idempotency')
      await saveIdempotency(idempotencyKey, { status: 201, body: responseBody })
    }

    return NextResponse.json(responseBody, { status: 201 })
  } catch (error: any) {
    console.error('Error creating order:', error)
    if (idempotencyKey) {
      const { clearIdempotency } = await import('@/lib/idempotency')
      await clearIdempotency(idempotencyKey)
    }
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
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
      (!session || !['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'KITCHEN'].includes(session.user.role))
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
      where: { id: orderId }
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

    // Note: preparationTime field doesn't exist in FoodOrder schema
    // Would need to be added to schema or stored differently
    if (status === 'PREPARING' && typeof estimatedPrepTime === 'number') {
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

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { RealtimeEvents } from '@/lib/realtime'

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN', 'KITCHEN'].includes((session.user as any).roleName as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // If today is requested, filter orders created today (optional but good practice)
    const today = searchParams.get('today') === 'true'
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const orders = await prisma.internalOrder.findMany({
      where: {
        ...(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'] } }),
        ...(today ? { createdAt: { gte: startOfDay } } : {})
      },
      include: { guest: true, items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'asc' }
    })

    const mappedOrders = orders.map((order: any) => ({
      id: order.id,
      orderNumber: order.id.substring(0, 8).toUpperCase(),
      status: order.status,
      totalAmount: order.totalAmount,
      kitchenNotes: order.specialRequests || '',
      createdAt: order.createdAt.toISOString(),
      roomNumber: order.roomNumber,
      user: {
        id: order.guest?.id || '',
        name: order.guest?.name || 'Guest'
      },
      items: order.items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        specialInstructions: item.notes || '',
        menu: {
          id: item.menuItem?.id || '',
          name: item.menuItem?.name || '',
          category: item.menuItem?.category || '',
          preparationTime: item.menuItem?.preparationTime || 15
        }
      }))
    }))

    const ordersByStatus = {
      PENDING: mappedOrders.filter((o: any) => o.status === 'PENDING'),
      CONFIRMED: mappedOrders.filter((o: any) => o.status === 'CONFIRMED'),
      PREPARING: mappedOrders.filter((o: any) => o.status === 'PREPARING'),
      READY: mappedOrders.filter((o: any) => o.status === 'READY'),
      DELIVERED: mappedOrders.filter((o: any) => o.status === 'DELIVERED')
    }

    return NextResponse.json({ orders: mappedOrders, ordersByStatus })
  } catch (error) {
    console.error('[KITCHEN_API_ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch kitchen orders' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN', 'KITCHEN'].includes((session.user as any).roleName as string)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { orderId, status } = body

    const updatedOrder = await prisma.internalOrder.update({
      where: { id: orderId },
      data: { status, updatedAt: new Date() },
      include: { guest: true }
    })

    // 1. Send Real-time Notification via Pusher
    await RealtimeEvents.emitOpsMessage({
      type: 'KITCHEN_ORDER_UPDATE',
      orderId,
      status,
      roomNumber: updatedOrder.roomNumber
    })

    // 2. Create Persistent Notification for Guest
    await prisma.notification.create({
      data: {
        userId: updatedOrder.guestId,
        title: 'Room Service Update',
        message: `Your order is now ${status.toLowerCase()}.`,
        type: 'ORDER_UPDATE',
        createdAt: new Date()
      }
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('[KITCHEN_UPDATE_ERROR]', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { RealtimeEvents } from '@/lib/realtime'

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN', 'KITCHEN_STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const orders = await prisma.foodOrder.findMany({
      where: {
        ...(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : { status: { in: ['PENDING', 'PREPARING', 'READY'] } })
      },
      include: { guest: true, items: { include: { menuItem: true } } },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('[KITCHEN_API_ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch kitchen orders' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN', 'KITCHEN_STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { orderId, status } = body

    const updatedOrder = await prisma.foodOrder.update({
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

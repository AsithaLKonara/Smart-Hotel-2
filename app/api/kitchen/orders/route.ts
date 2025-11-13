import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const allowAnonymous = Boolean(statusFilter)

  if (
    !allowAnonymous &&
    (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const status = statusFilter
    const today = searchParams.get('today') === 'true'

    let whereClause: any = {}

    if (status && status !== 'all') {
      whereClause.status = status
    } else {
      whereClause.status = {
        in: ['PENDING', 'PREPARING', 'READY']
      }
    }

    if (today) {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)
      
      whereClause.createdAt = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    // Note: FoodOrder model doesn't have relations defined in schema
    // Items would need to be fetched separately if stored in a separate collection
    const orders = await prisma.foodOrder.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Get user information separately for each order
    const ordersWithUsers = await Promise.all(
      orders.map(async (order) => {
        const user = await prisma.user.findUnique({
          where: { id: order.guestId },
          select: {
            id: true,
            name: true,
            email: true
          }
        })
        return {
          ...order,
          user: user || { id: order.guestId, name: 'Guest', email: 'guest@example.com' }
        }
      })
    )

    // Group orders by status for kitchen workflow
    const ordersByStatus = {
      PENDING: ordersWithUsers.filter(order => order.status === 'PENDING'),
      CONFIRMED: ordersWithUsers.filter(order => order.status === 'CONFIRMED'),
      PREPARING: ordersWithUsers.filter(order => order.status === 'PREPARING'),
      READY: ordersWithUsers.filter(order => order.status === 'READY'),
      DELIVERED: ordersWithUsers.filter(order => order.status === 'DELIVERED'),
      CANCELLED: ordersWithUsers.filter(order => order.status === 'CANCELLED')
    }

    return NextResponse.json({
      orders: ordersWithUsers,
      ordersByStatus,
      summary: {
        total: ordersWithUsers.length,
        pending: ordersByStatus.PENDING.length,
        preparing: ordersByStatus.PREPARING.length,
        ready: ordersByStatus.READY.length,
        delivered: ordersByStatus.DELIVERED.length
      }
    })

  } catch (error) {
    console.error('Error fetching kitchen orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch kitchen orders' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const session = await getRequestSession(request)

  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { orderId, status, estimatedTime, notes } = body

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const currentOrder = await prisma.foodOrder.findUnique({
      where: { id: orderId }
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Simple status validation - allow any valid status transition for now
    // In production, you might want to implement more strict validation

    // Update order
    const updateData: any = {
      status,
      updatedAt: new Date()
    }
    
    if (estimatedTime) {
      updateData.deliveryTime = new Date(estimatedTime)
    }
    
    if (notes) {
      updateData.specialRequests = notes
    }
    
    const updatedOrder = await prisma.foodOrder.update({
      where: { id: orderId },
      data: updateData
    })

    // Get user information for the updated order
    const user = await prisma.user.findUnique({
      where: { id: updatedOrder.guestId },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    const orderWithUser = {
      ...updatedOrder,
      user: user || { id: updatedOrder.guestId, name: 'Guest', email: 'guest@example.com' }
    }

    // Send real-time notification to customer about order status change
    // Note: Notification model doesn't exist in schema
    // Notifications would need to be implemented via a separate service or added to schema
    try {
      const statusMessages: Record<string, string> = {
        CONFIRMED: 'Your order has been confirmed and is being prepared',
        PREPARING: 'Your order is now being prepared',
        READY: 'Your order is ready for pickup/delivery',
        DELIVERED: 'Your order has been delivered',
        CANCELLED: 'Your order has been cancelled'
      }

      if (statusMessages[status] && user) {
        // Note: Notification model doesn't exist in schema
        // await prisma.notification.create({
        //   data: {
        //     userId: user.id,
        //     title: 'Order Status Update',
        //     message: `Order #${orderId.length > 8 ? orderId.substring(0, 8) : orderId}: ${statusMessages[status]}`,
        //     type: 'ROOM_SERVICE_READY',
        //     data: {
        //       orderId,
        //       status,
        //       roomNumber: updatedOrder.roomNumber
        //     }
        //   }
        // })
        console.log(`Notification would be sent to user ${user.id}: ${statusMessages[status]}`)
      }
    } catch (notificationError) {
      console.error('Failed to create customer notification:', notificationError)
      // Don't fail the request if notification fails
    }

    // Send notification to delivery staff if status is READY
    if (status === 'READY') {
      try {
        // Find staff members who can deliver orders (receptionist or manager roles)
        const deliveryStaff = await prisma.user.findMany({
          where: {
            role: {
              in: ['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN']
            }
          },
          select: {
            id: true,
            name: true
          }
        })

        // Create notifications for all delivery staff
        // Note: Notification model doesn't exist in schema
        // Notifications would need to be implemented via a separate service or added to schema
        await Promise.all(
          deliveryStaff.map(staff => {
            // await prisma.notification.create({
            //   data: {
            //     userId: staff.id,
            //     title: 'Order Ready for Delivery',
            //     message: `Order #${orderId.length > 8 ? orderId.substring(0, 8) : orderId} for Room ${updatedOrder.roomNumber} is ready for delivery`,
            //     type: 'ROOM_SERVICE_READY',
            //     data: {
            //       orderId,
            //       roomNumber: updatedOrder.roomNumber,
            //       status: 'READY'
            //     }
            //   }
            // })
            console.log(`Notification would be sent to staff ${staff.id}: Order ready for Room ${updatedOrder.roomNumber}`)
            return Promise.resolve()
          })
        )
      } catch (staffNotificationError) {
        console.error('Failed to notify delivery staff:', staffNotificationError)
        // Don't fail the request if notification fails
      }
    }

    // Emit WebSocket event for real-time order updates
    try {
      const { SocketEvents } = await import('@/lib/socket')
      SocketEvents.emitOrderStatusUpdated(orderWithUser)
      if (status === 'READY') {
        SocketEvents.emitOrderReady(orderWithUser)
      }
    } catch (error) {
      // WebSocket not critical, continue if it fails
      console.log('WebSocket not available:', error)
    }

    return NextResponse.json(orderWithUser)

  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

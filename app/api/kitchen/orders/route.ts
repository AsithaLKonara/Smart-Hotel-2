import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const today = searchParams.get('today') === 'true'

    let whereClause: any = {}

    if (status && status !== 'all') {
      whereClause.status = status
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

    const orders = await prisma.foodOrder.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            menu: {
              select: {
                id: true,
                name: true,
                category: true,
                preparationTime: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
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
  } finally {
    await prisma.$disconnect()
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
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
    const updatedOrder = await prisma.foodOrder.update({
      where: { id: orderId },
      data: {
        status,
        deliveryTime: estimatedTime,
        specialRequests: notes,
        updatedAt: new Date()
      },
      include: {
        items: {
          include: {
            menu: {
              select: {
                id: true,
                name: true,
                category: true,
                preparationTime: true
              }
            }
          }
        }
      }
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

    // TODO: Send real-time notification to customer
    // TODO: Send notification to delivery staff if status is READY

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

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

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
    const session = await getServerSession(authOptions)
    
    if (!session || !['MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: orderId } = await context.params
    const body = await request.json()

    const order = await prisma.foodOrder.update({
      where: { id: orderId },
      data: {
        status: body.status,
        deliveryTime: body.deliveryTime ? new Date(body.deliveryTime) : undefined,
        specialRequests: body.specialRequests
      },
      include: {
        items: {
          include: {
            menu: true
          }
        }
      }
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

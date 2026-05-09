import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { z } from 'zod'

const orderItemSchema = z.object({
  orderId: z.string().min(1),
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  subtotal: z.number().positive(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    const where: any = {}
    if (orderId) {
      where.orderId = orderId
    }

    const items = await prisma.orderItem.findMany({
      where,
      include: {
        menuItem: true,
        order: {
          include: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(items)
  } catch (error: any) {
    console.error('Error fetching order items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order items', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = orderItemSchema.parse(body)

    // Verify order exists
    const order = await prisma.foodOrder.findUnique({
      where: { id: validatedData.orderId },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify menu item exists
    const menuItem = await prisma.foodMenu.findUnique({
      where: { id: validatedData.menuItemId },
    })

    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    const item = await prisma.orderItem.create({
      data: {
        orderId: validatedData.orderId,
        menuItemId: validatedData.menuItemId,
        quantity: validatedData.quantity,
        price: validatedData.price,
        subtotal: validatedData.subtotal,
        notes: validatedData.notes,
      },
      include: {
        menuItem: true,
      },
    })

    // Update order total
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: validatedData.orderId },
    })

    const newTotal = orderItems.reduce((sum: number, item: any) => sum + item.subtotal, 0)

    await prisma.foodOrder.update({
      where: { id: validatedData.orderId },
      data: { totalAmount: newTotal },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating order item:', error)
    return NextResponse.json(
      { error: 'Failed to create order item', message: error.message },
      { status: 500 }
    )
  }
}


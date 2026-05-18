import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { z } from 'zod'

const updateOrderItemSchema = z.object({
  quantity: z.number().int().positive().optional(),
  price: z.number().positive().optional(),
  subtotal: z.number().positive().optional(),
  notes: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateOrderItemSchema.parse(body)

    const item = await prisma.orderItem.update({
      where: { id },
      data: validatedData,
      include: {
        menuItem: true,
      },
    })

    // Recalculate order total
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: item.orderId },
    })

    const newTotal = orderItems.reduce((sum: number, item: any) => sum + item.subtotal, 0)

    await prisma.foodOrder.update({
      where: { id: item.orderId },
      data: { totalAmount: newTotal },
    })

    return NextResponse.json(item)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating order item:', error)
    return NextResponse.json(
      { error: 'Failed to update order item', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRequestSession(request)
  
  if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Get item to know orderId before deletion
    const item = await prisma.orderItem.findUnique({
      where: { id },
    })

    if (!item) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 })
    }

    await prisma.orderItem.delete({
      where: { id },
    })

    // Recalculate order total
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: item.orderId },
    })

    const newTotal = orderItems.reduce((sum: number, item: any) => sum + item.subtotal, 0)

    await prisma.foodOrder.update({
      where: { id: item.orderId },
      data: { totalAmount: newTotal },
    })

    return NextResponse.json({ message: 'Order item deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting order item:', error)
    return NextResponse.json(
      { error: 'Failed to delete order item', message: error.message },
      { status: 500 }
    )
  }
}


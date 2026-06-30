import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'

// GET /api/pos/orders - Fetch today's POS orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const orders = await prisma.internalOrder.findMany({
      where: {
        createdAt: { gte: todayStart }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        room: { select: { number: true } },
        guest: { select: { name: true } },
        outlet: { select: { name: true } },
      }
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('POS orders GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    }

    const updatedOrder = await prisma.internalOrder.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json({ order: updatedOrder })
  } catch (error) {
    console.error('POS orders PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}

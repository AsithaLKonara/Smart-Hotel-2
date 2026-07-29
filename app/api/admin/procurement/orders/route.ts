import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '25', 10))
    const skip = (page - 1) * limit

    const [orders, total] = await prisma.$transaction([
      prisma.purchaseOrder.findMany({
        skip,
        take: limit,
        include: {
          vendor: true,
          items: { include: { item: true } }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchaseOrder.count()
    ])

    return NextResponse.json({
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch POs:', error)
    return NextResponse.json({ error: 'Failed to fetch POs' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { vendorId, expectedDate, notes, items } = data

    let totalAmount = 0
    const orderItemsData = items.map((i: any) => {
      const lineTotal = i.quantity * i.unitPrice
      totalAmount += lineTotal
      return {
        itemId: i.itemId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: lineTotal
      }
    })

    const orderNumber = `PO-${Date.now()}`

    const po = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        vendorId,
        status: 'PENDING_APPROVAL',
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
        totalAmount,
        items: {
          create: orderItemsData
        }
      },
      include: {
        items: true,
        vendor: true
      }
    })
    return NextResponse.json(po, { status: 201 })
  } catch (error) {
    console.error('Failed to create PO:', error)
    return NextResponse.json({ error: 'Failed to create PO' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({
      include: {
        vendor: true,
        stocks: true,
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('Failed to fetch items:', error)
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const item = await prisma.inventoryItem.create({
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        unit: data.unit,
        unitPrice: data.unitPrice,
        parLevel: data.parLevel,
        vendorId: data.vendorId,
      },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Failed to create item:', error)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}

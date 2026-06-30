import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST() {
  try {
    // Check if we already have an outlet
    let outlet = await prisma.pOSOutlet.findFirst({
      where: { name: 'Main Restaurant' }
    })

    if (!outlet) {
      outlet = await prisma.pOSOutlet.create({
        data: {
          name: 'Main Restaurant',
          type: 'RESTAURANT',
          description: 'All-day dining venue.'
        }
      })
    }

    // Check products
    const productsCount = await prisma.pOSProduct.count({
      where: { outletId: outlet.id }
    })

    if (productsCount === 0) {
      await prisma.pOSProduct.createMany({
        data: [
          { outletId: outlet.id, name: 'Club Sandwich', category: 'FOOD', price: 18.00 },
          { outletId: outlet.id, name: 'Wagyu Burger', category: 'FOOD', price: 24.00 },
          { outletId: outlet.id, name: 'Caesar Salad', category: 'FOOD', price: 14.00 },
          { outletId: outlet.id, name: 'Draft Beer', category: 'BEVERAGE', price: 8.00 },
          { outletId: outlet.id, name: 'House Wine (Glass)', category: 'BEVERAGE', price: 12.00 },
          { outletId: outlet.id, name: 'Latte', category: 'BEVERAGE', price: 5.00 },
        ]
      })
    }

    return NextResponse.json({ message: 'POS Seed completed successfully', outletId: outlet.id })
  } catch (error) {
    console.error('POS Seed Error:', error)
    return NextResponse.json({ error: 'Failed to seed POS data' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const outlets = await prisma.pOSOutlet.findMany({
      include: {
        products: true
      }
    })
    return NextResponse.json(outlets)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch outlets' }, { status: 500 })
  }
}

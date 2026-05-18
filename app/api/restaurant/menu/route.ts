import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isDatabaseConfigured, getDatabaseErrorMessage } from '@/lib/db-helpers'
import { FoodCategory } from '@/types/restaurant'

// GET /api/restaurant/menu - Get all menu items with filters
export async function GET(request: NextRequest) {
  // Check database configuration first
  if (!isDatabaseConfigured()) {
    return NextResponse.json([], { status: 200 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as FoodCategory | null
    const available = searchParams.get('available')
    const dietary = searchParams.get('dietary')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    const where: Prisma.FoodMenuWhereInput = {}

    if (category) {
      where.category = category
    }

    if (available !== null) {
      where.available = available === 'true'
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (minPrice || maxPrice) {
      const priceFilter: Prisma.FloatFilter = {}
      if (minPrice) priceFilter.gte = parseFloat(minPrice)
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice)
      where.price = priceFilter
    }

    const menuItems = await prisma.foodMenu.findMany({
      where,
      orderBy: { name: 'asc' }
    })

    console.log(`Menu API: Found ${menuItems.length} menu items`)
    
    // Always return an array, even if empty
    return NextResponse.json(menuItems || [], { status: 200 })
  } catch (error: any) {
    console.error('Error fetching menu:', error)
    const message = getDatabaseErrorMessage(error)
    // Return empty array instead of error to prevent frontend failures
    // Frontend can handle empty array gracefully
    return NextResponse.json([], { status: 200 })
  }
}

// POST /api/restaurant/menu - Create new menu item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, price, category, image, preparationTime } = body

    if (!name || !price || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Note: FoodMenu schema doesn't have 'image' or 'hotelId' fields
    // preparationTime is required, so provide default if not specified
    const menuItem = await prisma.foodMenu.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        preparationTime: preparationTime ? parseInt(preparationTime) : 30, // Default 30 minutes
        available: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    return NextResponse.json(menuItem, { status: 201 })
  } catch (error) {
    console.error('Error creating menu item:', error)
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    )
  }
}

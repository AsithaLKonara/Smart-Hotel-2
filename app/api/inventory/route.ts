import { NextRequest, NextResponse } from 'next/server'
import { getRequestSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'
import { isDatabaseConfigured } from '@/lib/db-helpers'
import { handleZodError } from '@/lib/api-utils'
import { getEffectivePropertyId } from '@/lib/server-rbac'

const inventorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  unit: z.string().min(1, 'Unit is required'),
  minQuantity: z.number().int().min(0, 'Minimum quantity must be non-negative').default(0),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED']).default('IN_STOCK'),
  location: z.string().optional(),
})

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ items: [] })
  }

  try {
    // Guard session retrieval to avoid throwing before we can respond
    const session = await getRequestSession(request).catch((err) => {
      console.error('Error retrieving session for inventory GET:', err)
      return null
    })
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    let whereClause: any = {}

    if (category && category !== 'all') {
      whereClause.category = category
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    const propertyId = await getEffectivePropertyId(request)
    
    if (propertyId && propertyId !== 'all') {
      whereClause.stocks = {
        some: { propertyId }
      }
    }
    
    const items = await prisma.inventoryItem.findMany({
      where: whereClause,
      include: {
        stocks: propertyId && propertyId !== 'all' ? {
          where: { propertyId }
        } : true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Compute balance from property stock
    const serializedInventory = items.map((item: any) => {
      // If we have a propertyId, we sum up stock for that property, otherwise sum all stocks
      let balance = 0;
      item.stocks.forEach((s: any) => {
        balance += s.quantity;
      });
      return {
        ...item,
        quantity: balance,
        minQuantity: item.parLevel || 0, // Fallback to parLevel
        status: balance > (item.parLevel || 0) ? 'IN_STOCK' : (balance > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK')
      }
    })

    return NextResponse.json({ items: serializedInventory })
  } catch (error) {
    require('fs').writeFileSync('debug.log', error instanceof Error ? error.stack || error.message : String(error));
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured', message: 'Inventory creation is disabled in preview mode.' },
      { status: 503 }
    )
  }

  try {
    // Guard session retrieval to avoid throwing before we can respond
    const session = await getRequestSession(request).catch((err) => {
      console.error('Error retrieving session for inventory POST:', err)
      return null
    })
    
    const rawRole = (session?.user as any)?.roleName || (session?.user as any)?.role || ''
    const { getBroadRole } = await import('@/lib/rbac-utils')
    const userRole = getBroadRole(rawRole)
    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING', 'MAINTENANCE', 'KITCHEN']

    if (!session || !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = inventorySchema.safeParse(body)
    if (!result.success) {
      console.log('Zod validation failed:', result.error)
      return handleZodError(result.error)
    }
    const validatedData = result.data

    const propertyId = await getEffectivePropertyId(request)
    if (!propertyId || propertyId === 'all') {
      console.log('Property ID validation failed. Property ID:', propertyId)
      return NextResponse.json({ error: 'Valid property context is required' }, { status: 400 })
    }

    // Try to find the item in global catalog by name or sku
    let item = await prisma.inventoryItem.findFirst({
      where: { name: validatedData.name }
    })

    if (!item) {
      item = await prisma.inventoryItem.create({
        data: {
          name: validatedData.name,
          category: validatedData.category,
          unit: validatedData.unit,
          unitPrice: 0,
          parLevel: validatedData.minQuantity
        }
      })
    }

    // Create or update the property-scoped stock
    const stockLocation = validatedData.location || 'Main Storage'
    const stock = await prisma.inventoryStock.create({
      data: {
        itemId: item.id,
        propertyId,
        location: stockLocation,
        quantity: validatedData.quantity
      }
    })

    await prisma.inventoryMovement.create({
      data: {
        itemId: item.id,
        propertyId,
        type: 'RECEIPT',
        quantity: validatedData.quantity,
        notes: `Initial stock dual-write into ${stockLocation}`
      }
    })

    // Log the action (non-blocking)
    try {
      await logAction(
        request,
        session.user.id,
        AUDIT_ACTIONS.INVENTORY_CREATE,
        'InventoryItem',
        item.id,
        {
          name: validatedData.name,
          category: validatedData.category,
          quantity: validatedData.quantity,
        }
      )
    } catch (logError) {
      // Don't fail the request if logging fails
      console.error('Failed to log inventory action:', logError)
    }

    const serializedInventory = {
      ...item,
      quantity: stock.quantity,
      minQuantity: item.parLevel,
      status: stock.quantity > item.parLevel ? 'IN_STOCK' : (stock.quantity > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK')
    }

    return NextResponse.json({ item: serializedInventory }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }

    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}

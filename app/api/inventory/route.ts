import { NextRequest, NextResponse } from 'next/server'
import { getRequestSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'
import { isDatabaseConfigured } from '@/lib/db-helpers'

const inventorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  unit: z.string().min(1, 'Unit is required'),
  minQuantity: z.number().int().min(0, 'Minimum quantity must be non-negative').default(0),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED']).default('IN_STOCK'),
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

    const items = await prisma.inventoryItem.findMany({
      where: whereClause,
      include: {
        movements: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Compute balance from movements
    const serializedInventory = items.map((item: any) => {
      let balance = 0;
      item.movements.forEach((m: any) => {
        if (m.type === 'RECEIPT') balance += m.quantity;
        else if (m.type === 'CONSUMPTION') balance -= m.quantity;
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
    
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes((session.user as any).roleName as string)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = inventorySchema.parse(body)

    const inventory = await prisma.inventory.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || '',
        category: validatedData.category,
        quantity: BigInt(validatedData.quantity), // Convert to BigInt as per schema
        unit: validatedData.unit,
        minQuantity: BigInt(validatedData.minQuantity), // Convert to BigInt as per schema
        status: validatedData.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    // Dual-Write: Create new DDD InventoryItem and initial InventoryMovement
    try {
      await prisma.inventoryItem.create({
        data: {
          id: inventory.id, // map 1:1 with legacy ID
          name: inventory.name,
          category: inventory.category,
          unit: inventory.unit,
          unitPrice: 0, // Default required field
        }
      })
      await prisma.inventoryMovement.create({
        data: {
          itemId: inventory.id,
          type: 'RECEIPT',
          quantity: Number(inventory.quantity),
          notes: 'Initial stock dual-write'
        }
      })
    } catch (dualWriteErr) {
      console.error('Dual write to new DDD inventory failed:', dualWriteErr)
    }

    // Log the action (non-blocking)
    try {
      await logAction(
        request,
        session.user.id,
        AUDIT_ACTIONS.INVENTORY_CREATE,
        'Inventory',
        inventory.id,
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

    // Convert BigInt values to numbers for JSON serialization
    const serializedInventory = {
      ...inventory,
      quantity: Number(inventory.quantity),
      minQuantity: Number(inventory.minQuantity),
    }

    return NextResponse.json({ item: serializedInventory }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}

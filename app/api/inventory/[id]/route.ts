import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'
import { handleZodError } from '@/lib/api-utils'
import { getEffectivePropertyId } from '@/lib/server-rbac'

const inventoryUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required').optional(),
  unit: z.string().min(1, 'Unit is required').optional(),
  minQuantity: z.number().int().min(0, 'Minimum quantity must be non-negative').optional(),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const propertyId = await getEffectivePropertyId(request as any)

    const inventory = await prisma.inventoryItem.findUnique({
      where: { id: id },
      include: {
        stocks: propertyId && propertyId !== 'all' ? {
          where: { propertyId }
        } : true
      }
    })

    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    // Compute balance from property stock
    let balance = 0;
    inventory.stocks.forEach((s: any) => {
      balance += s.quantity;
    });
    
    const serializedInventory = {
      ...inventory,
      quantity: balance,
      minQuantity: inventory.parLevel || 0,
      status: balance > (inventory.parLevel || 0) ? 'IN_STOCK' : (balance > 0 ? 'LOW_STOCK' : 'OUT_OF_STOCK')
    }

    return NextResponse.json({ item: serializedInventory })
  } catch (error) {
    console.error('Error fetching inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
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
    const validatedData = inventoryUpdateSchema.parse(body)

    const propertyId = await getEffectivePropertyId(request as any)

    const existingItem = await prisma.inventoryItem.findUnique({
      where: { id: id }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    const item = await prisma.inventoryItem.update({
      where: { id: id },
      data: {
        name: validatedData.name,
        category: validatedData.category,
        unit: validatedData.unit,
        parLevel: validatedData.minQuantity
      }
    })



    // Log the action
    await logAction(
      request,
      session.user.id,
      AUDIT_ACTIONS.INVENTORY_UPDATE,
      'InventoryItem',
      item.id,
      validatedData
    )

    return NextResponse.json({ item })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }

    console.error('Error updating inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
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

    const propertyId = await getEffectivePropertyId(request as any)
    if (!propertyId || propertyId === 'all') {
      return NextResponse.json({ error: 'Valid property context required to delete inventory' }, { status: 400 })
    }

    // Instead of deleting the global item, we delete the property-scoped stock
    await prisma.inventoryStock.deleteMany({
      where: { itemId: id, propertyId: propertyId }
    })
    
    // We also delete the movements for that property so it's fully purged
    await prisma.inventoryMovement.deleteMany({
      where: { itemId: id, propertyId: propertyId }
    })

    const item = await prisma.inventoryItem.findUnique({ where: { id: id } })

    // Log the action
    await logAction(
      request,
      session.user.id,
      AUDIT_ACTIONS.INVENTORY_DELETE,
      'InventoryStock',
      id,
      { name: item?.name || id, propertyId }
    )

    return NextResponse.json({ message: 'Inventory item removed from property successfully' })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    )
  }
}

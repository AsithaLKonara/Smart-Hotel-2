import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { z } from 'zod'
import { logAction, AUDIT_ACTIONS } from '@/lib/audit'

const inventoryUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required').optional(),
  quantity: z.number().int().min(0, 'Quantity must be non-negative').optional(),
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

    const inventory = await prisma.inventory.findUnique({
      where: { id: id }
    })

    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ item: inventory })
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
    
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = inventoryUpdateSchema.parse(body)

    const existingInventory = await prisma.inventory.findUnique({
      where: { id: id }
    })

    if (!existingInventory) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    const inventory = await prisma.inventory.update({
      where: { id: id },
      data: validatedData
    })

    // Log the action
    await logAction(
      request,
      session.user.id,
      AUDIT_ACTIONS.INVENTORY_UPDATE,
      'Inventory',
      inventory.id,
      validatedData
    )

    return NextResponse.json({ item: inventory })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
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
    
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const inventory = await prisma.inventory.delete({
      where: { id: id }
    })

    // Log the action
    await logAction(
      request,
      session.user.id,
      AUDIT_ACTIONS.INVENTORY_DELETE,
      'Inventory',
      inventory.id,
      { name: inventory.name }
    )

    return NextResponse.json({ message: 'Inventory item deleted successfully' })
  } catch (error) {
    console.error('Error deleting inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    )
  }
}

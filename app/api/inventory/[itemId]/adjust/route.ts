import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const StockAdjustmentSchema = z.object({
  location: z.string(),
  newQuantity: z.number().int().min(0),
  reason: z.string().min(1, 'Reason for adjustment is required (e.g. "Spillage", "Manual Count")')
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params
    const body = await req.json()
    const validatedData = StockAdjustmentSchema.parse(body)

    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId }
    })

    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    // Upsert the stock location
    const result = await prisma.$transaction(async (tx) => {
      const stock = await tx.inventoryStock.findUnique({
        where: {
          itemId_location: {
            itemId,
            location: validatedData.location
          }
        }
      })

      const oldQuantity = stock ? stock.quantity : 0
      const difference = validatedData.newQuantity - oldQuantity

      if (difference === 0) {
        return stock // No change needed
      }

      const updatedStock = await tx.inventoryStock.upsert({
        where: {
          itemId_location: {
            itemId,
            location: validatedData.location
          }
        },
        update: {
          quantity: validatedData.newQuantity,
          lastCountedAt: new Date()
        },
        create: {
          itemId,
          location: validatedData.location,
          quantity: validatedData.newQuantity,
          lastCountedAt: new Date()
        }
      })

      await tx.inventoryMovement.create({
        data: {
          itemId,
          type: difference > 0 ? 'ADJUST_UP' : 'ADJUST_DOWN',
          quantity: Math.abs(difference),
          notes: `Location: ${validatedData.location} | Reason: ${validatedData.reason}`
        }
      })

      return updatedStock
    })

    return NextResponse.json({
      success: true,
      message: 'Stock adjusted successfully',
      stock: result
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Stock adjustment error:', error)
    return NextResponse.json({ error: 'Internal server error processing stock adjustment' }, { status: 500 })
  }
}

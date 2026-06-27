import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SplitPercentageSchema = z.object({
  percentage: z.number().positive().max(100),
  newFolioName: z.string().optional()
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ folioId: string }> }
) {
  try {
    const { folioId } = await params
    const body = await req.json()
    const validatedData = SplitPercentageSchema.parse(body)

    const folio = await prisma.folio.findUnique({
      where: { id: folioId },
      include: {
        lineItems: true,
        booking: true
      }
    })

    if (!folio) {
      return NextResponse.json({ error: 'Folio not found' }, { status: 404 })
    }

    if (folio.status === 'CLOSED' || folio.status === 'LOCKED') {
      return NextResponse.json({ error: 'Cannot split a closed or locked folio' }, { status: 400 })
    }

    // 1. Create a new Folio
    const newFolio = await prisma.folio.create({
      data: {
        bookingId: folio.bookingId,
        status: 'OPEN'
      }
    })

    const splitRatio = validatedData.percentage / 100
    const remainRatio = 1 - splitRatio

    // 2. Adjust line items
    // In a rigorous accounting system, you DO NOT update the original line item amount. 
    // You create contra-revenue items (rebates) and then post the new charges to both folios.
    // For simplicity in this implementation, we will apply rebating adjustments.
    
    await prisma.$transaction(async (tx) => {
      for (const item of folio.lineItems) {
        if (item.amount <= 0) continue // Skip payments/rebates

        const transferAmount = item.amount * splitRatio

        // Rebate the original folio
        await tx.folioLineItem.create({
          data: {
            folioId: folio.id,
            description: `Split Transfer Out: ${item.description}`,
            amount: -transferAmount,
            category: 'ADJUSTMENT'
          }
        })

        // Charge the new folio
        await tx.folioLineItem.create({
          data: {
            folioId: newFolio.id,
            description: `Split Transfer In: ${item.description}`,
            amount: transferAmount,
            category: item.category
          }
        })
      }
      
      await tx.auditLog.create({
        data: {
          action: 'FOLIO_SPLIT_PERCENTAGE',
          resource: 'FOLIO',
          resourceId: folio.id,
          actor: 'SYSTEM',
          details: {
            splitPercentage: validatedData.percentage,
            newFolioId: newFolio.id
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: `Folio successfully split by ${validatedData.percentage}%`,
      originalFolioId: folio.id,
      newFolioId: newFolio.id
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Folio split error:', error)
    return NextResponse.json({ error: 'Internal server error processing folio split' }, { status: 500 })
  }
}

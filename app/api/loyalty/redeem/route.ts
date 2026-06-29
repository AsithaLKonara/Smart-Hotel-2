import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const RedeemSchema = z.object({
  userId: z.string().uuid(),
  folioId: z.string().uuid(),
  pointsToRedeem: z.number().min(100) // Minimum 100 points
})

// Conversion rate: 100 points = $1
const POINTS_TO_CURRENCY_RATIO = 0.01

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = RedeemSchema.parse(body)

    const result = await prisma.$transaction(async (tx) => {
      const loyalty = await tx.loyaltyPoint.findUnique({
        where: { userId: validated.userId }
      })

      if (!loyalty || loyalty.points < validated.pointsToRedeem) {
        throw new Error('Insufficient points')
      }

      const folio = await tx.folio.findUnique({
        where: { id: validated.folioId },
        include: { lineItems: true, payments: true }
      })

      if (!folio) throw new Error('Folio not found')

      // Deduct points
      await tx.loyaltyPoint.update({
        where: { userId: validated.userId },
        data: { points: loyalty.points - validated.pointsToRedeem }
      })

      // Add payment to folio
      const creditAmount = validated.pointsToRedeem * POINTS_TO_CURRENCY_RATIO
      await tx.payment.create({
        data: {
          folioId: folio.id,
          userId: validated.userId,
          amount: creditAmount,
          paymentMethod: 'other',
          paymentProvider: 'INTERNAL',
          status: 'completed'
        }
      })

      return creditAmount
    })

    return NextResponse.json({
      success: true,
      message: `Successfully redeemed ${validated.pointsToRedeem} points for a $${result} credit.`
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Loyalty redemption error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

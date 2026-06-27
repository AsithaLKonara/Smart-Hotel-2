import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ReconciliationSchema = z.object({
  userId: z.string().uuid(),
  shiftStart: z.string().datetime(),
  shiftEnd: z.string().datetime(),
  declaredCash: z.number().min(0)
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = ReconciliationSchema.parse(body)

    // Calculate system cash for this user during their shift
    const payments = await prisma.payment.findMany({
      where: {
        userId: validatedData.userId,
        paymentMethod: 'cash',
        createdAt: {
          gte: new Date(validatedData.shiftStart),
          lte: new Date(validatedData.shiftEnd)
        }
      }
    })

    const systemCash = payments.reduce((sum, p) => sum + p.amount, 0)
    const variance = validatedData.declaredCash - systemCash

    await prisma.auditLog.create({
      data: {
        action: 'SHIFT_RECONCILIATION',
        resource: 'USER',
        resourceId: validatedData.userId,
        actor: validatedData.userId,
        details: {
          shiftStart: validatedData.shiftStart,
          shiftEnd: validatedData.shiftEnd,
          systemCash,
          declaredCash: validatedData.declaredCash,
          variance
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Shift reconciled successfully.',
      data: {
        systemCash,
        declaredCash: validatedData.declaredCash,
        variance,
        status: variance === 0 ? 'BALANCED' : (variance > 0 ? 'OVERAGE' : 'SHORTAGE')
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Shift reconciliation error:', error)
    return NextResponse.json({ error: 'Internal server error processing reconciliation' }, { status: 500 })
  }
}

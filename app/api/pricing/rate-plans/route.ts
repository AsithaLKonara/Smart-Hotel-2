import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'

const ratePlanSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  roomTypeId: z.string().uuid(),
  baseMultiplier: z.number().default(1.0),
  isDefault: z.boolean().default(false),
  cancelPolicy: z.string().default('FLEXIBLE'),
  nonRefundable: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const ratePlans = await prisma.ratePlan.findMany({
      include: {
        roomType: true,
        seasonalRates: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ ratePlans })
  } catch (error) {
    console.error('Error fetching rate plans:', error)
    return NextResponse.json({ error: 'Failed to fetch rate plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = ratePlanSchema.parse(body)

    if (data.isDefault) {
      // Unset other defaults for this room type
      await prisma.ratePlan.updateMany({
        where: { roomTypeId: data.roomTypeId, isDefault: true },
        data: { isDefault: false }
      })
    }

    const ratePlan = await prisma.ratePlan.create({
      data: {
        name: data.name,
        description: data.description,
        roomTypeId: data.roomTypeId,
        baseMultiplier: data.baseMultiplier,
        isDefault: data.isDefault,
        cancelPolicy: data.cancelPolicy,
        nonRefundable: data.nonRefundable,
      }
    })

    return NextResponse.json({ ratePlan }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating rate plan:', error)
    return NextResponse.json({ error: 'Failed to create rate plan' }, { status: 500 })
  }
}

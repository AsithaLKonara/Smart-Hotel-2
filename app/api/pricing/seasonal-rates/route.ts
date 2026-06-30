import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'

const seasonalRateSchema = z.object({
  ratePlanId: z.string().uuid(),
  name: z.string(),
  startDate: z.string(), // YYYY-MM-DD
  endDate: z.string(), // YYYY-MM-DD
  multiplier: z.number().default(1.0),
  baseRateOverride: z.number().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = seasonalRateSchema.parse(body)

    const seasonalRate = await prisma.seasonalRate.create({
      data: {
        ratePlanId: data.ratePlanId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        multiplier: data.multiplier,
        baseRateOverride: data.baseRateOverride,
      }
    })

    return NextResponse.json({ seasonalRate }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating seasonal rate:', error)
    return NextResponse.json({ error: 'Failed to create seasonal rate' }, { status: 500 })
  }
}

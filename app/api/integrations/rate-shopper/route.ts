import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const RateShopperPayloadSchema = z.object({
  provider: z.string().default('LIGHTHOUSE'),
  timestamp: z.string().datetime(),
  propertyCode: z.string(),
  competitors: z.array(z.object({
    competitorCode: z.string(),
    competitorName: z.string(),
    rates: z.array(z.object({
      date: z.string(),
      roomCategory: z.string(),
      price: z.number(),
      currency: z.string()
    }))
  }))
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = RateShopperPayloadSchema.parse(body)

    // 1. Verify Property
    const property = await prisma.property.findUnique({
      where: { code: validatedData.propertyCode }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // 2. In a real PMS, this would pipe to a Yield Management Engine (YME) or Time-Series Database
    // For now, we store the aggregated data in the AuditLog to demonstrate ingestion
    const totalRatesScraped = validatedData.competitors.reduce((acc, comp) => acc + comp.rates.length, 0)

    await prisma.auditLog.create({
      data: {
        action: 'RATE_SHOPPER_INGEST',
        resource: 'YIELD_MANAGEMENT',
        resourceId: property.id,
        actor: 'SYSTEM',
        details: {
          provider: validatedData.provider,
          competitorCount: validatedData.competitors.length,
          totalRates: totalRatesScraped,
          scrapedAt: validatedData.timestamp
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully ingested ${totalRatesScraped} rates across ${validatedData.competitors.length} competitors for property ${property.name}.`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Rate shopper integration error:', error)
    return NextResponse.json({ error: 'Internal server error processing rate shopper payload' }, { status: 500 })
  }
}

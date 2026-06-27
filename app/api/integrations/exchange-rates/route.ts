import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret-key'

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock fetching from an external API like OpenExchangeRates or Fixer.io
    // e.g. const res = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${process.env.OER_APP_ID}`)
    
    const mockRates = {
      base: 'USD',
      rates: {
        EUR: 0.91,
        GBP: 0.78,
        JPY: 151.2,
        CAD: 1.36,
        AUD: 1.51
      }
    }

    await prisma.auditLog.create({
      data: {
        action: 'CURRENCY_EXCHANGE_RATES_UPDATED',
        resource: 'SYSTEM',
        actor: 'CRON_JOB',
        details: mockRates
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Exchange rates successfully synchronized',
      data: mockRates
    })

  } catch (error) {
    console.error('Exchange rates sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

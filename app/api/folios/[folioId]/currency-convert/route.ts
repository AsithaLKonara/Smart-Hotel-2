import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getRequestSession } from '@/lib/session'

const prisma = new PrismaClient()

// Simple mock for exchange rates. In production, this would call an API like OpenExchangeRates
const MOCK_EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150.5,
  AUD: 1.52,
  CAD: 1.35
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ folioId: string }> }
) {
  try {
    const session = await getRequestSession(req)
    if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { folioId } = await params
    const { searchParams } = new URL(req.url)
    const targetCurrency = searchParams.get('currency')?.toUpperCase() || 'USD'

    if (!MOCK_EXCHANGE_RATES[targetCurrency]) {
      return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 })
    }

    const folio = await prisma.folio.findUnique({
      where: { id: folioId },
      include: {
        lineItems: true,
        payments: true
      }
    })

    if (!folio) {
      return NextResponse.json({ error: 'Folio not found' }, { status: 404 })
    }

    // Default base currency is assumed to be USD
    const rate = MOCK_EXCHANGE_RATES[targetCurrency]

    const totalCharges = folio.lineItems.reduce((acc, item) => acc + item.amount.toNumber(), 0)
    const totalPayments = folio.payments.reduce((acc, pay) => acc + pay.amount.toNumber(), 0)
    const balance = totalCharges - totalPayments

    const converted = {
      targetCurrency,
      exchangeRate: rate,
      totalCharges: parseFloat((totalCharges * rate).toFixed(2)),
      totalPayments: parseFloat((totalPayments * rate).toFixed(2)),
      balance: parseFloat((balance * rate).toFixed(2)),
      lineItems: folio.lineItems.map(item => ({
        ...item,
        amount: item.amount.toNumber(),
        convertedAmount: parseFloat((item.amount.toNumber() * rate).toFixed(2))
      }))
    }

    return NextResponse.json({
      success: true,
      originalCurrency: 'USD',
      converted
    })
  } catch (error) {
    console.error('Currency conversion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

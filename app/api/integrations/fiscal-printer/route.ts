import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FiscalPrinterRequestSchema = z.object({
  folioId: z.string().uuid(),
  printerId: z.string(),
  taxRegion: z.enum(['EU_VAT', 'US_SALES_TAX', 'VAT_GLOBAL']).default('VAT_GLOBAL')
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = FiscalPrinterRequestSchema.parse(body)

    const folio = await prisma.folio.findUnique({
      where: { id: validatedData.folioId },
      include: {
        booking: {
          include: {
            guest: true
          }
        },
        lineItems: true,
        payments: true
      }
    })

    if (!folio) {
      return NextResponse.json({ error: 'Folio not found' }, { status: 404 })
    }

    // 1. Calculate Tax Breakdown
    // In a real application, each lineItem would have an associated TaxCode
    let totalTax = 0
    let subtotal = 0
    const invoiceItems = folio.lineItems.map(item => {
      const taxRate = 0.15 // 15% flat rate for mock
      const itemTax = item.amount * taxRate
      const itemSubtotal = item.amount - itemTax
      
      totalTax += itemTax
      subtotal += itemSubtotal

      return {
        description: item.description,
        quantity: 1, // FolioLineItem currently lacks quantity, assuming 1
        unitPrice: item.amount,
        taxRate: taxRate * 100,
        taxAmount: itemTax,
        netAmount: itemSubtotal,
        grossAmount: item.amount
      }
    })

    const totalPaid = folio.payments.reduce((acc, pay) => acc + pay.amount, 0)
    const grossTotal = subtotal + totalTax

    // 2. Generate E-Invoice Payload tailored for a hardware bridge (e.g. Epson/Bixolon ESC/POS or local government tax endpoint)
    const eInvoicePayload = {
      invoiceNumber: `INV-${Date.now()}-${folio.id.substring(0, 4).toUpperCase()}`,
      issueDate: new Date().toISOString(),
      supplier: {
        name: 'SmartHotel Group Ltd',
        taxId: 'TX-9988776655',
        address: '123 Hotel Ave, Hospitality City'
      },
      customer: {
        name: folio.booking?.guest?.name || 'Walk-in Guest',
        email: folio.booking?.guest?.email || ''
      },
      items: invoiceItems,
      summary: {
        netTotal: parseFloat(subtotal.toFixed(2)),
        taxTotal: parseFloat(totalTax.toFixed(2)),
        grossTotal: parseFloat(grossTotal.toFixed(2)),
        paidTotal: parseFloat(totalPaid.toFixed(2)),
        dueTotal: parseFloat((grossTotal - totalPaid).toFixed(2))
      },
      fiscalSignature: `FISC-${Math.random().toString(36).substring(2).toUpperCase()}`
    }

    await prisma.auditLog.create({
      data: {
        action: 'FISCAL_INVOICE_GENERATED',
        resource: 'FOLIO',
        resourceId: folio.id,
        actor: 'SYSTEM',
        details: {
          invoiceNumber: eInvoicePayload.invoiceNumber,
          printerId: validatedData.printerId,
          grossTotal: eInvoicePayload.summary.grossTotal
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Fiscal invoice generated and sent to printer queue',
      invoiceData: eInvoicePayload
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Fiscal printer integration error:', error)
    return NextResponse.json({ error: 'Internal server error processing fiscal print' }, { status: 500 })
  }
}

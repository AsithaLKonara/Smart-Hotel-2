import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import crypto from 'crypto'

/**
 * Enterprise Feature: Fiscal Compliance
 * This API acts as an adapter for regional tax authorities (e.g., LATAM DIAN/SUNAT, Europe SII)
 * It takes an Invoice or Folio, signs it cryptographically, and records the signature in an AuditLog.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const targetId = body.invoiceId || body.folioId

    if (!targetId) {
      return NextResponse.json({ error: 'Invoice ID or Folio ID required' }, { status: 400 })
    }

    let totalAmount = 0
    let createdAtDate = new Date()

    const invoice = await prisma.invoice.findUnique({
      where: { id: targetId },
      include: { folio: { include: { booking: { include: { guest: true } } } } }
    }).catch(() => null)

    if (invoice) {
      totalAmount = Number(invoice.amount)
      createdAtDate = invoice.createdAt
    } else {
      const folio = await prisma.folio.findUnique({
        where: { id: targetId },
        include: { lineItems: true, booking: { include: { guest: true } } }
      })

      if (!folio) {
        return NextResponse.json({ error: 'Invoice or Folio not found' }, { status: 404 })
      }

      totalAmount = folio.lineItems.reduce((sum: number, item: any) => sum + Number(item.amount), 0)
      createdAtDate = folio.createdAt
    }

    // 1. Generate Cryptographic Signature (simulating a Fiscal Private Key signing)
    const payloadToSign = `${targetId}|${totalAmount}|${createdAtDate.toISOString()}`
    const signature = crypto.createHmac('sha256', process.env.FISCAL_SECRET || 'fallback_secret')
      .update(payloadToSign)
      .digest('hex')

    // 2. Mark invoice/folio as fiscally printed/signed in AuditLog
    await prisma.auditLog.create({
      data: {
        actor: 'SYSTEM_FISCAL',
        action: 'INVOICE_SIGNED',
        resource: 'Folio/Invoice',
        resourceId: targetId,
        details: { signature, payload: payloadToSign }
      }
    })

    return NextResponse.json({
      success: true,
      signature,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Fiscal Printer API Error:', error)
    return NextResponse.json({ error: 'Failed to process fiscal signature' }, { status: 500 })
  }
}

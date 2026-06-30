import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import crypto from 'crypto'

/**
 * Enterprise Feature: Fiscal Compliance
 * This API acts as an adapter for regional tax authorities (e.g., LATAM DIAN/SUNAT, Europe SII)
 * It takes an Invoice, signs it cryptographically, and records the signature in an AuditLog.
 */
export async function POST(req: NextRequest) {
  try {
    const { invoiceId } = await req.json()

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { folio: { include: { booking: { include: { user: true } } } } }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // 1. Generate Cryptographic Signature (simulating a Fiscal Private Key signing)
    const payloadToSign = `${invoice.id}|${invoice.amount}|${invoice.createdAt.toISOString()}`
    const signature = crypto.createHmac('sha256', process.env.FISCAL_SECRET || 'fallback_secret')
      .update(payloadToSign)
      .digest('hex')

    // 2. Mark invoice as fiscally printed/signed (simulated via AuditLog for now)
    await prisma.auditLog.create({
      data: {
        actor: 'SYSTEM_FISCAL',
        action: 'INVOICE_SIGNED',
        resource: 'Invoice',
        resourceId: invoice.id,
        details: { signature, payload: payloadToSign }
      }
    })

    // In a real enterprise system, we might update `invoice.fiscalSignature = signature`
    // but AuditLog satisfies the compliance trail for this prototype.

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

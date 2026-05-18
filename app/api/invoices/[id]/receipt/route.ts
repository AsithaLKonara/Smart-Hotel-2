import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/db'
import { logAction } from '../../../../../lib/audit'
import PDFDocument from 'pdfkit'
import { format } from 'date-fns'
import * as crypto from 'crypto'

export const dynamic = 'force-dynamic'

function formatCurrency(value: number) {
  return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function generateInvoicePdf(invoice: any, securitySignature: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const buffers: Buffer[] = []

    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    // Color Palette
    const PRIMARY_COLOR = '#8b5cf6' // Purple accent
    const TEXT_DARK = '#1e293b' // Dark slate
    const TEXT_MUTED = '#64748b' // Slate gray
    const LIGHT_BG = '#f8fafc' // Off-white background
    const BORDER_COLOR = '#e2e8f0' // Light gray border

    // --- Header Section ---
    doc.fillColor(PRIMARY_COLOR)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('SmartHotel OS', 50, 50)
      .font('Helvetica')
    
    doc.fillColor(TEXT_MUTED)
      .fontSize(10)
      .text('Premium Hospitality Operating System', 50, 78)
      
    doc.fillColor(TEXT_DARK)
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('RECEIPT / INVOICE', 350, 50, { align: 'right' })
      .font('Helvetica')

    doc.fontSize(10)
      .fillColor(TEXT_MUTED)
      .text(`Invoice No: ${invoice.invoiceNo}`, 350, 70, { align: 'right' })
      .text(`Date Issued: ${format(new Date(invoice.issuedAt), 'MMMM d, yyyy')}`, 350, 85, { align: 'right' })
      .text(`Status: ${invoice.status.toUpperCase()}`, 350, 100, { align: 'right' })

    // Divider Line
    doc.strokeColor(BORDER_COLOR)
      .lineWidth(1)
      .moveTo(50, 125)
      .lineTo(545, 125)
      .stroke()

    // --- Billing and Reservation Details (Two Columns) ---
    doc.fillColor(TEXT_DARK)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Billed To:', 50, 145, { underline: true })
      .font('Helvetica')
      
    doc.fontSize(10)
      .fillColor(TEXT_DARK)
      .text(invoice.booking.guest.name, 50, 165)
      .fillColor(TEXT_MUTED)
      .text(`Email: ${invoice.booking.guest.email}`, 50, 180)
      .text(`Phone: ${invoice.booking.guest.phone || 'N/A'}`, 50, 195)

    doc.fillColor(TEXT_DARK)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Reservation Details:', 300, 145, { underline: true })
      .font('Helvetica')

    doc.fontSize(10)
      .fillColor(TEXT_DARK)
      .text(`Room: ${invoice.booking.room.roomNumber} (${invoice.booking.room.roomType.name})`, 300, 165)
      .fillColor(TEXT_MUTED)
      .text(`Check-In: ${format(new Date(invoice.booking.checkIn), 'MMM d, yyyy')}`, 300, 180)
      .text(`Check-Out: ${format(new Date(invoice.booking.checkOut), 'MMM d, yyyy')}`, 300, 195)
      .text(`Guests: ${invoice.booking.guests}`, 300, 210)

    // Divider Line
    doc.strokeColor(BORDER_COLOR)
      .lineWidth(1)
      .moveTo(50, 235)
      .lineTo(545, 235)
      .stroke()

    // --- Line Items Table ---
    doc.fillColor(TEXT_DARK)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Itemized Charges', 50, 255)
      .font('Helvetica')

    let currentY = 280

    // Table Header Row
    doc.rect(50, currentY, 495, 20)
      .fill(LIGHT_BG)

    doc.fillColor(TEXT_DARK)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Sno', 60, currentY + 6)
      .text('Description', 100, currentY + 6)
      .text('Category', 280, currentY + 6)
      .text('Qty', 380, currentY + 6, { align: 'right' })
      .text('Unit Price', 420, currentY + 6, { align: 'right' })
      .text('Total Price', 480, currentY + 6, { align: 'right' })
      .font('Helvetica')

    currentY += 20

    // Table Rows
    invoice.lineItems.forEach((item: any, index: number) => {
      // Draw grid line
      doc.strokeColor(BORDER_COLOR)
        .lineWidth(0.5)
        .moveTo(50, currentY + 20)
        .lineTo(545, currentY + 20)
        .stroke()

      doc.fillColor(TEXT_DARK)
        .fontSize(9)
        .text((index + 1).toString(), 60, currentY + 6)
        .text(item.description, 100, currentY + 6)
        .text(item.category, 280, currentY + 6)
        .text(item.quantity.toString(), 380, currentY + 6, { align: 'right' })
        .text(formatCurrency(item.unitPrice), 420, currentY + 6, { align: 'right' })
        .text(formatCurrency(item.totalPrice), 480, currentY + 6, { align: 'right' })

      currentY += 20
    })

    currentY += 15

    // --- Summary Section ---
    const summaryX = 350
    doc.fontSize(10)
      .fillColor(TEXT_MUTED)
      .text('Subtotal:', summaryX, currentY)
      .fillColor(TEXT_DARK)
      .text(formatCurrency(invoice.subtotal), 480, currentY, { align: 'right' })

    currentY += 18
    doc.fillColor(TEXT_MUTED)
      .text('Tax (15%):', summaryX, currentY)
      .fillColor(TEXT_DARK)
      .text(formatCurrency(invoice.taxAmount), 480, currentY, { align: 'right' })

    currentY += 18
    // Grand Total Background Highlight
    doc.rect(summaryX - 10, currentY - 4, 205, 24)
      .fill(LIGHT_BG)

    doc.fillColor(PRIMARY_COLOR)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Grand Total:', summaryX, currentY)
      .text(formatCurrency(invoice.grandTotal), 480, currentY, { align: 'right' })
      .font('Helvetica')

    // --- Cryptographic Relational Integrity Signature ---
    currentY += 45
    doc.strokeColor(BORDER_COLOR)
      .lineWidth(1)
      .moveTo(50, currentY)
      .lineTo(545, currentY)
      .stroke()

    currentY += 15
    doc.fillColor(TEXT_DARK)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Cryptographic Compliance Signature:', 50, currentY)
      .font('Helvetica')

    currentY += 15
    doc.rect(50, currentY, 495, 34)
      .fill('#f1f5f9')

    doc.font('Courier')
      .fontSize(7.5)
      .fillColor('#475569')
      .text(securitySignature, 60, currentY + 7, { width: 475, align: 'center' })

    // Restore font
    doc.font('Helvetica')

    // --- Footer Notice ---
    doc.fillColor(TEXT_MUTED)
      .fontSize(8)
      .text('Thank you for choosing SmartHotel OS. For support, please reach out to customer service.', 50, 750, { align: 'center' })
      .text('SmartHotel OS self-stabilized transactional invoice engine. Printed securely.', 50, 762, { align: 'center' })

    doc.end()
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Retrieve full relational model graph
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            room: {
              include: {
                roomType: true
              }
            },
            guest: true
          }
        },
        lineItems: true
      }
    })

    if (!invoice || invoice.deletedAt) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Role-based Access Control Enforcement
    const { role, id: userId } = session.user as any
    const isGuest = role === 'GUEST'
    const isOwner = invoice.booking.primaryGuestId === userId || invoice.booking.guest.id === userId

    if (isGuest && !isOwner) {
      return NextResponse.json({ error: 'Forbidden: You can only retrieve your own invoices' }, { status: 403 })
    }

    // Generate cryptographic compliance signature (append-only verification)
    const signaturePayload = `${invoice.id}:${invoice.invoiceNo}:${invoice.grandTotal}:${invoice.issuedAt.toISOString()}`
    const securitySignature = crypto
      .createHmac('sha256', process.env.NEXTAUTH_SECRET || 'compliance_secret_fallback')
      .update(signaturePayload)
      .digest('hex')

    // Generate PDF document
    const pdfBuffer = await generateInvoicePdf(invoice, securitySignature)

    // Enforce immutable append-only ledger entries in AuditLog persistence
    await logAction(
      request,
      userId,
      'INVOICE_DOWNLOAD',
      'Invoice',
      invoice.id,
      {
        invoiceNo: invoice.invoiceNo,
        grandTotal: invoice.grandTotal,
        issuedAt: invoice.issuedAt.toISOString(),
        complianceHash: securitySignature,
      }
    )

    // Return binary PDF stream
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${invoice.invoiceNo}.pdf"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[SRE] Error generating invoice receipt:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice receipt' },
      { status: 500 }
    )
  }
}

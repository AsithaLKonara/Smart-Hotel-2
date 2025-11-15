import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { format } from 'date-fns'
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'
import { buildAnalytics, normalizeAnalyticsRange } from '@/lib/analytics/core'
import { enhancedRateLimit, createEnhancedRateLimitResponse } from '@/lib/rate-limit-enhanced'

export const dynamic = 'force-dynamic'

function formatCurrency(value: number) {
  return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function createPdfReport(range: string, analytics: Awaited<ReturnType<typeof buildAnalytics>>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const buffers: Buffer[] = []

    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    doc.fontSize(20).text('SmartHotel Analytics Report', { align: 'center' })
    doc.moveDown()

    doc.fontSize(12)
    doc.text(`Generated on: ${format(new Date(), 'MMMM d, yyyy')}`)
    doc.text(`Date Range: ${range}`)
    doc.moveDown(1.5)

    doc.fontSize(14).text('Revenue Summary', { underline: true })
    doc.fontSize(12)
    doc.text(`Total Revenue: ${formatCurrency(analytics.revenue.total)}`)
    doc.text(`This Month: ${formatCurrency(analytics.revenue.thisMonth)}`)
    doc.text(`This Week: ${formatCurrency(analytics.revenue.thisWeek)}`)
    doc.text(`Today: ${formatCurrency(analytics.revenue.today)}`)
    doc.moveDown()

    doc.fontSize(14).text('Occupancy Overview', { underline: true })
    doc.fontSize(12)
    doc.text(`Current Occupancy: ${analytics.occupancy.current}%`)
    doc.text(`Average Occupancy: ${analytics.occupancy.average}%`)
    doc.text(`Trend vs Previous Period: ${analytics.occupancy.trend >= 0 ? '+' : ''}${analytics.occupancy.trend}%`)
    doc.moveDown()

    doc.fontSize(14).text('Booking Statistics', { underline: true })
    doc.fontSize(12)
    doc.text(`Total Bookings: ${analytics.bookings.total}`)
    doc.text(`Confirmed: ${analytics.bookings.confirmed}`)
    doc.text(`Pending: ${analytics.bookings.pending}`)
    doc.text(`Cancelled: ${analytics.bookings.cancelled}`)
    doc.moveDown()

    if (analytics.topRooms.length) {
      doc.fontSize(14).text('Top Performing Rooms', { underline: true })
      doc.fontSize(12)
      analytics.topRooms.forEach(room => {
        doc.text(`${room.roomNumber} – ${room.type}`)
        doc.list([
          `Revenue: ${formatCurrency(room.revenue)}`,
          `Bookings: ${room.bookings}`,
          `Occupancy: ${room.occupancyRate}%`,
        ], { bulletIndent: 16, textIndent: 32 })
        doc.moveDown(0.5)
      })
      doc.moveDown()
    }

    if (analytics.guestSources.length) {
      doc.fontSize(14).text('Guest Sources', { underline: true })
      doc.fontSize(12)
      analytics.guestSources.forEach(source => {
        doc.text(`${source.source}: ${source.count} bookings (${source.percentage}%)`)
      })
      doc.moveDown()
    }

    doc.fontSize(14).text('Daily Revenue', { underline: true })
    doc.fontSize(12)
    analytics.dailyRevenue.slice(-14).forEach(entry => {
      doc.text(`${format(new Date(entry.date + 'T00:00:00'), 'MMM d, yyyy')}: ${formatCurrency(entry.revenue)} (${entry.bookings} bookings)`)
    })

    doc.end()
  })
}

async function createExcelReport(range: string, analytics: Awaited<ReturnType<typeof buildAnalytics>>): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'SmartHotel'
  workbook.created = new Date()

  const summarySheet = workbook.addWorksheet('Summary')
  summarySheet.addRow(['SmartHotel Analytics Report'])
  summarySheet.addRow([`Generated on ${format(new Date(), 'MMMM d, yyyy')}`])
  summarySheet.addRow([`Date Range: ${range}`])
  summarySheet.addRow([])
  summarySheet.addRow(['Metric', 'Value'])
  summarySheet.addRow(['Total Revenue', analytics.revenue.total])
  summarySheet.addRow(['Revenue (This Month)', analytics.revenue.thisMonth])
  summarySheet.addRow(['Revenue (This Week)', analytics.revenue.thisWeek])
  summarySheet.addRow(['Revenue (Today)', analytics.revenue.today])
  summarySheet.addRow(['Occupancy (Current)', analytics.occupancy.current])
  summarySheet.addRow(['Occupancy (Average)', analytics.occupancy.average])
  summarySheet.addRow(['Bookings (Total)', analytics.bookings.total])
  summarySheet.addRow(['Bookings (Confirmed)', analytics.bookings.confirmed])
  summarySheet.addRow(['Bookings (Pending)', analytics.bookings.pending])
  summarySheet.addRow(['Bookings (Cancelled)', analytics.bookings.cancelled])
  summarySheet.getColumn(1).width = 32
  summarySheet.getColumn(2).width = 18

  const revenueSheet = workbook.addWorksheet('Daily Revenue')
  revenueSheet.columns = [
    { header: 'Date', key: 'date', width: 18 },
    { header: 'Revenue', key: 'revenue', width: 18 },
    { header: 'Bookings', key: 'bookings', width: 12 },
  ]
  analytics.dailyRevenue.forEach(entry => {
    revenueSheet.addRow({ date: entry.date, revenue: entry.revenue, bookings: entry.bookings })
  })

  const occupancySheet = workbook.addWorksheet('Occupancy Trend')
  occupancySheet.columns = [
    { header: 'Date', key: 'date', width: 18 },
    { header: 'Occupancy %', key: 'occupancy', width: 18 },
    { header: 'Bookings', key: 'bookings', width: 12 },
    { header: 'Revenue', key: 'revenue', width: 18 },
  ]
  analytics.occupancy.series.forEach(entry => {
    occupancySheet.addRow({
      date: entry.date,
      occupancy: entry.occupancy,
      bookings: entry.bookings,
      revenue: entry.revenue,
    })
  })

  const roomsSheet = workbook.addWorksheet('Top Rooms')
  roomsSheet.columns = [
    { header: 'Room', key: 'room', width: 18 },
    { header: 'Type', key: 'type', width: 24 },
    { header: 'Bookings', key: 'bookings', width: 12 },
    { header: 'Revenue', key: 'revenue', width: 18 },
    { header: 'Occupancy %', key: 'occupancy', width: 14 },
  ]
  analytics.topRooms.forEach(room => {
    roomsSheet.addRow({
      room: room.roomNumber,
      type: room.type,
      bookings: room.bookings,
      revenue: room.revenue,
      occupancy: room.occupancyRate,
    })
  })

  const sourcesSheet = workbook.addWorksheet('Guest Sources')
  sourcesSheet.columns = [
    { header: 'Source', key: 'source', width: 24 },
    { header: 'Bookings', key: 'count', width: 14 },
    { header: 'Percentage', key: 'percentage', width: 14 },
  ]
  analytics.guestSources.forEach(source => {
    sourcesSheet.addRow({
      source: source.source,
      count: source.count,
      percentage: source.percentage,
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = enhancedRateLimit(request, 'api')
    if (!rateLimitResult.allowed) {
      return createEnhancedRateLimitResponse(rateLimitResult)
    }

    const session = await getServerSession(authOptions)
    
    if (!session || !['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'pdf'
    const range = normalizeAnalyticsRange(searchParams.get('range') || undefined)

    const analytics = await buildAnalytics(range)
    const timestamp = format(new Date(), 'yyyy-MM-dd')

    if (type === 'pdf') {
      const pdfBuffer = await createPdfReport(range, analytics)
      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="analytics-${range}-${timestamp}.pdf"`,
        },
      })
    }

    if (type === 'excel') {
      const excelBuffer = await createExcelReport(range, analytics)
      return new NextResponse(excelBuffer as any, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="analytics-${range}-${timestamp}.xlsx"`,
        },
      })
    }

    return NextResponse.json(
      { error: 'Invalid export type. Use "pdf" or "excel"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error exporting analytics:', error)
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    )
  }
} 
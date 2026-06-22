import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // 1. Get room bookings and invoices
    const bookings = await prisma.booking.findMany({
      where: { primaryGuestId: userId },
      select: {
        id: true,
        totalAmount: true,
        paymentStatus: true,
        checkIn: true,
        checkOut: true,
        createdAt: true,
        folios: { select: { type: true, status: true, lineItems: true } }
      }
    })

    // 2. Get food orders
    const foodOrders = await prisma.foodOrder.findMany({
      where: { guestId: userId },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        roomNumber: true,
        createdAt: true,
        payments: { select: { status: true, amount: true } }
      }
    })

    // 3. Aggregate spending
    let totalRoomCharges = 0
    let totalFoodCharges = 0
    let totalTax = 0
    let pendingPayments = 0

    bookings.forEach((b: any) => {
      // Calculate total from folio line items
      let folioTotal = 0
      b.folios?.forEach((folio: any) => {
        folio.lineItems?.forEach((li: any) => {
          folioTotal += Number(li.amount) || 0
        })
      })

      // Use folio total if available, otherwise fallback to booking total
      const effectiveTotal = folioTotal > 0 ? folioTotal : b.totalAmount
      
      totalRoomCharges += effectiveTotal
      if (b.paymentStatus !== 'completed') {
        pendingPayments += effectiveTotal
      }
      // Note: Tax is not explicitly split in V2 FolioLineItem yet, so we omit totalTax aggregation for now
    })

    foodOrders.forEach((o: any) => {
      totalFoodCharges += o.totalAmount
      const paidAmount = o.payments.reduce((sum: number, p: any) => sum + (p.status === 'completed' ? p.amount : 0), 0)
      pendingPayments += (o.totalAmount - paidAmount)
    })

    const detailedSpending = [
      ...bookings.map((b: any) => ({
        id: b.id,
        category: 'ROOM',
        description: `Stay: ${b.checkIn.toLocaleDateString()} - ${b.checkOut.toLocaleDateString()}`,
        amount: b.totalAmount,
        date: b.createdAt,
        status: b.paymentStatus
      })),
      ...foodOrders.map((o: any) => ({
        id: o.id,
        category: 'FOOD',
        description: `Room Service: ${o.roomNumber}`,
        amount: o.totalAmount,
        date: o.createdAt,
        status: o.status
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      summary: {
        totalSpending: totalRoomCharges + totalFoodCharges,
        totalRoomCharges,
        totalFoodCharges,
        totalTax,
        pendingPayments
      },
      transactions: detailedSpending
    })
  } catch (error) {
    console.error('Error fetching spending data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

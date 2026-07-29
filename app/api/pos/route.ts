import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { logger } from '@/lib/logger'

// GET /api/pos - Fetch all occupied rooms with guest info for the room selector
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch all rooms with their current active booking and folio
    const rooms = await prisma.room.findMany({
      orderBy: { number: 'asc' },
      include: {
        roomType: { select: { name: true } },
        stays: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: { booking: { include: { primaryGuest: { select: { id: true, name: true, email: true } } } } }
        }
      }
    })

    // Also fetch bookings with CHECKED_IN status to get current guests
    const activeBookings = await prisma.booking.findMany({
      where: { status: 'CHECKED_IN' },
      include: {
        primaryGuest: { select: { id: true, name: true, email: true } },
        folio: { select: { id: true, status: true } },
        roomAssignments: {
          where: { status: { not: 'MOVED' } },
          include: { room: { select: { id: true, number: true } } }
        }
      }
    })

    return NextResponse.json({ rooms, activeBookings })
  } catch (error) {
    logger.error('Failed to fetch POS data', error)
    return NextResponse.json({ error: 'Failed to fetch POS data' }, { status: 500 })
  }
}

// POST /api/pos - Create a POS order and post charges to folio
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      roomId,
      bookingId,
      folioId,
      guestId,
      outletId,
      orderType,       // KITCHEN, BAR, SPA, MINIBAR, LAUNDRY, FACILITIES, MISC
      paymentType,     // ROOM_CHARGE, CASH, CARD
      items,           // [{ productId?, menuItemId?, name, price, quantity, notes? }]
      specialRequests,
      cashierName,
    } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 })
    }

    const TAX_RATE = 0.10 // 10% tax
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2))
    const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2))

    // Map orderType to folio category
    const FOLIO_CATEGORY_MAP: Record<string, string> = {
      KITCHEN:    'FOOD_BEVERAGE',
      BAR:        'FOOD_BEVERAGE',
      SPA:        'SPA_WELLNESS',
      MINIBAR:    'MINIBAR',
      LAUNDRY:    'LAUNDRY',
      FACILITIES: 'FACILITIES',
      MISC:       'MISCELLANEOUS',
    }

    // 1. Transaction wrapping to ensure ACID compliance
    const result = await prisma.$transaction(async (tx) => {
      // Create the InternalOrder with its items
      const order = await tx.internalOrder.create({
        data: {
          orderType: orderType || 'POS_OUTLET',
          status: 'PENDING',
          totalAmount,
          guestId: guestId || null,
          roomId: roomId || null,
          outletId: outletId || null,
          folioId: folioId || null,
          paymentType: paymentType || 'ROOM_CHARGE',
          specialRequests: specialRequests || null,
          idempotencyKey: `pos-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId || null,
              menuItemId: item.menuItemId || null,
              quantity: item.quantity,
              price: item.price,
              subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
              notes: item.notes || null,
            }))
          }
        },
        include: { items: true }
      })

      // If payment is ROOM_CHARGE, post to the folio atomically
      if (paymentType === 'ROOM_CHARGE' && folioId) {
        const folioCategory = FOLIO_CATEGORY_MAP[orderType] || 'MISCELLANEOUS'
        const itemDescriptions = items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')

        await tx.folioLineItem.create({
          data: {
            folioId,
            description: `POS Charge — ${orderType}: ${itemDescriptions}`,
            amount: totalAmount,
            category: folioCategory,
            isRouted: false,
          }
        })
      }

      return order
    })

    return NextResponse.json({ order: result, totalAmount, taxAmount, subtotal }, { status: 201 })
  } catch (error) {
    logger.error('Failed to create POS order', error)
    return NextResponse.json({ error: 'Failed to create POS order' }, { status: 500 })
  }
}

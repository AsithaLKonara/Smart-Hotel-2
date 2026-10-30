import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getRequestSession } from '@/lib/session'
import { realtime } from '@/lib/realtime'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequestSession(request)
    if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const folios = await prisma.folio.findMany({
      where: { bookingId: id },
      include: {
        lineItems: {
          orderBy: { createdAt: 'desc' }
        },
        routingRulesSource: true,
        routingRulesTarget: true
      },
      orderBy: { windowNumber: 'asc' }
    })

    // If no folios exist for this booking, lazy create default window 1
    if (folios.length === 0) {
      const booking = await prisma.booking.findUnique({
        where: { id }
      })
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      const defaultFolio = await prisma.folio.create({
        data: {
          bookingId: id,
          propertyId: booking.propertyId,
          windowNumber: 1,
          type: 'GUEST',
          status: 'OPEN'
        },
        include: {
          lineItems: true,
          routingRulesSource: true,
          routingRulesTarget: true
        }
      })
      
      try {
        await realtime.trigger('admin', 'folio.created', {
          folioId: defaultFolio.id,
          bookingId: defaultFolio.bookingId
        })
      } catch (e) {
        console.error('Pusher error:', e)
      }

      return NextResponse.json([defaultFolio])
    }

    return NextResponse.json(folios)
  } catch (error) {
    console.error('Error fetching folios:', error)
    return NextResponse.json({ error: 'Failed to fetch folios' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getRequestSession(request)
    if (!session || !['RECEPTIONIST', 'MANAGER', 'SUPER_ADMIN'].includes((session.user as any).roleName as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()

    const booking = await prisma.booking.findUnique({
      where: { id }
    })
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const newFolio = await prisma.$transaction(async (tx: any) => {
      const folios = await tx.folio.findMany({ where: { bookingId: id } })
      const nextWindow = folios.length > 0 ? Math.max(...folios.map((f: any) => f.windowNumber)) + 1 : 1

      return await tx.folio.create({
        data: {
          bookingId: id,
          propertyId: booking.propertyId,
          windowNumber: nextWindow,
          type: body.companyId ? `ROUTING_${nextWindow}` : `GUEST_WIN_${nextWindow}`,
          companyId: body.companyId || null,
          status: 'OPEN'
        },
        include: {
          lineItems: true,
          routingRulesSource: true,
          routingRulesTarget: true
        }
      })
    })

    try {
      await realtime.trigger('admin', 'folio.created', {
        folioId: newFolio.id,
        bookingId: newFolio.bookingId
      })
    } catch (e) {
      console.error('Pusher error:', e)
    }

    return NextResponse.json(newFolio, { status: 201 })
  } catch (error) {
    console.error('Error creating folio:', error)
    return NextResponse.json({ error: 'Failed to create folio window' }, { status: 500 })
  }
}

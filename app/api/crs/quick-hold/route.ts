import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { checkRoomAvailability } from '@/lib/availability'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot create CRO holds` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      propertyId,
      checkIn,
      checkOut,
      guestName,
      guestEmail,
      guestPhone,
      roomTypeId,
      roomId,
      totalAmount,
      holdNotes
    } = body

    if (!propertyId || !checkIn || !checkOut || !guestName || !guestEmail) {
      return NextResponse.json(
        { error: 'propertyId, checkIn, checkOut, guestName, and guestEmail are required' },
        { status: 400 }
      )
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime()) || checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'Invalid checkIn or checkOut date parameters' },
        { status: 400 }
      )
    }

    // 1. Verify property
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    })
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // 2. Resolve or create guest User profile
    let guest = await prisma.user.findFirst({
      where: { email: guestEmail.toLowerCase().trim() }
    })

    if (!guest) {
      guest = await prisma.user.create({
        data: {
          name: guestName.trim(),
          email: guestEmail.toLowerCase().trim(),
          phone: guestPhone?.trim() || null,
          password: crypto.randomBytes(16).toString('hex'),
          propertyId: property.id
        }
      })
    }

    // 3. Find available room
    let targetRoom: { id: string; number: string; roomTypeId: string } | null = null

    if (roomId) {
      const isAvailable = await checkRoomAvailability(roomId, checkInDate, checkOutDate)
      if (!isAvailable) {
        return NextResponse.json(
          { error: 'Requested room is not available for the selected dates' },
          { status: 409 }
        )
      }
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: { id: true, number: true, roomTypeId: true }
      })
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 })
      }
      targetRoom = room
    } else {
      // Find an available room matching roomTypeId or any room in property
      const candidateRooms = await prisma.room.findMany({
        where: {
          propertyId,
          deletedAt: null,
          status: { notIn: ['MAINTENANCE', 'OUT_OF_ORDER'] },
          ...(roomTypeId ? { roomTypeId } : {})
        },
        orderBy: { number: 'asc' },
        select: { id: true, number: true, roomTypeId: true }
      })

      for (const candidate of candidateRooms) {
        const available = await checkRoomAvailability(candidate.id, checkInDate, checkOutDate)
        if (available) {
          targetRoom = candidate
          break
        }
      }

      if (!targetRoom) {
        return NextResponse.json(
          { error: 'No rooms available at target property for the selected dates' },
          { status: 409 }
        )
      }
    }

    const confirmationCode = `CRO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    // 4. Create reservation, room assignment, folio, and stay event in transaction
    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          confirmationCode,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          status: 'CONFIRMED',
          source: 'WALK_IN',
          totalAmount: totalAmount ? Number(totalAmount) : 350,
          propertyId: property.id,
          primaryGuestId: guest.id,
          guests: 1
        }
      })

      await tx.roomAssignment.create({
        data: {
          bookingId: newBooking.id,
          roomId: targetRoom!.id,
          startDate: checkInDate,
          endDate: checkOutDate,
          status: 'ACTIVE'
        }
      })

      await tx.folio.create({
        data: {
          bookingId: newBooking.id,
          propertyId: property.id,
          type: 'GUEST',
          status: 'OPEN'
        }
      })

      await tx.stayEvent.create({
        data: {
          bookingId: newBooking.id,
          type: 'CRO_AGENT_HOLD',
          notes: JSON.stringify({
            agentNotes: holdNotes || 'Direct Central Reservation Hold',
            allocatedRoom: targetRoom!.number,
            bookedBy: session?.user?.name || 'CRO Reservation Agent',
            timestamp: new Date().toISOString()
          }),
          actorId: session?.user?.id || null
        }
      })

      return newBooking
    })

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        confirmationCode: booking.confirmationCode,
        propertyName: property.name,
        propertyCode: property.code,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        allocatedRoom: targetRoom.number,
        totalAmount: booking.totalAmount,
        guestName: guest.name,
        guestEmail: guest.email
      }
    })
  } catch (error: any) {
    console.error('Error in CRO quick hold:', error)
    return NextResponse.json(
      { error: 'Failed to create CRO reservation hold', message: error?.message || 'Internal error' },
      { status: 500 }
    )
  }
}

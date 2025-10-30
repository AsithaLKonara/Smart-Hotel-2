import { NextRequest, NextResponse } from 'next/server'
import { checkRoomAvailability, getAvailableRooms } from '@/lib/availability'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    const roomId = searchParams.get('roomId')
    const capacity = searchParams.get('capacity')

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Check-in and check-out dates are required' },
        { status: 400 }
      )
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    // Validate dates
    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      )
    }

    if (checkInDate < new Date()) {
      return NextResponse.json(
        { error: 'Check-in date cannot be in the past' },
        { status: 400 }
      )
    }

    // Check specific room availability
    if (roomId) {
      const isAvailable = await checkRoomAvailability(
        roomId,
        checkInDate,
        checkOutDate
      )

      return NextResponse.json({
        roomId,
        available: isAvailable,
        checkIn,
        checkOut
      })
    }

    // Get all available rooms
    const availableRooms = await getAvailableRooms(
      checkInDate,
      checkOutDate,
      capacity ? parseInt(capacity) : undefined
    )

    return NextResponse.json({
      checkIn,
      checkOut,
      capacity: capacity || null,
      availableRooms,
      totalAvailable: availableRooms.length
    })
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { roomId, checkIn, checkOut, excludeBookingId } = await request.json()

    if (!roomId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Room ID, check-in, and check-out dates are required' },
        { status: 400 }
      )
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    const isAvailable = await checkRoomAvailability(
      roomId,
      checkInDate,
      checkOutDate,
      excludeBookingId
    )

    return NextResponse.json({
      roomId,
      available: isAvailable,
      checkIn,
      checkOut
    })
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}










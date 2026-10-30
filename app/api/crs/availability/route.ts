import { NextRequest, NextResponse } from 'next/server'
import { searchClusterAvailability } from '@/lib/crs/cluster-availability'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    const targetPropertyId = searchParams.get('targetPropertyId') || undefined
    const clusterCity = searchParams.get('clusterCity') || undefined
    const capacity = searchParams.get('capacity') ? parseInt(searchParams.get('capacity')!) : undefined
    const maxDistanceKm = searchParams.get('maxDistanceKm') ? parseFloat(searchParams.get('maxDistanceKm')!) : undefined

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'checkIn and checkOut date parameters are required' },
        { status: 400 }
      )
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid checkIn or checkOut date format' },
        { status: 400 }
      )
    }

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'checkOut date must be strictly after checkIn date' },
        { status: 400 }
      )
    }

    const result = await searchClusterAvailability({
      checkIn: checkInDate,
      checkOut: checkOutDate,
      targetPropertyId,
      clusterCity,
      capacity,
      maxDistanceKm
    })

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    console.error('Error in CRS cluster availability search:', error)
    return NextResponse.json(
      { error: 'Failed to search cluster availability', details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { checkIn, checkOut, targetPropertyId, clusterCity, capacity, maxDistanceKm } = body

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'checkIn and checkOut dates are required' },
        { status: 400 }
      )
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid checkIn or checkOut date format' },
        { status: 400 }
      )
    }

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { error: 'checkOut date must be strictly after checkIn date' },
        { status: 400 }
      )
    }

    const result = await searchClusterAvailability({
      checkIn: checkInDate,
      checkOut: checkOutDate,
      targetPropertyId,
      clusterCity,
      capacity: capacity ? Number(capacity) : undefined,
      maxDistanceKm: maxDistanceKm ? Number(maxDistanceKm) : undefined
    })

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    console.error('Error in CRS cluster availability search POST:', error)
    return NextResponse.json(
      { error: 'Failed to search cluster availability', details: error?.message },
      { status: 500 }
    )
  }
}

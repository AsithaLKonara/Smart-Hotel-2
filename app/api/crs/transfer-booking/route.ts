import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { transferBookingAcrossProperties } from '@/lib/crs/booking-transfer'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.roleName || (session?.user as any)?.role

    // Ensure user has administrative or front desk privileges
    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'RECEPTIONIST']
    if (session && !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: `Role [${userRole}] cannot transfer bookings` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { bookingId, targetPropertyId, targetRoomId, reason, rateAdjustmentPolicy } = body

    if (!bookingId || !targetPropertyId) {
      return NextResponse.json(
        { error: 'bookingId and targetPropertyId are required' },
        { status: 400 }
      )
    }

    const result = await transferBookingAcrossProperties({
      bookingId,
      targetPropertyId,
      targetRoomId,
      reason: reason || 'Cross-property guest relocation',
      rateAdjustmentPolicy: rateAdjustmentPolicy || 'HONOR_EXISTING_RATE',
      actorUserId: session?.user?.id || 'SYSTEM_AGENT'
    })

    return NextResponse.json({
      success: true,
      transfer: result
    })
  } catch (error: any) {
    console.error('Error in CRS transfer booking:', error)
    return NextResponse.json(
      { error: 'Failed to transfer booking', message: error?.message || 'Internal server error' },
      { status: 400 }
    )
  }
}

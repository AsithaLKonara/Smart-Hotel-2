import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const DigitalKeySchema = z.object({
  bookingId: z.string().uuid(),
  deviceId: z.string()
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = DigitalKeySchema.parse(body)

    const booking = await prisma.booking.findUnique({
      where: { id: validated.bookingId },
      include: {
        stay: {
          include: { room: true }
        }
      }
    })

    if (!booking || !booking.stay) {
      return NextResponse.json({ error: 'No active stay found for this booking' }, { status: 404 })
    }

    const stay = booking.stay
    
    // Validate that the guest is checked in or it's arrival day
    if (stay.status !== 'CHECKED_IN' && stay.status !== 'EXPECTED') {
      return NextResponse.json({ error: 'Cannot issue key. Guest is not checked in or expected.' }, { status: 400 })
    }

    // Mock API call to Assa Abloy, Salto, or Dormakaba to provision mobile key
    // e.g. await lockProvider.issueMobileKey(stay.room.number, validated.deviceId, stay.checkOutTime)
    
    const mockMobileKeyToken = `MKEY-${Buffer.from(stay.roomId + Date.now()).toString('base64')}`

    await prisma.auditLog.create({
      data: {
        action: 'DIGITAL_KEY_ISSUED',
        resource: 'ROOM',
        resourceId: stay.roomId,
        actor: 'SYSTEM',
        details: {
          deviceId: validated.deviceId,
          bookingId: validated.bookingId
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Mobile key provisioned successfully.',
      keyData: {
        token: mockMobileKeyToken,
        roomNumber: stay.room.number,
        expiresAt: stay.checkOutTime || booking.checkOut
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Digital Key error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

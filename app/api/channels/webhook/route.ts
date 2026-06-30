import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST(req: NextRequest) {
  let payload: any = {};
  try {
    try {
      payload = await req.json()
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }
    
    // Simulate OTA payload:
    // { otaRoomTypeId: 'BCOM_DLX', guestName: 'OTA Guest', guestEmail: 'guest@ota.com', checkIn: '2023-12-01', checkOut: '2023-12-03', totalAmount: 400.00 }
    
    const { otaRoomTypeId, guestName, guestEmail, checkIn, checkOut, totalAmount } = payload

    // 1. Resolve Mapping
    const mapping = await prisma.roomMapping.findFirst({
      where: { otaRoomTypeId, syncEnabled: true }
    })

    if (!mapping) {
      // Create an audit log for failed mapping
      await prisma.auditLog.create({
        data: {
          actor: 'CHANNEL_MANAGER',
          action: 'WEBHOOK_FAILED_MAPPING',
          resource: 'RoomMapping',
          details: { otaRoomTypeId, error: 'Unmapped room type received from OTA' }
        }
      })
      
      // Send to Dead-Letter Queue
      await prisma.webhookDLQ.create({
        data: {
          provider: 'OTA_WEBHOOK',
          payload: payload,
          error: 'Unmapped OTA Room Type: ' + otaRoomTypeId
        }
      })
      
      return NextResponse.json({ error: 'Unmapped OTA Room Type. Logged to DLQ.' }, { status: 400 })
    }

    // 2. Resolve or Create User (Guest)
    let user = await prisma.user.findUnique({ where: { email: guestEmail } })
    if (!user) {
      let role = await prisma.role.findFirst({ where: { name: 'GUEST' } })
      user = await prisma.user.create({
        data: {
          email: guestEmail,
          name: guestName,
          password: 'ota-placeholder-password', // Would use secure random in prod
          roleId: role?.id,
        }
      })
    }

    const property = await prisma.property.findFirst()

    // 3. Create Booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        propertyId: property?.id || '',
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests: 2,
        totalAmount: totalAmount,
        status: 'CONFIRMED',
        confirmationCode: `OTA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      }
    })

    // 4. Create Folio
    await prisma.folio.create({
      data: {
        bookingId: booking.id,
        balance: totalAmount,
        status: 'OPEN'
      }
    })

    // Log success
    await prisma.auditLog.create({
      data: {
        actor: 'CHANNEL_MANAGER',
        action: 'WEBHOOK_SUCCESS',
        resource: 'Booking',
        resourceId: booking.id,
        details: { source: 'OTA', originalPayload: payload }
      }
    })

    return NextResponse.json({ success: true, bookingId: booking.id, confirmationCode: booking.confirmationCode })

  } catch (error: any) {
    console.error('Channel Webhook Error:', error)
    
    // Attempt to write to DLQ even on massive systemic failure (e.g. Booking creation failed)
    try {
      if (typeof payload !== 'undefined') {
        await prisma.webhookDLQ.create({
          data: {
            provider: 'OTA_WEBHOOK',
            payload: payload,
            error: error.message || 'Systemic failure during webhook processing'
          }
        })
      }
    } catch(e) {
      console.error('Failed to write to DLQ', e)
    }
    
    return NextResponse.json({ error: 'Failed to process OTA webhook' }, { status: 500 })
  }
}

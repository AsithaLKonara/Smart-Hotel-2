import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function POST() {
  try {
    const property = await prisma.property.findFirst()
    if (!property) return NextResponse.json({ error: 'No property' }, { status: 400 })

    // Create Channel Config for Booking.com
    let bookingCom = await prisma.channelConfig.findFirst({ where: { provider: 'Booking.com' } })
    if (!bookingCom) {
      bookingCom = await prisma.channelConfig.create({
        data: {
          provider: 'Booking.com',
          apiKey: 'bcom-test-key-123',
          propertyId: property.id,
          isEnabled: true
        }
      })
    }

    // Get a room type to map
    const deluxeRoom = await prisma.roomType.findFirst({ where: { name: { contains: 'Deluxe' } } })
    if (deluxeRoom) {
      const existingMapping = await prisma.roomMapping.findFirst({
        where: { localRoomTypeId: deluxeRoom.id, otaRoomTypeId: 'BCOM_DLX' }
      })
      if (!existingMapping) {
        await prisma.roomMapping.create({
          data: {
            localRoomTypeId: deluxeRoom.id,
            otaRoomTypeId: 'BCOM_DLX',
            otaRatePlanId: 'BCOM_BAR',
            priceMarkupPercentage: 15.0, // 15% markup to cover commission
            syncEnabled: true
          }
        })
      }
    }

    return NextResponse.json({ success: true, message: 'Channels seeded successfully' })
  } catch (error: any) {
    console.error('Channel Seed Error:', error)
    return NextResponse.json({ error: 'Failed to seed channels' }, { status: 500 })
  }
}

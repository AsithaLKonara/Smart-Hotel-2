import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get('roomId')

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 })
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        stays: {
          where: { status: 'CHECKED_IN' },
          include: { booking: true }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // In a real application, you would generate a JWT or secure token that grants access
    // to the digital compendium (room service, hotel info, local guides) for the duration of the stay.
    
    const token = Buffer.from(`${roomId}-${Date.now()}`).toString('base64')
    
    // The hotel's base URL for the guest portal
    const guestPortalUrl = process.env.GUEST_PORTAL_URL || 'https://guest.smarthotel.local'
    const compendiumLink = `${guestPortalUrl}/compendium?token=${token}&room=${room.number}`

    // To actually generate a QR code image, you would use a library like 'qrcode'
    // e.g. const qrImage = await QRCode.toDataURL(compendiumLink)
    
    return NextResponse.json({
      success: true,
      data: {
        roomNumber: room.number,
        link: compendiumLink,
        // qrCodeBase64: qrImage
        message: 'QR Code URL generated successfully.'
      }
    })
  } catch (error) {
    console.error('QR Compendium error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

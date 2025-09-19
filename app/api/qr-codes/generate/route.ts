import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import QRCode from 'qrcode'
import { z } from 'zod'

const qrGenerateSchema = z.object({
  data: z.string().min(1, 'Data is required'),
  type: z.enum(['room', 'booking', 'wifi', 'contact', 'custom']).default('custom'),
  size: z.number().min(100).max(1000).default(256),
  format: z.enum(['png', 'svg', 'utf8']).default('png'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only allow managers and admins to generate QR codes
    if (!['SUPER_ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = qrGenerateSchema.parse(body)

    let qrData: string = validatedData.data

    // Format data based on type
    switch (validatedData.type) {
      case 'room':
        qrData = `SMARTHOTEL_ROOM:${validatedData.data}`
        break
      case 'booking':
        qrData = `SMARTHOTEL_BOOKING:${validatedData.data}`
        break
      case 'wifi':
        qrData = `WIFI:T:WPA;S:${validatedData.data};P:SmartHotel2024;;`
        break
      case 'contact':
        qrData = `BEGIN:VCARD\nVERSION:3.0\nFN:${validatedData.data}\nORG:SmartHotel\nEND:VCARD`
        break
      default:
        qrData = validatedData.data
    }

    let qrCodeResult: string

    // Generate QR code based on format
    switch (validatedData.format) {
      case 'png':
        qrCodeResult = await QRCode.toDataURL(qrData, {
          width: validatedData.size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        break
      case 'svg':
        qrCodeResult = await QRCode.toString(qrData, {
          type: 'svg',
          width: validatedData.size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        break
      case 'utf8':
        qrCodeResult = await QRCode.toString(qrData, {
          type: 'utf8',
          width: validatedData.size,
          margin: 2
        })
        break
      default:
        qrCodeResult = await QRCode.toDataURL(qrData, {
          width: validatedData.size,
          margin: 2
        })
    }

    return NextResponse.json({
      success: true,
      qrCode: qrCodeResult,
      data: qrData,
      type: validatedData.type,
      format: validatedData.format,
      size: validatedData.size,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}

// GET endpoint for quick QR code generation with query parameters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const data = searchParams.get('data')
    const type = searchParams.get('type') || 'custom'
    const size = parseInt(searchParams.get('size') || '256')

    if (!data) {
      return NextResponse.json(
        { error: 'Data parameter is required' },
        { status: 400 }
      )
    }

    let qrData: string = data

    // Format data based on type
    switch (type) {
      case 'room':
        qrData = `SMARTHOTEL_ROOM:${data}`
        break
      case 'booking':
        qrData = `SMARTHOTEL_BOOKING:${data}`
        break
      case 'wifi':
        qrData = `WIFI:T:WPA;S:${data};P:SmartHotel2024;;`
        break
      case 'contact':
        qrData = `BEGIN:VCARD\nVERSION:3.0\nFN:${data}\nORG:SmartHotel\nEND:VCARD`
        break
      default:
        qrData = data
    }

    const qrCodeResult = await QRCode.toDataURL(qrData, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return NextResponse.json({
      success: true,
      qrCode: qrCodeResult,
      data: qrData,
      type: type,
      format: 'png',
      size: size,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}

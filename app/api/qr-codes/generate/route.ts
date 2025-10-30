import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, type = 'room-service', roomNumber, guestId } = body

    if (!data && (!roomNumber || !guestId)) {
      return NextResponse.json(
        { error: 'Missing required parameters. Provide either data or roomNumber + guestId' },
        { status: 400 }
      )
    }

    // Generate the URL or data for QR code
    let qrData = data
    if (!qrData && roomNumber && guestId) {
      // Generate room service ordering URL
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      qrData = `${baseUrl}/order?room=${encodeURIComponent(roomNumber)}&guest=${encodeURIComponent(guestId)}&type=${type}`
    }

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // Also generate as SVG for better quality
    const qrCodeSvg = await QRCode.toString(qrData, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300
    })

    return NextResponse.json({
      success: true,
      qrCode: {
        dataUrl: qrCodeDataUrl,
        svg: qrCodeSvg,
        url: qrData,
        type,
        roomNumber,
        guestId
      }
    })
  } catch (error) {
    console.error('QR Code Generation Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const data = searchParams.get('data')
    const roomNumber = searchParams.get('room')
    const guestId = searchParams.get('guest')
    const type = searchParams.get('type') || 'room-service'

    if (!data && (!roomNumber || !guestId)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    let qrData = data
    if (!qrData && roomNumber && guestId) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      qrData = `${baseUrl}/order?room=${encodeURIComponent(roomNumber)}&guest=${encodeURIComponent(guestId)}&type=${type}`
    }

    if (!qrData) {
      return NextResponse.json({ error: 'No QR data provided' }, { status: 400 })
    }

    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300
    })

    return new NextResponse(qrCodeBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('QR Code Generation Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}

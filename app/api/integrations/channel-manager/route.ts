import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Simplistic mock of an HTNG / OTA XML schema receiver for Channel Managers (e.g. Siteminder, Cloudbeds)
export async function POST(req: Request) {
  try {
    // In production, HTNG uses XML. We are parsing raw text and mocking a JSON parser for simplicity in this demo.
    const rawXml = await req.text()
    
    // Validate authentication (usually basic auth or API key over mutual TLS)
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized OTA Request' }, { status: 401 })
    }

    // Check if it's an OTA_HotelResNotifRQ (Reservation Notification)
    if (rawXml.includes('OTA_HotelResNotifRQ')) {
      // Mock parsing out of the XML
      const mockBookingId = `OTA-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      
      await prisma.auditLog.create({
        data: {
          action: 'OTA_RESERVATION_RECEIVED',
          resource: 'SYSTEM',
          actor: 'CHANNEL_MANAGER',
          details: {
            xmlLength: rawXml.length,
            otaBookingId: mockBookingId
          }
        }
      })

      // Send standard OTA_HotelResNotifRS success response
      const successXml = `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelResNotifRS xmlns="http://www.opentravel.org/OTA/2003/05" Version="1.0">
    <Success/>
    <HotelReservations>
        <HotelReservation>
            <ResGlobalInfo>
                <HotelReservationIDs>
                    <HotelReservationID ResID_Type="14" ResID_Value="${mockBookingId}"/>
                </HotelReservationIDs>
            </ResGlobalInfo>
        </HotelReservation>
    </HotelReservations>
</OTA_HotelResNotifRS>`

      return new NextResponse(successXml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml'
        }
      })
    }

    // Check if it's an OTA_HotelAvailNotifRQ (Availability Update)
    if (rawXml.includes('OTA_HotelAvailNotifRQ')) {
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><OTA_HotelAvailNotifRS Version="1.0"><Success/></OTA_HotelAvailNotifRS>`,
        { status: 200, headers: { 'Content-Type': 'application/xml' } }
      )
    }

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Errors><Error>Unknown Message Type</Error></Errors>`,
      { status: 400, headers: { 'Content-Type': 'application/xml' } }
    )

  } catch (error) {
    console.error('Channel Manager integration error:', error)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Errors><Error>Internal Server Error</Error></Errors>`,
      { status: 500, headers: { 'Content-Type': 'application/xml' } }
    )
  }
}

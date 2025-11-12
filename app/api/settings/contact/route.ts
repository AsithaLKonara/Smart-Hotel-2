import { NextResponse } from 'next/server'
import { getHotelContactInfo } from '@/lib/settings'

export async function GET() {
  try {
    const contact = await getHotelContactInfo()
    return NextResponse.json(contact)
  } catch (error) {
    console.error('Failed to load contact info:', error)
    // Return default values instead of error to prevent frontend failures
    return NextResponse.json({
      name: 'SmartHotel Grand Palace',
      tagline: 'Luxury 5-Star Accommodation',
      description: 'Experience unparalleled luxury where timeless elegance meets modern hospitality.',
      email: 'info@smarthotel.com',
      phone: '+1 (800) 555-HOTEL',
      address: '123 Grand Boulevard, City Center, Metropolitan Area, ST 10001',
      checkIn: '15:00',
      checkOut: '11:00',
      coordinates: {
        lat: 40.7589,
        lng: -73.9851,
      },
    })
  }
}


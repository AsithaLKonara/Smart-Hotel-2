import { NextResponse } from 'next/server'
import { getHotelContactInfo } from '@/lib/settings'
import { isDatabaseConfigured } from '@/lib/db-helpers'

const defaultContactInfo = {
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
}

export async function GET() {
  // Always return valid JSON, even if database is not configured
  if (!isDatabaseConfigured()) {
    return NextResponse.json(defaultContactInfo, { status: 200 })
  }

  try {
    const contact = await getHotelContactInfo()
    // Ensure we always return valid data
    const contactData = {
      name: contact?.name || defaultContactInfo.name,
      tagline: contact?.tagline || defaultContactInfo.tagline,
      description: contact?.description || defaultContactInfo.description,
      email: contact?.email || defaultContactInfo.email,
      phone: contact?.phone || defaultContactInfo.phone,
      address: contact?.address || defaultContactInfo.address,
      checkIn: contact?.checkIn || defaultContactInfo.checkIn,
      checkOut: contact?.checkOut || defaultContactInfo.checkOut,
      coordinates: contact?.coordinates || defaultContactInfo.coordinates,
    }
    return NextResponse.json(contactData, { status: 200 })
  } catch (error) {
    console.error('Failed to load contact info:', error)
    // Return default values instead of error to prevent frontend failures
    return NextResponse.json(defaultContactInfo, { status: 200 })
  }
}


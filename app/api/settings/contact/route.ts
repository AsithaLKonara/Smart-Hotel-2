import { NextResponse } from 'next/server'
import { getHotelContactInfo } from '@/lib/settings'

export async function GET() {
  try {
    const contact = await getHotelContactInfo()
    return NextResponse.json(contact)
  } catch (error) {
    console.error('Failed to load contact info:', error)
    return NextResponse.json(
      {
        error: 'Unable to load contact information',
      },
      { status: 500 }
    )
  }
}


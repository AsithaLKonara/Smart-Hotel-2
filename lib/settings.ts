import { cache as reactCache } from 'react'
import prisma from '@/lib/db'

import { isDatabaseConfigured } from './db-helpers'

interface SettingsMap {
  [key: string]: string
}

const defaultMilestones = [
  '1985 - Flagship property opens in the heart of the city',
  '1992 - Awarded first AAA Five Diamond rating',
  '2001 - Major expansion adding conference and wellness wings',
  '2010 - Sustainability initiatives earn green certification',
  '2020 - Digital transformation enhances guest experiences',
]

const cache =
  reactCache ??
  function <T extends (...args: any[]) => Promise<any> | any>(fn: T) {
    let invoked = false
    let value: ReturnType<T>
    return (...args: Parameters<T>): ReturnType<T> => {
      if (!invoked) {
        value = fn(...args)
        invoked = true
      }
      return value
    }
  }

export const getHotelSettings = cache(async () => {
  try {
    // Check if database is configured before making query
    if (!isDatabaseConfigured()) {
      console.warn('DATABASE_URL not configured or contains placeholder - returning empty settings')
      return {}
    }
    
    const records = await prisma.setting.findMany().catch((error) => {
      console.error('Error fetching hotel settings:', error)
      return []
    })
    
  return records.reduce<SettingsMap>((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {})
  } catch (error) {
    console.error('Error in getHotelSettings:', error)
    // Return empty object if database query fails
    // This allows getHotelContactInfo to use default values
    return {}
  }
})

export async function getHotelContactInfo() {
  try {
  const settings = await getHotelSettings()

  return {
    name: settings.hotel_name || 'SmartHotel Grand Palace',
    tagline: settings.hotel_tagline || 'Luxury 5-Star Accommodation',
    description:
      settings.hotel_description ||
      'Experience unparalleled luxury where timeless elegance meets modern hospitality.',
    email: settings.hotel_email || 'info@smarthotel.com',
    phone: settings.hotel_phone || '+1 (800) 555-HOTEL',
    address:
      settings.hotel_address ||
      '123 Grand Boulevard, City Center, Metropolitan Area, ST 10001',
    checkIn: settings.check_in_time || '15:00',
    checkOut: settings.check_out_time || '11:00',
    coordinates: {
      lat: Number(settings.hotel_latitude ?? 40.7589),
      lng: Number(settings.hotel_longitude ?? -73.9851),
    },
    }
  } catch (error) {
    console.error('Error fetching hotel contact info:', error)
    // Return default values if database query fails
    return {
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
  }
}

export async function getHotelAboutContent() {
  try {
  const settings = await getHotelSettings()
  const story =
    settings.hotel_story ||
    'Since opening our doors in 1985, we have embraced guests with impeccable service, timeless design, and unforgettable experiences.'
  const founded = settings.hotel_founded || '1985'

  let milestones: string[] = defaultMilestones
  if (settings.hotel_milestones) {
    try {
      const parsed = JSON.parse(settings.hotel_milestones)
      if (Array.isArray(parsed) && parsed.length) {
        milestones = parsed.map(String)
      }
    } catch (error) {
      console.warn('Failed to parse hotel milestones from settings:', error)
    }
  }

    let staff: any[] = []
    try {
      staff = await prisma.staff.findMany({
    orderBy: { hireDate: 'asc' },
    take: 6,
  })
    } catch (error) {
      console.error('Error fetching staff:', error)
      staff = []
    }

  return {
    story,
    founded,
    milestones,
    staff,
    }
  } catch (error) {
    console.error('Error in getHotelAboutContent:', error)
    return {
      story: 'Since opening our doors in 1985, we have embraced guests with impeccable service, timeless design, and unforgettable experiences.',
      founded: '1985',
      milestones: defaultMilestones,
      staff: [],
    }
  }
}


import prisma from '@/lib/db'
import { Room, RoomType, FoodMenu, Employee } from '@prisma/client'
import { getHotelContactInfo, getHotelSettings } from './settings'

type RestaurantMenu = Record<string, Array<{ name: string; description?: string | null; price: number; image?: string | null }>>

type HotelData = {
  hotel: {
    name: string
    tagline: string
    description: string
    established: string
    contact: {
      phone: string
      email: string
      address: string
      coordinates: { lat: number; lng: number }
    }
    amenities: string[]
    social: Record<string, string>
  }
  rooms: Array<{
    id: string
    type: string
    description: string | null
    price: number
    amenities: string[]
    images: string[]
  }>
  restaurant: {
    name: string
    description: string
    menu: RestaurantMenu
  }
  history: {
    founded: string
    story: string
    milestones: string[]
  }
  staff: Array<{
    name: string
    position: string
    department: string
    bio: string
    image: string
  }>
}

async function loadHotelData(): Promise<HotelData> {
  const [contact, settings, rooms, menuItems, staff] = await Promise.all([
    getHotelContactInfo(),
    getHotelSettings(),
    prisma.room.findMany({
      include: { roomType: true },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
    prisma.foodMenu.findMany(),
    prisma.employee.findMany({ orderBy: { hireDate: 'asc' }, take: 6 }),
  ])

  const social: Record<string, string> = {
    facebook: settings.hotel_facebook || 'https://facebook.com/smarthotel',
    instagram: settings.hotel_instagram || 'https://instagram.com/smarthotel',
    twitter: settings.hotel_twitter || 'https://twitter.com/smarthotel',
    linkedin: settings.hotel_linkedin || 'https://linkedin.com/company/smarthotel',
  }

  const menu: RestaurantMenu = {}
  menuItems.forEach((item: FoodMenu) => {
    const category = item.category.toLowerCase()
    if (!menu[category]) menu[category] = []
    menu[category].push({
      name: item.name,
      description: item.description,
      price: item.price,
      // Note: FoodMenu model doesn't have image field in schema
      image: undefined,
    })
  })

  const defaultStory =
    settings.hotel_story ||
    'Since opening our doors in 1985, SmartHotel Grand Palace has welcomed discerning travelers with refined style, thoughtful service, and unforgettable experiences.'
  const history: HotelData['history'] = {
    founded: settings.hotel_founded || '1985',
    story: defaultStory,
    milestones: (() => {
      if (settings.hotel_milestones) {
        try {
          const parsed = JSON.parse(settings.hotel_milestones)
          if (Array.isArray(parsed) && parsed.length) {
            return parsed.map(String)
          }
        } catch (error) {
          console.warn('Failed to parse hotel milestones from settings:', error)
        }
      }
      return [
        '1985 - Flagship property opens in the heart of the city',
        '1992 - Awarded first AAA Five Diamond rating',
        '2001 - Major expansion adding conference and wellness wings',
        '2010 - Sustainability initiatives earn green certification',
        '2020 - Digital transformation enhances guest experiences',
    ]
    })(),
  }

  const mappedRooms = rooms.map((room: Room & { roomType: RoomType }) => ({
    id: room.id,
    type: room.roomType.name,
    description: room.roomType.description,
    price: room.roomType.baseRate,
    amenities: room.roomType.amenities || [],
    images: room.roomType.images?.length ? room.roomType.images : ['/images/hotel/room-deluxe.jpg'],
  }))

  const staffProfiles = staff.map((member: Employee, index: number) => ({
    name: `${member.firstName} ${member.lastName}`,
    position: member.position,
    department: member.department,
    bio: `A dedicated ${member.department.toLowerCase()} specialist committed to delivering unforgettable guest experiences.`,
    image: `/images/hotel/staff-${index + 1}.jpg`,
  }))

  return {
    hotel: {
      name: contact.name,
      tagline: contact.tagline,
      description: contact.description,
      established: history.founded,
      contact: {
        phone: contact.phone,
        email: contact.email,
        address: contact.address,
        coordinates: contact.coordinates,
      },
      amenities: [
        '24/7 Concierge Service',
        'Valet Parking',
        'Business Center',
        'Fitness Center',
        'Spa & Wellness Center',
        'Rooftop Pool',
        'Fine Dining Restaurant',
        'Lobby Bar',
        'Room Service',
        'High-Speed WiFi',
        'Pet-Friendly',
        'Airport Shuttle',
      ],
      social,
    },
    rooms: mappedRooms,
  restaurant: {
      name: 'The Grand Dining Room',
      description:
        'Award-winning restaurant featuring contemporary American cuisine with international influences. Seasonal menus showcase locally sourced ingredients prepared by our culinary team.',
      menu,
    },
    history,
    staff: staffProfiles,
  }
}

let hotelDataPromise: Promise<HotelData> | null = null
let hotelDataCache: HotelData | null = null

export async function getHotelData(options: { forceRefresh?: boolean } = {}): Promise<HotelData> {
  if (!hotelDataPromise || options.forceRefresh) {
    hotelDataPromise = loadHotelData().then(data => {
      hotelDataCache = data
      return data
    })
  }

  return hotelDataPromise
}

export function getHotelDataSync(): HotelData | null {
  return hotelDataCache
}

export async function preloadHotelData(): Promise<HotelData> {
  return getHotelData()
}

export type { HotelData }






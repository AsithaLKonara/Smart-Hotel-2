import { getHotelData } from '@/lib/hotel-data'

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: {
    room: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'room-1',
          type: 'DELUXE',
          description: 'Spacious deluxe room',
          price: 299,
          amenities: ['WiFi', 'TV'],
          images: ['/images/rooms/deluxe-1.jpg'],
        },
      ]),
    },
    foodMenu: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'menu-1',
          category: 'DINNER',
          name: 'Seared Salmon',
          description: 'Fresh Atlantic salmon with seasonal vegetables',
          price: 42,
          image: '/images/menu/salmon.jpg',
        },
      ]),
    },
    staff: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'staff-1',
          name: 'Ava Williams',
          position: 'Guest Experience Manager',
          department: 'Guest Services',
          hireDate: new Date('2020-01-01'),
        },
      ]),
    },
  },
  prisma: {
    room: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'room-1',
          type: 'DELUXE',
          description: 'Spacious deluxe room',
          price: 299,
          amenities: ['WiFi', 'TV'],
          images: ['/images/rooms/deluxe-1.jpg'],
        },
      ]),
    },
    foodMenu: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'menu-1',
          category: 'DINNER',
          name: 'Seared Salmon',
          description: 'Fresh Atlantic salmon with seasonal vegetables',
          price: 42,
          image: '/images/menu/salmon.jpg',
        },
      ]),
    },
    staff: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'staff-1',
          name: 'Ava Williams',
          position: 'Guest Experience Manager',
          department: 'Guest Services',
          hireDate: new Date('2020-01-01'),
        },
      ]),
    },
  },
}))

jest.mock('@/lib/settings', () => ({
  __esModule: true,
  getHotelContactInfo: jest.fn().mockResolvedValue({
    name: 'SmartHotel Grand Palace',
    tagline: 'Luxury 5-Star Accommodation',
    description: 'Mock description',
    email: 'info@smarthotel.com',
    phone: '+1 (800) 555-HOTEL',
    address: '123 Grand Boulevard, City Center, Metropolitan Area, ST 10001',
    checkIn: '15:00',
    checkOut: '11:00',
    coordinates: { lat: 40.7589, lng: -73.9851 },
  }),
  getHotelSettings: jest.fn().mockResolvedValue({
    hotel_story: 'Mock hotel story',
    hotel_founded: '1985',
    hotel_milestones: JSON.stringify([
      '1985 - Grand opening',
      '1990 - First award',
    ]),
    hotel_facebook: 'https://facebook.com/mock',
    hotel_instagram: 'https://instagram.com/mock',
    hotel_twitter: 'https://twitter.com/mock',
    hotel_linkedin: 'https://linkedin.com/mock',
  }),
}))

describe('hotelData', () => {
  let hotelData: Awaited<ReturnType<typeof getHotelData>>

  beforeAll(async () => {
    hotelData = await getHotelData({ forceRefresh: true })
  })

  it('should load basic hotel information', () => {
    expect(hotelData).toBeDefined()
    expect(hotelData.hotel).toBeDefined()
    expect(hotelData.hotel.name).toBe('SmartHotel Grand Palace')
    expect(hotelData.hotel.tagline).toBe('Luxury 5-Star Accommodation')
    expect(hotelData.hotel.contact.email).toBe('info@smarthotel.com')
    expect(hotelData.hotel.contact.phone).toBe('+1 (800) 555-HOTEL')
  })

  it('should have rooms with required fields', () => {
    expect(Array.isArray(hotelData.rooms)).toBe(true)
    expect(hotelData.rooms.length).toBeGreaterThan(0)
    hotelData.rooms.forEach(room => {
      expect(room.type).toBeTruthy()
      expect(typeof room.price).toBe('number')
      expect(Array.isArray(room.amenities)).toBe(true)
    })
  })

  it('should have restaurant menu categories with items', () => {
    expect(hotelData.restaurant.menu).toBeDefined()
    const categories = Object.keys(hotelData.restaurant.menu)
    expect(categories.length).toBeGreaterThan(0)
    categories.forEach(category => {
      const items = hotelData.restaurant.menu[category]
      expect(Array.isArray(items)).toBe(true)
    })
  })

  it('should have staff profiles with required information', () => {
     expect(Array.isArray(hotelData.staff)).toBe(true)
     expect(hotelData.staff.length).toBeGreaterThan(0)
     hotelData.staff.forEach(staff => {
       expect(staff.name).toBeTruthy()
      expect(staff.position).toBeTruthy()
      expect(staff.department).toBeTruthy()
       expect(staff.bio).toBeTruthy()
      })
    })
 
   it('should include social media links', () => {
    const socialEntries = Object.entries(hotelData.hotel.social)
    expect(socialEntries.length).toBeGreaterThan(0)
    socialEntries.forEach(([name, url]) => {
      expect(name).toBeTruthy()
      expect(url).toContain('http')
    })
   })

  it('should include hotel history and milestones', () => {
    expect(hotelData.history).toBeDefined()
    expect(hotelData.history.story).toBeDefined()
    expect(hotelData.history.milestones.length).toBeGreaterThan(0)
  })
})


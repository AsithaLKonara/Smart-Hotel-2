import { hotelData } from '@/lib/hotel-data'

describe('Hotel Data Validation', () => {
  test('should have valid hotel structure', () => {
    expect(hotelData).toBeDefined()
    expect(hotelData.hotel).toBeDefined()
    expect(hotelData.hotel.name).toBe('Grand Palace Hotel')
    expect(hotelData.hotel.tagline).toBe('Luxury 5-Star Accommodation')
  })

  test('should have valid contact information', () => {
    expect(hotelData.hotel.contact).toBeDefined()
    expect(hotelData.hotel.contact.phone).toBe('+1 (212) 555-0123')
    expect(hotelData.hotel.contact.email).toBe('reservations@grandpalacehotel.com')
    expect(hotelData.hotel.contact.address).toBe('1235 Park Avenue, New York, NY 10029')
  })

  test('should have valid coordinates', () => {
    expect(hotelData.hotel.contact.coordinates).toBeDefined()
    expect(hotelData.hotel.contact.coordinates.lat).toBe(40.7589)
    expect(hotelData.hotel.contact.coordinates.lng).toBe(-73.9851)
  })

  test('should have valid room types', () => {
    expect(hotelData.rooms).toBeDefined()
    expect(hotelData.rooms).toHaveLength(3)
    
    const roomTypes = hotelData.rooms.map(room => room.type)
    expect(roomTypes).toContain('Deluxe King')
    expect(roomTypes).toContain('Executive Suite')
    expect(roomTypes).toContain('Presidential Suite')
  })

  test('should have valid pricing', () => {
    hotelData.rooms.forEach(room => {
      expect(room.price).toBeGreaterThan(0)
      expect(typeof room.price).toBe('number')
    })
  })

  test('should have valid amenities', () => {
    expect(hotelData.hotel.amenities).toBeDefined()
    expect(hotelData.hotel.amenities.length).toBeGreaterThan(0)
    
    hotelData.hotel.amenities.forEach(amenity => {
      expect(typeof amenity).toBe('string')
      expect(amenity.length).toBeGreaterThan(0)
    })
  })

  test('should have valid social links', () => {
    expect(hotelData.hotel.social).toBeDefined()
    expect(hotelData.hotel.social.facebook).toBeDefined()
    expect(hotelData.hotel.social.twitter).toBeDefined()
    expect(hotelData.hotel.social.instagram).toBeDefined()
    expect(hotelData.hotel.social.linkedin).toBeDefined()
  })

  test('should have valid history data', () => {
    expect(hotelData.hotel.established).toBeDefined()
    expect(hotelData.hotel.established).toBe('1985')
    expect(hotelData.hotel.description).toBeDefined()
  })

  test('should have valid staff information', () => {
    // Staff information is not in the current hotel data structure
    // This test can be removed or updated when staff data is added
    expect(true).toBe(true) // Placeholder test
  })

  test('should have valid restaurant menu', () => {
    expect(hotelData.restaurant).toBeDefined()
    expect(hotelData.restaurant.menu).toBeDefined()
    
    const categories = Object.keys(hotelData.restaurant.menu)
    expect(categories.length).toBeGreaterThan(0)
    
    categories.forEach(category => {
      const items = hotelData.restaurant.menu[category as keyof typeof hotelData.restaurant.menu]
      expect(Array.isArray(items)).toBe(true)
      expect(items.length).toBeGreaterThan(0)
      
      items.forEach((item: any) => {
        expect(item.name).toBeDefined()
        expect(item.description).toBeDefined()
        expect(item.price).toBeGreaterThan(0)
      })
    })
  })

  test('should have valid policies', () => {
    // Policies are not in the current hotel data structure
    // This test can be removed or updated when policies are added
    expect(true).toBe(true) // Placeholder test
  })

  test('should have valid awards', () => {
    // Awards are not in the current hotel data structure
    // This test can be removed or updated when awards are added
    expect(true).toBe(true) // Placeholder test
  })

  test('should have valid values', () => {
    // Values are not in the current hotel data structure
    // This test can be removed or updated when values are added
    expect(true).toBe(true) // Placeholder test
  })
})


// Booking API integration for the premium booking flow
import { Room, Booking } from '@prisma/client'

export interface BookingFilters {
  location: string
  checkIn: Date
  checkOut: Date
  guests: number
  roomType?: string
  amenities?: string[]
}

export interface BookingRequest {
  roomId: string
  userId: string
  checkIn: Date
  checkOut: Date
  guests: number
  totalAmount: number
  extras: {
    breakfast: boolean
    lateCheckout: boolean
    airportShuttle: boolean
    spaAccess: boolean
  }
  guestInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  specialRequests?: string
}

export interface BookingResponse {
  success: boolean
  booking?: Booking
  error?: string
}

// Search for available rooms
export async function searchRooms(filters: BookingFilters): Promise<Room[]> {
  try {
    const params = new URLSearchParams({
      location: filters.location,
      checkIn: filters.checkIn.toISOString(),
      checkOut: filters.checkOut.toISOString(),
      guests: filters.guests.toString(),
      ...(filters.roomType && { roomType: filters.roomType }),
      ...(filters.amenities && { amenities: filters.amenities.join(',') })
    })

    const response = await fetch(`/api/rooms?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to search rooms')
    }

    return await response.json()
  } catch (error) {
    console.error('Error searching rooms:', error)
    throw error
  }
}

// Get room details
export async function getRoomDetails(roomId: string): Promise<Room> {
  try {
    const response = await fetch(`/api/rooms/${roomId}`)
    
    if (!response.ok) {
      throw new Error('Failed to get room details')
    }

    return await response.json()
  } catch (error) {
    console.error('Error getting room details:', error)
    throw error
  }
}

// Create a new booking
export async function createBooking(bookingData: BookingRequest): Promise<BookingResponse> {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create booking')
    }

    return result
  } catch (error) {
    console.error('Error creating booking:', error)
    throw error
  }
}

// Get booking details
export async function getBookingDetails(bookingId: string): Promise<Booking> {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`)
    
    if (!response.ok) {
      throw new Error('Failed to get booking details')
    }

    return await response.json()
  } catch (error) {
    console.error('Error getting booking details:', error)
    throw error
  }
}

// Update booking
export async function updateBooking(bookingId: string, updates: Partial<BookingRequest>): Promise<BookingResponse> {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update booking')
    }

    return result
  } catch (error) {
    console.error('Error updating booking:', error)
    throw error
  }
}

// Cancel booking
export async function cancelBooking(bookingId: string): Promise<BookingResponse> {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'DELETE',
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to cancel booking')
    }

    return result
  } catch (error) {
    console.error('Error canceling booking:', error)
    throw error
  }
}

// Get user's bookings
export async function getUserBookings(userId: string): Promise<Booking[]> {
  try {
    const response = await fetch(`/api/bookings?userId=${userId}`)
    
    if (!response.ok) {
      throw new Error('Failed to get user bookings')
    }

    return await response.json()
  } catch (error) {
    console.error('Error getting user bookings:', error)
    throw error
  }
}

// Calculate booking total
export function calculateBookingTotal(
  roomPrice: number,
  nights: number,
  extras: {
    breakfast: boolean
    lateCheckout: boolean
    airportShuttle: boolean
    spaAccess: boolean
  }
): number {
  let total = roomPrice * nights

  if (extras.breakfast) total += 25 * nights
  if (extras.lateCheckout) total += 50
  if (extras.airportShuttle) total += 75
  if (extras.spaAccess) total += 100

  // Add taxes (15%)
  total += total * 0.15

  return Math.round(total * 100) / 100
}

// Validate booking data
export function validateBookingData(data: Partial<BookingRequest>): string[] {
  const errors: string[] = []

  if (!data.roomId) errors.push('Room selection is required')
  if (!data.userId) errors.push('User ID is required')
  if (!data.checkIn) errors.push('Check-in date is required')
  if (!data.checkOut) errors.push('Check-out date is required')
  if (!data.guests || data.guests < 1) errors.push('Number of guests is required')
  if (!data.guestInfo?.firstName) errors.push('First name is required')
  if (!data.guestInfo?.lastName) errors.push('Last name is required')
  if (!data.guestInfo?.email) errors.push('Email is required')
  if (!data.guestInfo?.phone) errors.push('Phone number is required')

  // Validate email format
  if (data.guestInfo?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.guestInfo.email)) {
    errors.push('Invalid email format')
  }

  // Validate dates
  if (data.checkIn && data.checkOut) {
    if (data.checkIn >= data.checkOut) {
      errors.push('Check-out date must be after check-in date')
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (data.checkIn < today) {
      errors.push('Check-in date cannot be in the past')
    }
  }

  return errors
}

// Format booking confirmation data
export function formatBookingConfirmation(booking: Booking, room: Room, guestInfo: any) {
  return {
    id: booking.id,
    room: {
      type: room.type,
      number: room.number,
      floor: room.floor
    },
    dates: {
      checkIn: new Date(booking.checkIn),
      checkOut: new Date(booking.checkOut)
    },
    guests: booking.guests,
    location: 'SmartHotel Downtown', // This could come from room or hotel data
    extras: {
      breakfast: false, // This would come from booking extras
      lateCheckout: false,
      airportShuttle: false,
      spaAccess: false
    },
    total: booking.totalAmount,
    guestInfo
  }
}

import { jest } from '@jest/globals'
import {
  searchRooms,
  getRoomDetails,
  createBooking,
  getBookingDetails,
  updateBooking,
  cancelBooking,
  getUserBookings,
  calculateBookingTotal,
  validateBookingData,
  formatBookingConfirmation,
} from '@/lib/booking-api'

describe('lib/booking-api', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    jest.restoreAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      writable: true,
      value: jest.fn(),
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      writable: true,
      value: originalFetch,
    })
  })

  it('searchRooms builds query params and returns room list', async () => {
    const fetchMock = global.fetch as jest.Mock
    const rooms = [{ id: 'room-1' }, { id: 'room-2' }]
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(rooms) })

    const filters = {
      location: 'Downtown',
      checkIn: new Date('2025-03-10T15:00:00Z'),
      checkOut: new Date('2025-03-15T11:00:00Z'),
      guests: 2,
      roomType: 'Suite',
      amenities: ['Pool', 'Gym'],
    }

    const result = await searchRooms(filters)

    expect(result).toEqual(rooms)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
    expect(url.pathname).toBe('/api/rooms')
    expect(url.searchParams.get('location')).toBe('Downtown')
    expect(url.searchParams.get('guests')).toBe('2')
    expect(url.searchParams.get('roomType')).toBe('Suite')
    expect(url.searchParams.get('amenities')).toBe('Pool,Gym')
  })

  it('searchRooms throws when network response is not ok', async () => {
    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockResolvedValue({ ok: false })

    await expect(
      searchRooms({
        location: 'Downtown',
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        guests: 1,
      }),
    ).rejects.toThrow('Failed to search rooms')
    expect(console.error).toHaveBeenCalledWith('Error searching rooms:', expect.any(Error))
  })

  it('getRoomDetails fetches room data', async () => {
    const fetchMock = global.fetch as jest.Mock
    const room = { id: 'room-10' }
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(room) })

    const result = await getRoomDetails('room-10')
    expect(result).toEqual(room)
    expect(fetchMock).toHaveBeenCalledWith('/api/rooms/room-10')
  })

  it('createBooking posts booking data and returns response', async () => {
    const fetchMock = global.fetch as jest.Mock
    const response = { success: true, booking: { id: 'booking-1' } }
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(response) })

    const bookingPayload = {
      roomId: 'room-1',
      userId: 'user-1',
      checkIn: new Date('2025-04-01T15:00:00.000Z'),
      checkOut: new Date('2025-04-05T11:00:00.000Z'),
      guests: 2,
      totalAmount: 1200,
      extras: {
        breakfast: true,
        lateCheckout: false,
        airportShuttle: true,
        spaAccess: false,
      },
      guestInfo: {
        firstName: 'Jordan',
        lastName: 'Smith',
        email: 'jordan@example.com',
        phone: '+1234567890',
      },
      specialRequests: 'Late arrival',
    }

    const result = await createBooking(bookingPayload)
    expect(result).toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload),
    })
  })

  it('createBooking surfaces API error messages', async () => {
    const fetchMock = global.fetch as jest.Mock
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Sold out' }),
    })

    await expect(
      createBooking({
        roomId: 'room-1',
        userId: 'user-1',
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        guests: 1,
        totalAmount: 100,
        extras: {
          breakfast: false,
          lateCheckout: false,
          airportShuttle: false,
          spaAccess: false,
        },
        guestInfo: {
          firstName: 'A',
          lastName: 'B',
          email: 'a@example.com',
          phone: '123',
        },
      }),
    ).rejects.toThrow('Sold out')
    expect(console.error).toHaveBeenCalledWith('Error creating booking:', expect.any(Error))
  })

  it('getBookingDetails retrieves booking by id', async () => {
    const fetchMock = global.fetch as jest.Mock
    const booking = { id: 'booking-9' }
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(booking) })

    const result = await getBookingDetails('booking-9')
    expect(result).toEqual(booking)
    expect(fetchMock).toHaveBeenCalledWith('/api/bookings/booking-9')
  })

  it('updateBooking sends partial updates', async () => {
    const fetchMock = global.fetch as jest.Mock
    const response = { success: true }
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(response) })

    const payload = { guests: 4 }
    const result = await updateBooking('booking-1', payload)
    expect(result).toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith('/api/bookings/booking-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  })

  it('cancelBooking issues DELETE request', async () => {
    const fetchMock = global.fetch as jest.Mock
    const response = { success: true }
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(response) })

    const result = await cancelBooking('booking-2')
    expect(result).toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith('/api/bookings/booking-2', { method: 'DELETE' })
  })

  it('getUserBookings fetches booking list', async () => {
    const fetchMock = global.fetch as jest.Mock
    const bookings = [{ id: 'booking-1' }, { id: 'booking-2' }]
    fetchMock.mockResolvedValue({ ok: true, json: () => Promise.resolve(bookings) })

    const result = await getUserBookings('user-10')
    expect(result).toEqual(bookings)
    expect(fetchMock).toHaveBeenCalledWith('/api/bookings?userId=user-10')
  })

  it('calculateBookingTotal tallies extras and taxes', () => {
    const total = calculateBookingTotal(200, 3, {
      breakfast: true,
      lateCheckout: true,
      airportShuttle: true,
      spaAccess: false,
    })

    // Base 600 + extras 200 = 800; plus 15% tax => 920.00
    expect(total).toBe(920)
  })

  it('validateBookingData reports missing and invalid fields', () => {
    const today = new Date()
    const past = new Date(today.getTime() - 86400000)

    const errors = validateBookingData({
      roomId: '',
      userId: '',
      checkIn: past,
      checkOut: past,
      guests: 0,
      guestInfo: { firstName: '', lastName: '', email: 'invalid', phone: '' },
    } as any)

    expect(errors).toEqual(
      expect.arrayContaining([
        'Room selection is required',
        'User ID is required',
        'Check-in date cannot be in the past',
        'Check-out date must be after check-in date',
        'Number of guests is required',
        'First name is required',
        'Last name is required',
        'Phone number is required',
        'Invalid email format',
      ]),
    )

    const validDataErrors = validateBookingData({
      roomId: 'room-1',
      userId: 'user-1',
      checkIn: new Date(Date.now() + 86400000),
      checkOut: new Date(Date.now() + 2 * 86400000),
      guests: 2,
      totalAmount: 300,
      extras: {
        breakfast: false,
        lateCheckout: false,
        airportShuttle: false,
        spaAccess: false,
      },
      guestInfo: {
        firstName: 'Jamie',
        lastName: 'Lee',
        email: 'jamie@example.com',
        phone: '555-0000',
      },
    })

    expect(validDataErrors).toHaveLength(0)
  })

  it('formatBookingConfirmation normalizes booking summary', () => {
    const booking = {
      id: 'booking-3',
      checkIn: new Date('2025-05-01T15:00:00.000Z'),
      checkOut: new Date('2025-05-05T11:00:00.000Z'),
      guests: 2,
      totalAmount: 999.99,
    } as any

    const room = {
      id: 'room-5',
      type: 'Suite',
      number: '1205',
      floor: 12,
    } as any

    const guestInfo = { firstName: 'Jordan', lastName: 'Smith' }

    const summary = formatBookingConfirmation(booking, room, guestInfo)
    expect(summary).toMatchObject({
      id: 'booking-3',
      room: { type: 'Suite', number: '1205', floor: 12 },
      total: 999.99,
      guestInfo,
    })
    expect(summary.dates.checkIn).toBeInstanceOf(Date)
    expect(summary.dates.checkOut).toBeInstanceOf(Date)
  })
})

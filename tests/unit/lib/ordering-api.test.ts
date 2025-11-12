/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals'

const roomOrder = {
  roomNumber: '301',
  guestId: 'guest-1',
  guestName: 'Jamie Guest',
  guestPhone: '+15551234567',
  items: [
    {
      menuItem: {
        id: 'menu-1',
        name: 'Pancakes Deluxe',
        description: 'Stack of pancakes',
        price: 12,
        category: 'BREAKFAST',
        available: true,
      },
      quantity: 2,
      unitPrice: 12,
      specialRequests: 'No syrup',
    },
  ],
  totalAmount: 24,
  paymentMethod: 'room_charge' as const,
  specialInstructions: 'Deliver warm',
}

describe('lib/ordering-api', () => {
  let fetchMock: jest.Mock
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.resetModules()
    fetchMock = jest.fn()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.fetch = fetchMock
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.clear()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    jest.clearAllMocks()
  })

  it('fetches menu items for a given category', async () => {
    const menuItems = [{ id: '1', name: 'Soup', price: 10 }]
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(menuItems),
    })

    const { getMenuItems } = await import('@/lib/ordering-api')

    const result = await getMenuItems('dinner')
    expect(fetchMock).toHaveBeenCalledWith('/api/restaurant/menu?category=dinner')
    expect(result).toEqual(menuItems)
  })

  it('throws when fetching menu items fails', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    })

    const { getMenuItems } = await import('@/lib/ordering-api')

    await expect(getMenuItems()).rejects.toThrow('Failed to fetch menu items')
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching menu items:',
      expect.any(Error),
    )
  })

  it('fetches a single menu item by id', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'menu-1',
          name: 'Burger',
          price: 14,
        }),
    })

    const { getMenuItem } = await import('@/lib/ordering-api')

    const item = await getMenuItem('menu-1')
    expect(fetchMock).toHaveBeenCalledWith('/api/restaurant/menu/menu-1')
    expect(item).toMatchObject({ id: 'menu-1', name: 'Burger' })
  })

  it('creates a food order and returns response payload', async () => {
    const successPayload = { success: true, order: { id: 'order-1' } }

    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(successPayload),
    })

    const { createFoodOrder } = await import('@/lib/ordering-api')

    const response = await createFoodOrder(roomOrder)
    expect(fetchMock).toHaveBeenCalledWith('/api/restaurant/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomOrder),
    })
    expect(response).toEqual(successPayload)
  })

  it('propagates API errors when creating orders', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Kitchen unavailable' }),
    })

    const { createFoodOrder } = await import('@/lib/ordering-api')

    await expect(createFoodOrder(roomOrder)).rejects.toThrow('Kitchen unavailable')
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating order:', expect.any(Error))
  })

  it('fetches an order by id', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'ORD42',
          status: 'PREPARING',
        }),
    })

    const { getOrder } = await import('@/lib/ordering-api')

    const order = await getOrder('ORD42')
    expect(fetchMock).toHaveBeenCalledWith('/api/restaurant/orders/ORD42')
    expect(order.status).toBe('PREPARING')
  })

  it('updates order status', async () => {
    const payload = { success: true }
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(payload),
    })

    const { updateOrderStatus } = await import('@/lib/ordering-api')

    const response = await updateOrderStatus('ORD42', 'READY')
    expect(fetchMock).toHaveBeenCalledWith('/api/restaurant/orders/ORD42', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'READY' }),
    })
    expect(response).toEqual(payload)
  })

  it('fetches kitchen orders filtered by status', async () => {
    const orders = [{ id: 'ORD99', status: 'READY' }]
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(orders),
    })

    const { getKitchenOrders } = await import('@/lib/ordering-api')

    const result = await getKitchenOrders('READY')
    expect(fetchMock).toHaveBeenCalledWith('/api/restaurant/orders?status=READY')
    expect(result).toEqual(orders)
  })

  it('calculates order totals with default service and tax', async () => {
    const { calculateOrderTotal } = await import('@/lib/ordering-api')

    const total = calculateOrderTotal(roomOrder.items)
    const subtotal = 24
    const expected = subtotal + subtotal * 0.1 + subtotal * 0.05
    expect(total).toBeCloseTo(expected)
  })

  it('validates order data and reports missing fields/items', async () => {
    const { validateOrderData } = await import('@/lib/ordering-api')

    const errors = validateOrderData({
      items: [
        {
          menuItem: { id: '', name: '', description: '', price: 0, category: 'BREAKFAST', available: true },
          quantity: 0,
          unitPrice: 0,
        },
      ],
    })

    expect(errors).toEqual(
      expect.arrayContaining([
        'Room number is required',
        'Guest ID is required',
        'Guest name is required',
        'Guest phone is required',
        'Payment method is required',
        'Item 1: Menu item ID is required',
        'Item 1: Quantity must be at least 1',
        'Item 1: Invalid unit price',
      ]),
    )
  })

  it('formats orders for display', async () => {
    const { formatOrderForDisplay } = await import('@/lib/ordering-api')

    const order = {
      id: 'ORD1',
      roomNumber: '301',
      guestId: 'guest-1',
      totalAmount: 99,
      status: 'CONFIRMED',
      createdAt: new Date('2025-04-01T12:00:00.000Z'),
      specialRequests: 'Extra napkins',
    } as any

    const items = [
      { quantity: 1, notes: 'Spicy', unitPrice: 15 },
      { quantity: 2, notes: '', unitPrice: 25 },
    ] as any

    const formatted = formatOrderForDisplay(order, items)
    expect(formatted).toMatchObject({
      id: 'ORD1',
      roomNumber: '301',
      guestName: 'guest-1',
      totalAmount: 99,
      status: 'CONFIRMED',
      specialInstructions: 'Extra napkins',
      items: [
        { name: 'Menu Item', quantity: 1, specialRequests: 'Spicy', unitPrice: 15 },
        { name: 'Menu Item', quantity: 2, specialRequests: '', unitPrice: 25 },
      ],
    })
  })

  it('generates QR codes respecting booking id', async () => {
    const { generateRoomQRCode } = await import('@/lib/ordering-api')

    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
    const qr = generateRoomQRCode('305', 'booking-99')
    expect(qr).toBe('https://example.com/order?room=305&booking=booking-99')
  })

  it('parses QR codes and returns null for invalid data', async () => {
    const { parseQRCodeData } = await import('@/lib/ordering-api')

    const parsed = parseQRCodeData('https://example.com/order?room=305&booking=booking-99')
    expect(parsed).toEqual({ roomNumber: '305', bookingId: 'booking-99' })

    expect(parseQRCodeData('not-a-url')).toBeNull()
    expect(parseQRCodeData('https://example.com/order')).toBeNull()
  })

  it('persists cart entries in local storage helpers', async () => {
    const { CartStorage } = await import('@/lib/ordering-api')

    CartStorage.save('301', roomOrder.items)
    expect(localStorage.getItem('cart_301')).toBe(JSON.stringify(roomOrder.items))

    const loaded = CartStorage.load('301')
    expect(loaded).toEqual(roomOrder.items)

    CartStorage.clear('301')
    expect(localStorage.getItem('cart_301')).toBeNull()
  })
})


// Ordering API integration for QR menu & ordering system
import { FoodMenu, InternalOrder } from '@prisma/client'
// Note: OrderItem model doesn't exist in schema

export interface MenuItemData {
  id: string
  name: string
  description: string
  price: number
  category: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'BEVERAGES' | 'SNACKS'
  imageUrl?: string
  preparationTime?: number
  available: boolean
  dietaryTags?: string[]
  isPopular?: boolean
  rating?: number
}

export interface CartItem {
  menuItem: MenuItemData
  quantity: number
  specialRequests?: string
  unitPrice: number
}

export interface OrderRequest {
  roomNumber: string
  guestId: string
  guestName: string
  guestPhone: string
  items: CartItem[]
  totalAmount: number
  specialInstructions?: string
  paymentMethod: 'room_charge' | 'card' | 'digital_wallet' | 'lanakqr' | 'payhere'
}

export interface OrderResponse {
  success: boolean
  order?: InternalOrder
  error?: string
}

// Get menu items
export async function getMenuItems(category?: string): Promise<MenuItemData[]> {
  try {
    const params = new URLSearchParams()
    if (category && category !== 'all') {
      params.append('category', category)
    }

    const response = await fetch(`/api/restaurant/menu?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch menu items')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching menu items:', error)
    throw error
  }
}

// Get menu item by ID
export async function getMenuItem(itemId: string): Promise<MenuItemData> {
  try {
    const response = await fetch(`/api/restaurant/menu/${itemId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch menu item')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching menu item:', error)
    throw error
  }
}

// Create a new food order
export async function createInternalOrder(orderData: OrderRequest): Promise<OrderResponse> {
  try {
    const response = await fetch('/api/restaurant/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create order')
    }

    return result
  } catch (error) {
    console.error('Error creating order:', error)
    throw error
  }
}

// Get order by ID
export async function getOrder(orderId: string): Promise<InternalOrder> {
  try {
    const response = await fetch(`/api/restaurant/orders/${orderId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch order')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
}

// Update order status
export async function updateOrderStatus(orderId: string, status: string): Promise<OrderResponse> {
  try {
    const response = await fetch(`/api/restaurant/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update order')
    }

    return result
  } catch (error) {
    console.error('Error updating order:', error)
    throw error
  }
}

// Get orders for kitchen dashboard
export async function getKitchenOrders(status?: string): Promise<InternalOrder[]> {
  try {
    const params = new URLSearchParams()
    if (status && status !== 'all') {
      params.append('status', status)
    }

    const response = await fetch(`/api/restaurant/orders?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
}

// Calculate order total
export function calculateOrderTotal(
  items: CartItem[],
  serviceChargePercent: number = 10,
  taxPercent: number = 5
): number {
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  const serviceCharge = subtotal * (serviceChargePercent / 100)
  const tax = subtotal * (taxPercent / 100)
  
  return subtotal + serviceCharge + tax
}

// Validate order data
export function validateOrderData(data: Partial<OrderRequest>): string[] {
  const errors: string[] = []

  if (!data.roomNumber) errors.push('Room number is required')
  if (!data.guestId) errors.push('Guest ID is required')
  if (!data.guestName) errors.push('Guest name is required')
  if (!data.guestPhone) errors.push('Guest phone is required')
  if (!data.items || data.items.length === 0) errors.push('At least one item is required')
  if (!data.paymentMethod) errors.push('Payment method is required')

  // Validate items
  if (data.items) {
    data.items.forEach((item, index) => {
      if (!item.menuItem.id) errors.push(`Item ${index + 1}: Menu item ID is required`)
      if (!item.quantity || item.quantity < 1) errors.push(`Item ${index + 1}: Quantity must be at least 1`)
      if (!item.unitPrice || item.unitPrice <= 0) errors.push(`Item ${index + 1}: Invalid unit price`)
    })
  }

  return errors
}

// Format order for display
// Note: OrderItem model doesn't exist in schema - using inline type
export function formatOrderForDisplay(order: InternalOrder, items: Array<{ quantity: number; notes?: string; unitPrice: number }>): any {
  return {
    id: order.id,
    roomId: order.roomId,
    guestName: order.guestId, // This would be resolved from user data
    items: items.map(item => ({
      name: 'Menu Item', // Would be resolved from menuId
      quantity: item.quantity,
      specialRequests: item.notes || '',
      unitPrice: item.unitPrice
    })),
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
    specialInstructions: order.specialRequests
  }
}

// WebSocket connection for real-time updates
export class OrderWebSocket {
  private ws: WebSocket | null = null
  private onOrderUpdate: ((orderId: string, status: string) => void) | null = null

  connect(onOrderUpdate: (orderId: string, status: string) => void) {
    this.onOrderUpdate = onOrderUpdate
    
    // In a real app, this would connect to your WebSocket server
    // this.ws = new WebSocket('ws://localhost:3001/orders')
    
    // For demo purposes, we'll simulate WebSocket messages
    this.simulateUpdates()
  }

  private simulateUpdates() {
    // Simulate real-time order updates
    setInterval(() => {
      if (this.onOrderUpdate) {
        // Simulate random order status updates
        const orderIds = ['ORD001', 'ORD002', 'ORD003']
        const statuses = ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED']
        
        const randomOrderId = orderIds[Math.floor(Math.random() * orderIds.length)]
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
        
        this.onOrderUpdate(randomOrderId, randomStatus)
      }
    }, 30000) // Update every 30 seconds
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.onOrderUpdate = null
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }
}

// QR Code utilities
export function generateRoomQRCode(roomNumber: string, bookingId?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smarthotel-demo.vercel.app'
  const params = new URLSearchParams({
    room: roomNumber,
    ...(bookingId && { booking: bookingId })
  })
  
  return `${baseUrl}/order?${params.toString()}`
}

export function parseQRCodeData(qrData: string): { roomNumber: string; bookingId?: string } | null {
  try {
    const url = new URL(qrData)
    const roomNumber = url.searchParams.get('room')
    const bookingId = url.searchParams.get('booking')
    
    if (!roomNumber) return null
    
    return {
      roomNumber,
      bookingId: bookingId || undefined
    }
  } catch {
    return null
  }
}

// Local storage utilities for cart persistence
export const CartStorage = {
  save: (roomNumber: string, cart: CartItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`cart_${roomNumber}`, JSON.stringify(cart))
    }
  },
  
  load: (roomNumber: string): CartItem[] => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`cart_${roomNumber}`)
      return saved ? JSON.parse(saved) : []
    }
    return []
  },
  
  clear: (roomNumber: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`cart_${roomNumber}`)
    }
  }
}


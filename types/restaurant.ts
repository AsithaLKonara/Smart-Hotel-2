export interface FoodMenuItem {
  id: string
  name: string
  description?: string
  price: number
  category: FoodCategory
  image?: string
  available: boolean
  preparationTime?: number
  hotelId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CartItem {
  menuItem: FoodMenuItem
  quantity: number
  notes?: string
}

export interface FoodOrder {
  id: string
  roomNumber: string
  guestId: string
  bookingId?: string
  status: OrderStatus
  totalAmount: number
  specialRequests?: string
  deliveryTime?: Date
  hotelId?: string
  createdAt: Date
  updatedAt: Date
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  orderId: string
  menuId: string
  quantity: number
  unitPrice: number
  notes?: string
  hotelId?: string
  createdAt: Date
  menu: FoodMenuItem
}

export type FoodCategory = 
  | 'BREAKFAST'
  | 'LUNCH'
  | 'DINNER'
  | 'BEVERAGES'
  | 'DESSERTS'
  | 'SNACKS'
  | 'APPETIZERS'
  | 'MAIN_COURSE'
  | 'SIDES'

export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED'

export interface CreateOrderRequest {
  roomNumber: string
  guestId?: string
  bookingId?: string
  items: {
    menuId: string
    quantity: number
    notes?: string
  }[]
  specialRequests?: string
}

export interface UpdateOrderStatusRequest {
  orderId: string
  status: OrderStatus
  deliveryTime?: Date
}

export interface MenuFilter {
  category?: FoodCategory
  available?: boolean
  search?: string
  minPrice?: number
  maxPrice?: number
}

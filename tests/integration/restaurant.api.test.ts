import { NextRequest } from 'next/server'
import { GET as getMenu } from '@/app/api/restaurant/menu/route'
import { POST as createOrder } from '@/app/api/restaurant/orders/route'
import { GET as getKitchenOrders } from '@/app/api/kitchen/orders/route'
import { PATCH as updateOrderStatus } from '@/app/api/restaurant/orders/[id]/route'

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined)

// Mock Prisma client
jest.mock('@/lib/db', () => ({
  prisma: {
    foodMenu: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    foodOrder: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}))

import { prisma } from '@/lib/db'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Restaurant API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/restaurant/menu', () => {
    test('should return restaurant menu successfully', async () => {
      const mockMenu = [
        {
          id: 'appetizer-1',
          name: 'Caesar Salad',
          description: 'Fresh romaine lettuce with parmesan cheese',
          price: 12.99,
          category: 'Appetizers',
          preparationTime: 15,
          dietaryTags: ['vegetarian'],
          image: '/images/caesar-salad.jpg',
        },
        {
          id: 'main-1',
          name: 'Grilled Salmon',
          description: 'Fresh Atlantic salmon with herbs',
          price: 28.99,
          category: 'Main Courses',
          preparationTime: 25,
          dietaryTags: ['gluten-free'],
          image: '/images/grilled-salmon.jpg',
        },
      ]

      mockPrisma.foodMenu.findMany.mockResolvedValue(mockMenu)

      const request = new NextRequest('http://localhost:3000/api/restaurant/menu')
      const response = await getMenu(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockMenu)
      expect(mockPrisma.foodMenu.findMany).toHaveBeenCalledTimes(1)
    })

    test('should filter menu by category', async () => {
      const mockAppetizers = [
        {
          id: 'appetizer-1',
          name: 'Caesar Salad',
          category: 'Appetizers',
          price: 12.99,
        },
      ]

      mockPrisma.foodMenu.findMany.mockResolvedValue(mockAppetizers)

      const request = new NextRequest('http://localhost:3000/api/restaurant/menu?category=Appetizers')
      const response = await getMenu(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(mockPrisma.foodMenu.findMany).toHaveBeenCalledWith({
        where: { category: 'Appetizers' },
        orderBy: { name: 'asc' },
      })
    })

    test('should filter menu by dietary requirements', async () => {
      const mockVegetarianItems = [
        {
          id: 'veg-1',
          name: 'Vegetarian Pasta',
          dietaryTags: ['vegetarian'],
          price: 18.99,
        },
      ]

      mockPrisma.foodMenu.findMany.mockResolvedValue(mockVegetarianItems)

      const request = new NextRequest('http://localhost:3000/api/restaurant/menu?dietary=vegetarian')
      const response = await getMenu(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(mockPrisma.foodMenu.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'asc' },
      })
    })

    test('should handle database errors gracefully', async () => {
      mockPrisma.foodMenu.findMany.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/restaurant/menu')
      const response = await getMenu(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to fetch menu')
    })
  })

  describe('POST /api/restaurant/orders', () => {
    test('should create food order successfully', async () => {
      const mockOrder = {
        id: 'order-123',
        userId: 'user-123',
        items: [
          {
            menuId: 'appetizer-1',
            quantity: 2,
            specialInstructions: 'Extra dressing',
          },
        ],
        totalAmount: 25.98,
        status: 'PENDING',
        roomNumber: '205',
        estimatedPrepTime: 30,
      }

      mockPrisma.foodMenu.findUnique.mockResolvedValue({
        id: 'appetizer-1',
        name: 'Caesar Salad',
        price: 12.99,
        preparationTime: 15,
      })
      mockPrisma.foodOrder.create.mockResolvedValue(mockOrder)

      const requestBody = {
        items: [
          {
            menuId: 'appetizer-1',
            quantity: 2,
            specialInstructions: 'Extra dressing',
          },
        ],
        roomNumber: '205',
        specialRequests: 'Please deliver to room',
        guestId: 'user-123',
      }

      const request = new NextRequest('http://localhost:3000/api/restaurant/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await createOrder(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toHaveProperty('order')
      expect(data.order.status).toBe('PENDING')
      expect(mockPrisma.foodOrder.create).toHaveBeenCalledTimes(1)
    })

    test('should validate order data', async () => {
      const requestBody = {
        items: [],
        roomNumber: '',
      }

      const request = new NextRequest('http://localhost:3000/api/restaurant/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await createOrder(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid order data')
    })

    test('should handle non-existent menu items', async () => {
      mockPrisma.foodMenu.findUnique.mockResolvedValue(null)

      const requestBody = {
        items: [
          {
            menuId: 'non-existent-item',
            quantity: 1,
          },
        ],
        roomNumber: '205',
        guestId: 'user-123',
      }

      const request = new NextRequest('http://localhost:3000/api/restaurant/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await createOrder(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Menu item not found')
    })

    test('should calculate correct total amount', async () => {
      const mockOrder = {
        id: 'order-123',
        totalAmount: 45.97,
        status: 'PENDING',
      }

      mockPrisma.foodMenu.findUnique.mockResolvedValue({
        id: 'main-1',
        name: 'Grilled Salmon',
        price: 28.99,
        preparationTime: 25,
      })
      mockPrisma.foodOrder.create.mockResolvedValue(mockOrder)

      const requestBody = {
        items: [
          {
            menuId: 'main-1',
            quantity: 1,
          },
        ],
        roomNumber: '205',
        guestId: 'user-123',
      }

      const request = new NextRequest('http://localhost:3000/api/restaurant/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await createOrder(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.order.totalAmount).toBe(28.99)
    })
  })

  describe('GET /api/kitchen/orders', () => {
    test('should return kitchen orders for staff', async () => {
      const mockOrders = [
        {
          id: 'order-123',
          userId: 'user-123',
          status: 'PENDING',
          items: [
            {
              menuId: 'appetizer-1',
              quantity: 2,
              specialInstructions: 'Extra dressing',
              menu: {
                name: 'Caesar Salad',
                preparationTime: 15,
              },
            },
          ],
          totalAmount: 25.98,
          roomNumber: '205',
          createdAt: new Date('2024-01-15T10:00:00Z'),
        },
      ]

      mockPrisma.foodOrder.findMany.mockResolvedValue(mockOrders)

      const request = new NextRequest('http://localhost:3000/api/kitchen/orders', {
        headers: {
          'Authorization': 'Bearer kitchen-staff-token',
        },
      })

      const response = await getKitchenOrders(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('orders')
      expect(data.orders).toHaveLength(1)
      expect(mockPrisma.foodOrder.findMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: ['PENDING', 'PREPARING', 'READY'],
          },
        },
        include: {
          items: {
            include: {
              menu: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })
    })

    test('should filter orders by status', async () => {
      const mockOrders = [
        {
          id: 'order-123',
          status: 'PREPARING',
          items: [],
        },
      ]

      mockPrisma.foodOrder.findMany.mockResolvedValue(mockOrders)

      const request = new NextRequest('http://localhost:3000/api/kitchen/orders?status=PREPARING')
      const response = await getKitchenOrders(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.orders).toHaveLength(1)
      expect(mockPrisma.foodOrder.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PREPARING',
        },
        include: {
          items: {
            include: {
              menu: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })
    })

    test('should handle unauthorized access', async () => {
      const request = new NextRequest('http://localhost:3000/api/kitchen/orders')
      const response = await getKitchenOrders(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Unauthorized')
    })
  })

  describe('PATCH /api/restaurant/orders/[id]', () => {
    test('should update order status successfully', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'PREPARING',
        estimatedPrepTime: 25,
      }

      mockPrisma.foodOrder.findUnique.mockResolvedValue({
        id: 'order-123',
        status: 'PENDING',
        items: [],
      })
      mockPrisma.foodOrder.update.mockResolvedValue(mockOrder)

      const requestBody = {
        status: 'PREPARING',
        estimatedPrepTime: 25,
      }

      const request = new NextRequest('http://localhost:3000/api/restaurant/orders/order-123', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer kitchen-staff-token',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await updateOrderStatus(request, { params: Promise.resolve({ id: 'order-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('order')
      expect(data.order.status).toBe('PREPARING')
      expect(mockPrisma.foodOrder.update).toHaveBeenCalledTimes(1)
    })

    test('should validate status transitions', async () => {
      mockPrisma.foodOrder.findUnique.mockResolvedValue({
        id: 'order-123',
        status: 'DELIVERED',
        items: [],
      })

      const requestBody = {
        status: 'PENDING',
      }

      const request = new NextRequest('http://localhost:3000/api/restaurant/orders/order-123', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await updateOrderStatus(request, { params: Promise.resolve({ id: 'order-123' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid status transition')
    })

    test('should handle non-existent order', async () => {
      mockPrisma.foodOrder.findUnique.mockResolvedValue(null)

      const requestBody = {
        status: 'PREPARING',
      }

      const request = new NextRequest('http://localhost:3000/api/restaurant/orders/non-existent', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await updateOrderStatus(request, { params: Promise.resolve({ id: 'non-existent' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('Order not found')
    })

    test('should update preparation time when status changes to PREPARING', async () => {
      const mockOrder = {
        id: 'order-123',
        status: 'PREPARING',
        preparationTime: 25,
      }

      mockPrisma.foodOrder.findUnique.mockResolvedValue({
        id: 'order-123',
        status: 'PENDING',
        items: [
          {
            menu: {
              preparationTime: 25,
            },
          },
        ],
      })
      mockPrisma.foodOrder.update.mockResolvedValue(mockOrder)

      const requestBody = {
        status: 'PREPARING',
      }

      const request = new NextRequest('http://localhost:3000/api/restaurant/orders/order-123', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const response = await updateOrderStatus(request, { params: Promise.resolve({ id: 'order-123' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockPrisma.foodOrder.update).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        data: {
          status: 'PREPARING',
          preparationTime: 25,
        },
      })
    })
  })
})

afterAll(() => {
  consoleErrorSpy.mockRestore()
  consoleLogSpy.mockRestore()
})

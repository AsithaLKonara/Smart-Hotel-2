"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ChefHat, 
  Timer,
  Users,
  Coffee,
  Utensils,
  Loader2,
  Bell
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { canAccessReceptionistFeatures } from '@/lib/rbac-helpers'

interface OrderItem {
  id: string
  quantity: number
  specialInstructions?: string
    menu: {
      id: string
      name: string
      category: string
      preparationTime: number
    }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  estimatedDeliveryTime?: Date
  kitchenNotes?: string
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string
    email: string
  }
  items: OrderItem[]
}

interface KitchenData {
  orders: Order[]
  ordersByStatus: {
    PENDING: Order[]
    CONFIRMED: Order[]
    PREPARING: Order[]
    READY: Order[]
    DELIVERED: Order[]
    CANCELLED: Order[]
  }
  summary: {
    total: number
    pending: number
    preparing: number
    ready: number
    delivered: number
  }
}

function KitchenDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [kitchenData, setKitchenData] = useState<KitchenData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!canAccessReceptionistFeatures(session)) {
      router.push('/')
      return
    }

    fetchKitchenData()
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchKitchenData, 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router])

  const fetchKitchenData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/kitchen/orders?today=true')
      const data = await response.json()

      if (response.ok) {
        setKitchenData(data)
      } else if (response.status === 401) {
        // Unauthorized - redirect to sign in
        router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/kitchen/dashboard'))
        return
      } else {
        toast.error('Failed to load kitchen data')
        setKitchenData(null)
      }
    } catch (error) {
      console.error('Failed to fetch kitchen data:', error)
      toast.error('Failed to load kitchen data')
      setKitchenData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId)
    try {
      const response = await fetch('/api/kitchen/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: newStatus
        })
      })

      if (response.ok) {
        toast.success(`Order ${newStatus.toLowerCase()}`)
        fetchKitchenData() // Refresh data
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update order')
      }
    } catch (error) {
      toast.error('Failed to update order')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800'
      case 'PREPARING': return 'bg-orange-100 text-orange-800'
      case 'READY': return 'bg-green-100 text-green-800'
      case 'DELIVERED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return Clock
      case 'CONFIRMED': return Bell
      case 'PREPARING': return ChefHat
      case 'READY': return CheckCircle
      case 'DELIVERED': return CheckCircle
      case 'CANCELLED': return AlertCircle
      default: return Clock
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEstimatedPrepTime = (order: Order) => {
    const maxPrepTime = Math.max(...order.items.map(item => item.menu.preparationTime || 0))
    return maxPrepTime
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading kitchen dashboard...</p>
        </div>
      </div>
    )
  }

  if (!kitchenData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load kitchen data</p>
          <Button onClick={fetchKitchenData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const { ordersByStatus, summary } = kitchenData

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ChefHat className="w-8 h-8 mr-3 text-amber-600" />
            Kitchen Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Manage food orders and preparation</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{summary.pending}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <Bell className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-gray-900">{ordersByStatus.CONFIRMED.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <ChefHat className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Preparing</p>
                <p className="text-2xl font-bold text-gray-900">{summary.preparing}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Ready</p>
                <p className="text-2xl font-bold text-gray-900">{summary.ready}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <Utensils className="w-8 h-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{summary.delivered}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Order Workflow */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Pending Orders */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
              <Badge className="bg-yellow-100 text-yellow-800">
                {ordersByStatus.PENDING.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {ordersByStatus.PENDING.map((order) => (
                <div key={order.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">#{order.orderNumber}</span>
                    <span className="text-sm text-gray-500">{formatTime(order.createdAt.toString())}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{order.user.name}</p>
                  <div className="text-sm text-gray-600 mb-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.quantity}x {item.menu.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                    disabled={updatingOrder === order.id}
                    className="w-full"
                  >
                    {updatingOrder === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Confirm Order'
                    )}
                  </Button>
                </div>
              ))}
              {ordersByStatus.PENDING.length === 0 && (
                <p className="text-gray-500 text-center py-4">No pending orders</p>
              )}
            </div>
          </Card>

          {/* Confirmed Orders */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirmed</h3>
              <Badge className="bg-blue-100 text-blue-800">
                {ordersByStatus.CONFIRMED.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {ordersByStatus.CONFIRMED.map((order) => (
                <div key={order.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">#{order.orderNumber}</span>
                    <span className="text-sm text-gray-500">{formatTime(order.createdAt.toString())}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{order.user.name}</p>
                  <div className="text-sm text-gray-600 mb-2">
                    Est. prep time: {getEstimatedPrepTime(order)} min
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.quantity}x {item.menu.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                    disabled={updatingOrder === order.id}
                    className="w-full"
                  >
                    {updatingOrder === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Start Preparing'
                    )}
                  </Button>
                </div>
              ))}
              {ordersByStatus.CONFIRMED.length === 0 && (
                <p className="text-gray-500 text-center py-4">No confirmed orders</p>
              )}
            </div>
          </Card>

          {/* Preparing Orders */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Preparing</h3>
              <Badge className="bg-orange-100 text-orange-800">
                {ordersByStatus.PREPARING.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {ordersByStatus.PREPARING.map((order) => (
                <div key={order.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">#{order.orderNumber}</span>
                    <span className="text-sm text-gray-500">{formatTime(order.createdAt.toString())}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{order.user.name}</p>
                  <div className="text-sm text-gray-600 mb-2">
                    Est. prep time: {getEstimatedPrepTime(order)} min
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.quantity}x {item.menu.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'READY')}
                    disabled={updatingOrder === order.id}
                    className="w-full"
                  >
                    {updatingOrder === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Mark Ready'
                    )}
                  </Button>
                </div>
              ))}
              {ordersByStatus.PREPARING.length === 0 && (
                <p className="text-gray-500 text-center py-4">No orders being prepared</p>
              )}
            </div>
          </Card>

          {/* Ready Orders */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ready</h3>
              <Badge className="bg-green-100 text-green-800">
                {ordersByStatus.READY.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {ordersByStatus.READY.map((order) => (
                <div key={order.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">#{order.orderNumber}</span>
                    <span className="text-sm text-gray-500">{formatTime(order.createdAt.toString())}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{order.user.name}</p>
                  <div className="text-sm text-gray-600 mb-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.quantity}x {item.menu.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                    disabled={updatingOrder === order.id}
                    className="w-full"
                  >
                    {updatingOrder === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Mark Delivered'
                    )}
                  </Button>
                </div>
              ))}
              {ordersByStatus.READY.length === 0 && (
                <p className="text-gray-500 text-center py-4">No orders ready for delivery</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function KitchenDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading kitchen dashboard...</p>
        </div>
      </div>
    }>
      <KitchenDashboardContent />
    </Suspense>
  )
}

"use client"

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { canAccessManagerFeatures } from '@/lib/rbac-helpers'
import { QueryKeys } from '@/lib/query-keys'
import { Search, Filter, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

interface InternalOrder {
  id: string
  roomNumber: string
  totalAmount: number
  status: string
  specialRequests?: string
  createdAt: string
  deliveryTime?: string
  items: {
    id: string
    quantity: number
    unitPrice: number
    notes?: string
    menu: {
      name: string
      category: string
    }
  }[]
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<InternalOrder | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Redirect if unauthorized
  useEffect(() => {
    if (status === 'loading') return
    if (!canAccessManagerFeatures(session)) {
      router.push('/auth/signin')
    }
  }, [session, status, router])

  const { data: rawOrders, isLoading: loading, refetch: fetchOrders } = useQuery({
    queryKey: QueryKeys.orders.all,
    queryFn: async () => {
      const response = await fetch('/api/restaurant/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      return await response.json()
    },
    refetchInterval: 30000,
    enabled: status === 'authenticated' && canAccessManagerFeatures(session)
  })

  const orders = Array.isArray(rawOrders) ? rawOrders : (rawOrders?.orders || [])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/restaurant/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update order status')

      toast.success(`Order ${newStatus.toLowerCase()}`)
      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(order => {
    const matchesSearch = order.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'PREPARING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'READY':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'DELIVERED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="w-5 h-5" />
      case 'CANCELLED':
        return <XCircle className="w-5 h-5" />
      case 'READY':
        return <CheckCircle className="w-5 h-5" />
      case 'PREPARING':
        return <Clock className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const ordersArray = Array.isArray(orders) ? orders : []
  const statsData = {
    total: ordersArray.length,
    pending: ordersArray.filter(o => o.status === 'PENDING').length,
    preparing: ordersArray.filter(o => o.status === 'PREPARING').length,
    ready: ordersArray.filter(o => o.status === 'READY').length,
    delivered: ordersArray.filter(o => o.status === 'DELIVERED').length,
    totalRevenue: ordersArray
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Food Orders Management</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage room service and restaurant orders in real-time
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Orders</div>
            <div className="text-2xl font-bold">{statsData.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
            <div className="text-2xl font-bold text-orange-600">{statsData.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Preparing</div>
            <div className="text-2xl font-bold text-yellow-600">{statsData.preparing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Ready</div>
            <div className="text-2xl font-bold text-green-600">{statsData.ready}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Delivered</div>
            <div className="text-2xl font-bold text-gray-600">{statsData.delivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Revenue</div>
            <div className="text-2xl font-bold text-primary-600">${statsData.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by room number or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PREPARING">Preparing</option>
          <option value="READY">Ready</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Room {order.roomNumber}</CardTitle>
                  <p className="text-xs text-gray-500">Order #{order.id.slice(-8)}</p>
                </div>
                <Badge className={getStatusColor(order.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(order.status)}
                    {order.status}
                  </div>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="text-gray-600 dark:text-gray-400">Items: {order.items?.length || 0}</p>
                  <p className="font-semibold text-lg">${order.totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                {order.specialRequests && (
                  <div className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                    <p className="text-xs font-medium">Special Requests:</p>
                    <p className="text-xs">{order.specialRequests}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  {order.status === 'PENDING' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                      className="flex-1"
                    >
                      Confirm
                    </Button>
                  )}
                  {order.status === 'CONFIRMED' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                      className="flex-1"
                    >
                      Start Preparing
                    </Button>
                  )}
                  {order.status === 'PREPARING' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(order.id, 'READY')}
                      className="flex-1"
                    >
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'READY' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                      className="flex-1"
                    >
                      Mark Delivered
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedOrder(order)
                      setShowDetailsModal(true)
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="p-12 text-center">
          <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No orders found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your filters'
              : 'No orders have been placed yet'}
          </p>
        </Card>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Order Details</CardTitle>
                  <p className="text-sm text-gray-500">Room {selectedOrder.roomNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedOrder(null)
                  }}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Order ID</p>
                  <p>{selectedOrder.id}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Order Items</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div>
                          <p className="font-medium">{item.menu.name}</p>
                          <p className="text-xs text-gray-500">{item.menu.category}</p>
                          {item.notes && (
                            <p className="text-xs text-gray-600 italic">Note: {item.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm">x{item.quantity}</p>
                          <p className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.specialRequests && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Special Requests</p>
                    <p className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                      {selectedOrder.specialRequests}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="font-semibold">Total Amount</p>
                  <p className="text-2xl font-bold">${selectedOrder.totalAmount.toFixed(2)}</p>
                </div>

                <div className="text-xs text-gray-500">
                  Ordered at: {new Date(selectedOrder.createdAt).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}











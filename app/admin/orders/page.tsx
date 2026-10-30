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
import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'
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
  }, [session, status]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px]'
      case 'PREPARING':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px]'
      case 'READY':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]'
      case 'DELIVERED':
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono text-[10px]'
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono text-[10px]'
      default:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px]'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <CheckCircle className="w-3.5 h-3.5" />
      case 'CANCELLED':
        return <XCircle className="w-3.5 h-3.5" />
      case 'READY':
        return <CheckCircle className="w-3.5 h-3.5" />
      case 'PREPARING':
        return <Clock className="w-3.5 h-3.5" />
      default:
        return <AlertCircle className="w-3.5 h-3.5" />
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
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#090A0C]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <AdminPageShell
      title="Live Kitchen Orders"
      subtitle="Dispatch and track room service and restaurant table orders in real-time."
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Total Orders</p>
            <p className="text-xl font-mono font-bold text-zinc-100 mt-1">{statsData.total}</p>
          </Card>

          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Pending</p>
            <p className="text-xl font-mono font-bold text-amber-400 mt-1">{statsData.pending}</p>
          </Card>

          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Preparing</p>
            <p className="text-xl font-mono font-bold text-yellow-400 mt-1">{statsData.preparing}</p>
          </Card>

          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Ready For Pickup</p>
            <p className="text-xl font-mono font-bold text-emerald-400 mt-1">{statsData.ready}</p>
          </Card>

          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Delivered</p>
            <p className="text-xl font-mono font-bold text-zinc-400 mt-1">{statsData.delivered}</p>
          </Card>

          <Card className="bg-[#121417] border border-[#1E2227] rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">Delivered Rev</p>
            <p className="text-xl font-mono font-bold text-emerald-400 mt-1">${statsData.totalRevenue.toFixed(2)}</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="p-3 bg-[#121417] border border-[#1E2227] rounded-xl flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search by room number or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 placeholder:text-zinc-500 rounded-lg pl-9 pr-3.5 py-2 outline-none focus:border-zinc-400 transition-all font-mono"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#181A1D] border border-[#2B3037] text-xs text-zinc-100 rounded-lg px-3 py-2 outline-none focus:border-zinc-400 font-mono"
          >
            <option value="all" className="bg-[#181A1D] text-zinc-100">All Statuses</option>
            <option value="PENDING" className="bg-[#181A1D] text-zinc-100">Pending</option>
            <option value="CONFIRMED" className="bg-[#181A1D] text-zinc-100">Confirmed</option>
            <option value="PREPARING" className="bg-[#181A1D] text-zinc-100">Preparing</option>
            <option value="READY" className="bg-[#181A1D] text-zinc-100">Ready</option>
            <option value="DELIVERED" className="bg-[#181A1D] text-zinc-100">Delivered</option>
            <option value="CANCELLED" className="bg-[#181A1D] text-zinc-100">Cancelled</option>
          </select>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="bg-[#121417] border border-[#1E2227] hover:border-[#2B3037] transition-all rounded-xl shadow-sm flex flex-col justify-between">
              <CardHeader className="p-4 pb-3 border-b border-[#1E2227]">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-mono font-bold text-zinc-100">Room {order.roomNumber}</CardTitle>
                    <p className="text-[11px] font-mono text-zinc-500">ORD-{order.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded ${getStatusBadgeClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono text-zinc-400">Items: {order.items?.length || 0}</p>
                    <p className="font-mono font-bold text-base text-zinc-100">${Number(order.totalAmount || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-mono text-zinc-500">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {order.specialRequests && (
                  <div className="text-xs bg-[#181A1D] border border-amber-500/20 p-2.5 rounded-lg space-y-0.5">
                    <p className="text-[10px] font-mono uppercase text-amber-400 font-semibold">Special Instructions:</p>
                    <p className="text-xs text-zinc-300 font-mono">{order.specialRequests}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-[#1E2227]">
                  {order.status === 'PENDING' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                      className="flex-1 h-8 bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-lg"
                    >
                      Confirm
                    </Button>
                  )}
                  {order.status === 'CONFIRMED' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(order.id, 'PREPARING')}
                      className="flex-1 h-8 bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-lg"
                    >
                      Start Prep
                    </Button>
                  )}
                  {order.status === 'PREPARING' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(order.id, 'READY')}
                      className="flex-1 h-8 bg-emerald-400 hover:bg-emerald-300 text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-lg"
                    >
                      Mark Ready
                    </Button>
                  )}
                  {order.status === 'READY' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                      className="flex-1 h-8 bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-lg"
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
                    className="h-8 w-8 p-0 bg-[#181A1D] hover:bg-[#20242A] border-[#2B3037] text-zinc-300 rounded-lg"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <Card className="bg-[#121417] border border-[#1E2227] p-12 text-center rounded-xl">
            <Clock className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
            <h3 className="text-sm font-semibold text-zinc-200 mb-1">No orders dispatched</h3>
            <p className="text-xs text-zinc-500 font-mono">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search criteria or status filter.'
                : 'No active food or beverage tickets currently in queue.'}
            </p>
          </Card>
        )}
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-xl max-h-[90vh] bg-[#121417] border border-[#1E2227] rounded-xl shadow-2xl overflow-y-auto">
            <CardHeader className="px-6 py-4 border-b border-[#1E2227]">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-100">Ticket Details</CardTitle>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">Room {selectedOrder.roomNumber} • ORD-{selectedOrder.id.slice(-8).toUpperCase()}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedOrder(null)
                  }}
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-[#181A1D]"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Status</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${getStatusBadgeClass(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">Order Line Items</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-3 bg-[#181A1D] border border-[#1E2227] rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-zinc-200">{item.menu.name}</p>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase">{item.menu.category}</p>
                        {item.notes && (
                          <p className="text-[11px] text-amber-400/90 font-mono mt-1">Note: {item.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono text-zinc-400">x{item.quantity}</p>
                        <p className="text-xs font-mono font-bold text-zinc-100">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.specialRequests && (
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1">Special Guest Requests</p>
                  <p className="text-xs bg-[#181A1D] border border-amber-500/20 text-zinc-300 font-mono p-3 rounded-lg">
                    {selectedOrder.specialRequests}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-[#1E2227]">
                <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Total Charged</p>
                <p className="text-xl font-mono font-bold text-zinc-100">${Number(selectedOrder.totalAmount || 0).toFixed(2)}</p>
              </div>

              <div className="text-[11px] font-mono text-zinc-500 pt-1">
                Placed At: {new Date(selectedOrder.createdAt).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminPageShell>
  )
}











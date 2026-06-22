"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  ChefHat, 
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { QueryKeys } from '@/lib/query-keys'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import { canAccessKitchenFeatures } from '@/lib/rbac-helpers'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

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
  kitchenNotes?: string
  createdAt: string
  roomNumber?: string
  user: {
    id: string
    name: string
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
  }
}

import { AdminPageShell } from '@/components/dashboard/admin/admin-page-shell'

import { useQuery, useQueryClient } from '@tanstack/react-query'

function KitchenDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  const { data: kitchenData, isLoading, refetch: fetchKitchenData } = useQuery<KitchenData>({
    queryKey: QueryKeys.orders.kitchenToday,
    queryFn: async () => {
      const response = await fetch('/api/kitchen/orders?today=true', { cache: 'no-store' })
      if (response.status === 401) {
        router.push('/auth/signin')
        throw new Error('Unauthorized')
      }
      const data = await response.json()
      return {
        orders: data.orders || [],
        ordersByStatus: data.ordersByStatus || {
          PENDING: [],
          CONFIRMED: [],
          PREPARING: [],
          READY: [],
          DELIVERED: []
        }
      }
    },
    refetchInterval: 10000,
    enabled: status === 'authenticated'
  })

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId)
    try {
      const response = await fetch('/api/kitchen/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      })

      if (response.ok) {
        toast.success(`Order updated to ${newStatus.toLowerCase()}`)
        fetchKitchenData()
      }
    } catch (error) {
      toast.error('Failed to update order')
    } finally {
      setUpdatingOrder(null)
    }
  }

  if (isLoading && !kitchenData) {
    return (
      <div className="flex items-center justify-center py-20">
        <PremiumSpinner size="lg" text="Loading Kitchen Orders..." />
      </div>
    )
  }

  const { ordersByStatus } = kitchenData || {
    ordersByStatus: { PENDING: [], CONFIRMED: [], PREPARING: [], READY: [], DELIVERED: [] }
  }

  return (
    <AdminPageShell
      title="Kitchen Control"
      subtitle="Manage real-time room service orders and preparation status."
      onRefresh={fetchKitchenData}
      actions={
        <Button 
          variant="destructive" 
          onClick={() => router.push('/kitchen/complain')}
          className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white h-10 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl"
        >
          <AlertTriangle className="w-4 h-4 mr-2" /> Report Issue
        </Button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* New Orders */}
        <Card className="bg-[#0c0c0c] border-white/5 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-amber-500/5">
            <span className="font-bold text-white uppercase tracking-widest text-[10px]">New Orders</span>
            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/20">{ordersByStatus.PENDING.length}</Badge>
          </div>
          <div className="p-6 space-y-4">
            {ordersByStatus.PENDING.map(ord => (
              <div key={ord.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-4 hover:border-primary/30 transition-all group">
                <div className="flex justify-between font-bold text-sm">
                  <span className="text-white/40">#{ord.orderNumber}</span>
                  <span className="text-primary font-black">Room {ord.roomNumber}</span>
                </div>
                <div className="space-y-1">
                  {ord.items.map(it => (
                    <div key={it.id} className="text-xs text-white/60 flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full" />
                      {it.quantity}x {it.menu.name}
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={() => updateOrderStatus(ord.id, 'CONFIRMED')}
                  className="w-full h-10 text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white rounded-xl"
                  disabled={updatingOrder === ord.id}
                >
                  Accept Order
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Confirmed */}
        <Card className="bg-[#0c0c0c] border-white/5 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-blue-500/5">
            <span className="font-bold text-white uppercase tracking-widest text-[10px]">Confirmed</span>
            <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/20">{ordersByStatus.CONFIRMED.length}</Badge>
          </div>
          <div className="p-6 space-y-4">
            {ordersByStatus.CONFIRMED.map(ord => (
              <div key={ord.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                <div className="font-bold text-sm text-white">#{ord.orderNumber} - Room {ord.roomNumber}</div>
                <Button 
                  onClick={() => updateOrderStatus(ord.id, 'PREPARING')}
                  className="w-full h-10 text-[10px] font-black uppercase tracking-widest bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl"
                  disabled={updatingOrder === ord.id}
                >
                  Start Preparation
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Preparing */}
        <Card className="bg-[#0c0c0c] border-white/5 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-purple-500/5">
            <span className="font-bold text-white uppercase tracking-widest text-[10px]">Preparing</span>
            <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/20">{ordersByStatus.PREPARING.length}</Badge>
          </div>
          <div className="p-6 space-y-4">
            {ordersByStatus.PREPARING.map(ord => (
              <div key={ord.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-4 border-l-4 border-l-purple-500">
                <div className="font-bold text-sm text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-purple-500" /> #{ord.orderNumber}
                  </div>
                  <span className="text-purple-500 font-black">Room {ord.roomNumber}</span>
                </div>
                <Button 
                  onClick={() => updateOrderStatus(ord.id, 'READY')}
                  className="w-full h-10 text-[10px] font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white rounded-xl animate-pulse"
                  disabled={updatingOrder === ord.id}
                >
                  Mark as Ready
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Ready */}
        <Card className="bg-[#0c0c0c] border-white/5 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-emerald-500/5">
            <span className="font-bold text-white uppercase tracking-widest text-[10px]">Ready</span>
            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/20">{ordersByStatus.READY.length}</Badge>
          </div>
          <div className="p-6 space-y-4">
            {ordersByStatus.READY.map(ord => (
              <div key={ord.id} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-4">
                <div className="font-bold text-sm text-emerald-400 flex justify-between items-center">
                   <span>#{ord.orderNumber}</span>
                   <span>Room {ord.roomNumber}</span>
                </div>
                <Button 
                  onClick={() => updateOrderStatus(ord.id, 'DELIVERED')}
                  className="w-full h-10 text-[10px] font-black uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-900/20"
                  disabled={updatingOrder === ord.id}
                >
                  Finish & Deliver
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminPageShell>
  )
}

export default function KitchenDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent flex items-center justify-center"><PremiumSpinner size="lg" text="Loading..." /></div>}>
      <KitchenDashboardContent />
    </Suspense>
  )
}

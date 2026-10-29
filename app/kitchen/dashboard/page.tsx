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
        <button 
          type="button"
          onClick={() => router.push('/kitchen/complain')}
          className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 h-9 px-3.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Report Issue
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* New Orders */}
        <div className="bg-[#121417] border border-[#1E2227] rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#1E2227] flex justify-between items-center bg-[#141619]">
            <span className="font-semibold text-white uppercase tracking-wider text-[11px]">New Orders</span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {ordersByStatus.PENDING.length}
            </span>
          </div>
          <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar">
            {ordersByStatus.PENDING.map(ord => (
              <div key={ord.id} className="p-3.5 bg-[#181A1D] border border-[#2B3037] rounded-xl space-y-3 hover:border-zinc-500 transition-colors">
                <div className="flex justify-between items-center font-mono">
                  <span className="text-xs text-zinc-400">#{ord.orderNumber}</span>
                  <span className="text-xs font-bold text-white">Room {ord.roomNumber}</span>
                </div>
                <div className="space-y-1">
                  {ord.items.map(it => (
                    <div key={it.id} className="text-xs text-zinc-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 flex-shrink-0" />
                      <span>{it.quantity}x {it.menu.name}</span>
                    </div>
                  ))}
                </div>
                <button 
                  type="button"
                  onClick={() => updateOrderStatus(ord.id, 'CONFIRMED')}
                  className="w-full h-8 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-lg transition-all shadow-sm disabled:opacity-50"
                  disabled={updatingOrder === ord.id}
                >
                  Accept Order
                </button>
              </div>
            ))}
            {ordersByStatus.PENDING.length === 0 && (
              <div className="py-12 text-center text-zinc-500 font-mono text-xs">No pending orders</div>
            )}
          </div>
        </div>

        {/* Confirmed */}
        <div className="bg-[#121417] border border-[#1E2227] rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#1E2227] flex justify-between items-center bg-[#141619]">
            <span className="font-semibold text-white uppercase tracking-wider text-[11px]">Confirmed</span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {ordersByStatus.CONFIRMED.length}
            </span>
          </div>
          <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar">
            {ordersByStatus.CONFIRMED.map(ord => (
              <div key={ord.id} className="p-3.5 bg-[#181A1D] border border-[#2B3037] rounded-xl space-y-3 hover:border-zinc-500 transition-colors">
                <div className="flex justify-between items-center font-mono">
                  <span className="text-xs text-zinc-400">#{ord.orderNumber}</span>
                  <span className="text-xs font-bold text-white">Room {ord.roomNumber}</span>
                </div>
                <div className="space-y-1">
                  {ord.items.map(it => (
                    <div key={it.id} className="text-xs text-zinc-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                      <span>{it.quantity}x {it.menu.name}</span>
                    </div>
                  ))}
                </div>
                <button 
                  type="button"
                  onClick={() => updateOrderStatus(ord.id, 'PREPARING')}
                  className="w-full h-8 text-xs font-semibold bg-white hover:bg-zinc-200 text-black rounded-lg transition-all shadow-sm disabled:opacity-50"
                  disabled={updatingOrder === ord.id}
                >
                  Start Preparation
                </button>
              </div>
            ))}
            {ordersByStatus.CONFIRMED.length === 0 && (
              <div className="py-12 text-center text-zinc-500 font-mono text-xs">No confirmed orders</div>
            )}
          </div>
        </div>

        {/* Preparing */}
        <div className="bg-[#121417] border border-[#1E2227] rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#1E2227] flex justify-between items-center bg-[#141619]">
            <span className="font-semibold text-white uppercase tracking-wider text-[11px]">Preparing</span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
              {ordersByStatus.PREPARING.length}
            </span>
          </div>
          <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar">
            {ordersByStatus.PREPARING.map(ord => (
              <div key={ord.id} className="p-3.5 bg-[#181A1D] border border-[#2B3037] rounded-xl space-y-3 hover:border-zinc-500 transition-colors">
                <div className="font-bold text-xs text-white flex items-center justify-between font-mono">
                  <div className="flex items-center gap-1.5">
                    <ChefHat className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-zinc-400">#{ord.orderNumber}</span>
                  </div>
                  <span>Room {ord.roomNumber}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => updateOrderStatus(ord.id, 'READY')}
                  className="w-full h-8 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg transition-colors disabled:opacity-50"
                  disabled={updatingOrder === ord.id}
                >
                  Mark as Ready
                </button>
              </div>
            ))}
            {ordersByStatus.PREPARING.length === 0 && (
              <div className="py-12 text-center text-zinc-500 font-mono text-xs">No orders in preparation</div>
            )}
          </div>
        </div>

        {/* Ready */}
        <div className="bg-[#121417] border border-[#1E2227] rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#1E2227] flex justify-between items-center bg-[#141619]">
            <span className="font-semibold text-white uppercase tracking-wider text-[11px]">Ready</span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {ordersByStatus.READY.length}
            </span>
          </div>
          <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar">
            {ordersByStatus.READY.map(ord => (
              <div key={ord.id} className="p-3.5 bg-[#181A1D] border border-emerald-500/20 rounded-xl space-y-3">
                <div className="font-bold text-xs text-emerald-400 flex justify-between items-center font-mono">
                   <span>#{ord.orderNumber}</span>
                   <span>Room {ord.roomNumber}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => updateOrderStatus(ord.id, 'DELIVERED')}
                  className="w-full h-8 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors disabled:opacity-50"
                  disabled={updatingOrder === ord.id}
                >
                  Finish & Deliver
                </button>
              </div>
            ))}
            {ordersByStatus.READY.length === 0 && (
              <div className="py-12 text-center text-zinc-500 font-mono text-xs">No orders ready</div>
            )}
          </div>
        </div>
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

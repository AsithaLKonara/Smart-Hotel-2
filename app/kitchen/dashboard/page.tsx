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

function KitchenDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [kitchenData, setKitchenData] = useState<KitchenData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  const fetchKitchenData = useCallback(async () => {
    try {
      const response = await fetch('/api/kitchen/orders?today=true', { cache: 'no-store' })
      const data = await response.json()

      if (response.ok) {
        setKitchenData({
          orders: data.orders || [],
          ordersByStatus: data.ordersByStatus || {
            PENDING: [],
            CONFIRMED: [],
            PREPARING: [],
            READY: [],
            DELIVERED: []
          }
        })
      } else if (response.status === 401) {
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Failed to fetch kitchen data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (status === 'loading') return
    if (!canAccessKitchenFeatures(session)) {
      router.push('/')
      return
    }
    fetchKitchenData()
    const interval = setInterval(fetchKitchenData, 10000)
    return () => clearInterval(interval)
  }, [session, status, router, fetchKitchenData])

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
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <PremiumSpinner size="lg" text="Loading Kitchen Orders..." />
      </div>
    )
  }

  const { ordersByStatus } = kitchenData || {
    ordersByStatus: { PENDING: [], CONFIRMED: [], PREPARING: [], READY: [], DELIVERED: [] }
  }

  return (
    <div className="p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white">Kitchen Orders</h1>
          <p className="text-slate-400 text-sm mt-1">Manage real-time room service orders and preparation status.</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Button 
              variant="destructive" 
              onClick={() => router.push('/kitchen/complain')}
              className="bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white"
            >
              <AlertTriangle className="w-4 h-4 mr-2" /> Complain to Admin
            </Button>
          <Button variant="outline" onClick={fetchKitchenData} className="bg-white/5 border-white/10 text-white hover:bg-white/10">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* New Orders */}
        <Card className="bg-white/[0.02] border-white/5">
          <CardHeader className="p-4 border-b border-white/5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">New Orders</span>
              <Badge className="bg-amber-500/20 text-amber-500">{ordersByStatus.PENDING.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {ordersByStatus.PENDING.map(ord => (
              <div key={ord.id} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3">
                <div className="flex justify-between font-bold text-sm">
                  <span>#{ord.orderNumber}</span>
                  <span className="text-primary">Room {ord.roomNumber}</span>
                </div>
                <div className="text-xs text-slate-400">
                  {ord.items.map(it => <div key={it.id}>{it.quantity}x {it.menu.name}</div>)}
                </div>
                <Button 
                  onClick={() => updateOrderStatus(ord.id, 'CONFIRMED')}
                  className="w-full h-8 text-xs bg-primary hover:bg-primary/90"
                  disabled={updatingOrder === ord.id}
                >
                  Accept Order
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Confirmed */}
        <Card className="bg-white/[0.02] border-white/5">
          <CardHeader className="p-4 border-b border-white/5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">Confirmed</span>
              <Badge className="bg-blue-500/20 text-blue-500">{ordersByStatus.CONFIRMED.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {ordersByStatus.CONFIRMED.map(ord => (
              <div key={ord.id} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3">
                <div className="font-bold text-sm">#{ord.orderNumber} - Room {ord.roomNumber}</div>
                <Button 
                  onClick={() => updateOrderStatus(ord.id, 'PREPARING')}
                  className="w-full h-8 text-xs bg-indigo-500 hover:bg-indigo-600"
                  disabled={updatingOrder === ord.id}
                >
                  Start Cooking
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Preparing */}
        <Card className="bg-white/[0.02] border-white/5">
          <CardHeader className="p-4 border-b border-white/5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">Preparing</span>
              <Badge className="bg-purple-500/20 text-purple-500">{ordersByStatus.PREPARING.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {ordersByStatus.PREPARING.map(ord => (
              <div key={ord.id} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3">
                <div className="font-bold text-sm text-purple-400 flex items-center">
                  <ChefHat className="w-4 h-4 mr-2" /> #{ord.orderNumber}
                </div>
                <Button 
                  onClick={() => updateOrderStatus(ord.id, 'READY')}
                  className="w-full h-8 text-xs bg-amber-500 hover:bg-amber-600 animate-pulse"
                  disabled={updatingOrder === ord.id}
                >
                  Ready to Serve
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Ready */}
        <Card className="bg-white/[0.02] border-white/5">
          <CardHeader className="p-4 border-b border-white/5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">Ready</span>
              <Badge className="bg-emerald-500/20 text-emerald-500">{ordersByStatus.READY.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {ordersByStatus.READY.map(ord => (
              <div key={ord.id} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3">
                <div className="font-bold text-sm text-emerald-400">#{ord.orderNumber} - Room {ord.roomNumber}</div>
                <Button 
                  onClick={() => updateOrderStatus(ord.id, 'DELIVERED')}
                  className="w-full h-8 text-xs bg-emerald-500 hover:bg-emerald-600"
                  disabled={updatingOrder === ord.id}
                >
                  Mark Delivered
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function KitchenDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent flex items-center justify-center"><PremiumSpinner size="lg" text="Loading..." /></div>}>
      <KitchenDashboardContent />
    </Suspense>
  )
}

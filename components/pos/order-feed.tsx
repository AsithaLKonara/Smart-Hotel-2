'use client'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50',
  PREPARING: 'bg-blue-500/20 text-blue-500 border-blue-500/50',
  DELIVERED: 'bg-green-500/20 text-green-500 border-green-500/50',
  COMPLETED: 'bg-purple-500/20 text-purple-500 border-purple-500/50',
  CANCELLED: 'bg-red-500/20 text-red-500 border-red-500/50',
}

export default function OrderFeed({ refreshTrigger }: { refreshTrigger: number }) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = () => {
    fetch('/api/pos/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data.orders || [])
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [refreshTrigger])

  const updateStatus = async (id: string, currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      PENDING: 'PREPARING',
      PREPARING: 'DELIVERED',
      DELIVERED: 'COMPLETED'
    }
    const nextStatus = nextStatusMap[currentStatus]
    if (!nextStatus) return

    try {
      await fetch('/api/pos/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus })
      })
      fetchOrders()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Card className="flex flex-col h-full bg-[#1a1325] border-purple-500/20">
      <CardHeader className="pb-3 border-b border-gray-800">
        <CardTitle className="text-sm font-medium text-purple-100 uppercase tracking-wider flex justify-between items-center">
          <span>Today's Orders</span>
          <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded-full">{orders.length}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="text-sm text-gray-500 text-center py-4">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">No orders today</div>
        ) : (
          orders.map((order: any) => (
            <div key={order.id} className="bg-black/40 border border-gray-800 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs text-gray-400">#{order.id.slice(0,8).toUpperCase()}</div>
                  <div className="font-medium text-white text-sm">
                    {order.room ? `Room ${order.room.number}` : (order.guest?.name || 'Walk-in')}
                  </div>
                </div>
                <div 
                  className={`text-[10px] px-2 py-1 rounded-full border cursor-pointer font-bold ${STATUS_COLORS[order.status] || STATUS_COLORS.PENDING}`}
                  onClick={() => updateStatus(order.id, order.status)}
                >
                  {order.status}
                </div>
              </div>
              
              <div className="text-xs text-gray-400">
                {order.items?.map((item: any) => `${item.quantity}x ${item.product?.name || item.menuItem?.name || 'Item'}`).join(', ')}
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-800 mt-2">
                <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-sm font-mono text-purple-400 font-bold">${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

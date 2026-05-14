"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UtensilsCrossed, Clock, ChevronRight, History, Plus } from 'lucide-react'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import toast from 'react-hot-toast'

export function GuestRoomService() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/restaurant/orders')
      const data = await res.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-[#0c0c0c] border-white/5 rounded-[40px] overflow-hidden group">
      <div className="p-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-serif font-bold text-white tracking-tight">Room Service</h3>
            <p className="text-xs text-white/40 font-medium">Gourmet dining delivered to your suite</p>
          </div>
          <Link href="/order">
            <Button className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl h-12 px-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <Plus className="w-4 h-4" /> New Order
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="py-10 flex justify-center"><PremiumSpinner /></div>
        ) : orders.length === 0 ? (
          <div className="py-10 text-center space-y-4 bg-white/5 rounded-3xl border border-white/5">
            <UtensilsCrossed className="w-10 h-10 text-white/10 mx-auto" />
            <p className="text-sm text-white/30 font-light">No active orders. Hungry?</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 3).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-3xl hover:border-primary/30 transition-all group/item">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-white/5 text-white/40 group-hover/item:text-primary transition-colors">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Order #{order.id.slice(-4).toUpperCase()}</p>
                    <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">{order.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">${order.totalAmount.toFixed(2)}</p>
                  <p className="text-[9px] text-white/20 font-black uppercase tracking-tighter">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <button className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors">
              View Order History
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}

import Link from 'next/link'

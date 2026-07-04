"use client"

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Coffee, Utensils, Wine, ShoppingCart, CreditCard, Banknote, UserCheck, Search, ClipboardList, Trash2, ChevronDown, ChevronUp
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function POSTerminal() {
  const queryClient = useQueryClient()
  const [cart, setCart] = useState<{product: any, quantity: number}[]>([])
  const [checkoutMode, setCheckoutMode] = useState<string | null>(null)
  const [searchRoom, setSearchRoom] = useState('')
  const [orderHistoryItems, setOrderHistoryItems] = useState<any[]>([])
  const [showOrderHistory, setShowOrderHistory] = useState(false)
  const [orderHistoryOrderId, setOrderHistoryOrderId] = useState('')
  const [loadingOrderHistory, setLoadingOrderHistory] = useState(false)

  // Init/Fetch POS data
  const { data: outlets, isLoading: isLoadingOutlets } = useQuery({
    queryKey: ['pos-outlets'],
    queryFn: async () => {
      // Keep seed to ensure we have data
      await fetch('/api/pos/seed', { method: 'POST' })
      const getRes = await fetch('/api/admin/pos/outlets')
      const data = await getRes.json()
      return data.outlets || []
    }
  })

  // Fetch Active Bookings
  const { data: bookings } = useQuery({
    queryKey: ['active-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/bookings/active')
      return res.json()
    }
  })

  const processOrder = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/admin/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to process order')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(data.order?.paymentType === 'ROOM_CHARGE' ? 'Room Charge Posted Successfully!' : 'Order Processed Successfully!')
      setCart([])
      setCheckoutMode(null)
    },
    onError: (err: any) => {
      toast.error(err.message)
    }
  })

  if (isLoadingOutlets) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PremiumSpinner size="lg" text="Starting Terminal..." />
      </div>
    )
  }

  const outlet = outlets?.[0]
  const products = outlet?.products || []

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const tax = subtotal * 0.10
  const total = subtotal + tax

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row bg-[#050309] text-white">
      
      {/* LEFT PANE - Product Grid */}
      <div className="flex-1 p-6 flex flex-col overflow-hidden">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-serif">{outlet?.name || 'POS Terminal'}</h1>
          <p className="text-slate-400 text-sm">Touch screen to add items</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product: any) => (
              <Card 
                key={product.id} 
                className="bg-white/[0.02] border-white/5 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center text-center aspect-square">
                  {product.category === 'FOOD' ? <Utensils className="w-8 h-8 mb-4 text-orange-400" /> : <Wine className="w-8 h-8 mb-4 text-purple-400" />}
                  <h3 className="font-bold text-sm text-slate-200 line-clamp-2">{product.name}</h3>
                  <Badge variant="outline" className="mt-2 border-primary/20 text-primary">${product.price.toFixed(2)}</Badge>
                </CardContent>
              </Card>
            ))}
            
            <Card 
              className="bg-white/[0.01] border-white/5 hover:border-white/20 border-dashed cursor-pointer transition-colors"
              onClick={async () => {
                const name = prompt('Product Name (e.g. Extra Towel)')
                const price = prompt('Price (e.g. 15.00)')
                if (name && price && outlet?.id) {
                  const res = await fetch('/api/admin/pos/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ outletId: outlet.id, name, category: 'OTHER', price })
                  })
                  if (res.ok) {
                    toast.success('Product added to outlet!')
                    queryClient.invalidateQueries({ queryKey: ['pos-outlets'] })
                  }
                }
              }}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center aspect-square">
                <div className="w-8 h-8 mb-4 rounded-full bg-white/5 flex items-center justify-center text-white/50 text-xl">+</div>
                <h3 className="font-bold text-sm text-slate-400">Add Custom Item</h3>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* RIGHT PANE - Ticket / Cart */}
      <div className="w-full md:w-96 bg-[#0a0a0f] border-l border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <h2 className="text-lg font-bold flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2 text-primary" /> Current Ticket
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Ticket is empty
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono bg-white/10 px-2 py-1 rounded text-xs">{item.quantity}</span>
                    <span className="text-slate-200">{item.product.name}</span>
                  </div>
                  <span className="font-medium text-slate-300">${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/5 bg-black/40">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>Tax & Service (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10">
              <span>Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          {!checkoutMode && (
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="bg-white/5 border-white/10 h-14" 
                disabled={cart.length === 0}
                onClick={() => setCheckoutMode('DIRECT')}
              >
                <CreditCard className="w-4 h-4 mr-2" /> Direct Pay
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white h-14"
                disabled={cart.length === 0}
                onClick={() => setCheckoutMode('ROOM')}
              >
                <UserCheck className="w-4 h-4 mr-2" /> Room Charge
              </Button>
            </div>
          )}

          {checkoutMode === 'DIRECT' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20"
                  onClick={() => processOrder.mutate({
                    outletId: outlet.id,
                    items: cart.map(c => ({ productId: c.product.id, quantity: c.quantity })),
                    paymentType: 'CASH'
                  })}
                ><Banknote className="w-4 h-4 mr-2"/> Cash</Button>
                <Button variant="outline" className="border-blue-500/30 text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
                  onClick={() => processOrder.mutate({
                    outletId: outlet.id,
                    items: cart.map(c => ({ productId: c.product.id, quantity: c.quantity })),
                    paymentType: 'CARD'
                  })}
                ><CreditCard className="w-4 h-4 mr-2"/> Card</Button>
              </div>
              <Button variant="ghost" className="w-full text-slate-500" onClick={() => setCheckoutMode(null)}>Cancel</Button>
            </div>
          )}

          {checkoutMode === 'ROOM' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  placeholder="Search Room or Guest..." 
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                  value={searchRoom}
                  onChange={e => setSearchRoom(e.target.value)}
                />
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1 border border-white/5 rounded-md p-1 bg-white/[0.01]">
                {bookings?.filter((b: any) => 
                  b.roomNumber.toLowerCase().includes(searchRoom.toLowerCase()) || 
                  b.guestName.toLowerCase().includes(searchRoom.toLowerCase())
                ).map((b: any) => (
                  <div 
                    key={b.id} 
                    className="p-2 text-sm flex justify-between items-center hover:bg-white/10 rounded cursor-pointer transition-colors"
                    onClick={() => {
                      processOrder.mutate({
                        outletId: outlet.id,
                        items: cart.map(c => ({ productId: c.product.id, quantity: c.quantity })),
                        paymentType: 'ROOM_CHARGE',
                        bookingId: b.id
                      })
                    }}
                  >
                    <span className="font-bold text-primary mr-2">{b.roomNumber}</span>
                    <span className="text-slate-300 truncate">{b.guestName}</span>
                  </div>
                ))}
                {bookings?.length === 0 && <div className="p-2 text-xs text-slate-500 text-center">No active guests found.</div>}
              </div>
              <Button variant="ghost" className="w-full text-slate-500" onClick={() => setCheckoutMode(null)}>Cancel</Button>
            </div>
          )}
        </div>

        {/* Order History Panel */}
        <div className="border-t border-white/10">
          <button
            className="w-full flex items-center justify-between px-6 py-3 text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
            onClick={() => setShowOrderHistory(p => !p)}
          >
            <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4" /> View Order Items</span>
            {showOrderHistory ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          {showOrderHistory && (
            <div className="px-6 pb-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste Order ID..."
                  value={orderHistoryOrderId}
                  onChange={e => setOrderHistoryOrderId(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 text-white text-xs px-3 py-2 rounded-lg placeholder:text-slate-600 focus:outline-none"
                />
                <button
                  disabled={!orderHistoryOrderId || loadingOrderHistory}
                  onClick={async () => {
                    setLoadingOrderHistory(true)
                    try {
                      const res = await fetch(`/api/order-items?orderId=${orderHistoryOrderId}`)
                      const data = await res.json()
                      setOrderHistoryItems(Array.isArray(data) ? data : [])
                    } finally {
                      setLoadingOrderHistory(false)
                    }
                  }}
                  className="px-3 py-2 bg-primary/80 hover:bg-primary text-white text-xs rounded-lg disabled:opacity-50 transition-colors"
                >
                  Load
                </button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {orderHistoryItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-white/[0.03] border border-white/8 p-2 rounded-lg text-xs">
                    <div>
                      <p className="text-white font-semibold">{item.menuItem?.name || 'Item'}</p>
                      <p className="text-white/40">Qty: {item.quantity} · ${item.subtotal?.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={async () => {
                        const res = await fetch(`/api/order-items/${item.id}`, { method: 'DELETE' })
                        if (res.ok) {
                          toast.success('Item removed from order')
                          setOrderHistoryItems(prev => prev.filter(i => i.id !== item.id))
                        } else {
                          toast.error('Failed to remove item')
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {orderHistoryItems.length === 0 && !loadingOrderHistory && (
                  <p className="text-white/30 text-xs text-center py-3">Enter an Order ID to load its items.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

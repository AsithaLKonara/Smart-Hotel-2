'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Search, Printer, FileText, Bed, User, Plus, Minus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export default function UnifiedPOS({ role }: { role: string }) {
  const queryClient = useQueryClient()
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [posCart, setPosCart] = useState<any[]>([])
  const [searchPos, setSearchPos] = useState('')
  const [searchGuest, setSearchGuest] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  // 1. Fetch POS Products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['pos-products'],
    queryFn: async () => {
      const res = await fetch('/api/pos/products')
      if (!res.ok) throw new Error('Failed to fetch POS products')
      return res.json()
    }
  })

  // 2. Fetch Active Check-ins
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['active-checkins'],
    queryFn: async () => {
      const res = await fetch('/api/bookings?status=CHECKED_IN')
      if (!res.ok) throw new Error('Failed to fetch check-ins')
      return res.json()
    }
  })

  const INVENTORY = productsData?.products || []
  const bookings = bookingsData?.bookings || []

  // Guest Filtering
  const filteredBookings = bookings.filter((booking: any) => {
    if (!searchGuest) return true
    const term = searchGuest.toLowerCase()
    const name = booking.guest?.name?.toLowerCase() || ''
    const room = booking.roomAssignments?.[0]?.room?.number?.toLowerCase() || ''
    return name.includes(term) || room.includes(term)
  })

  // POS Logic
  const allCategories = ['All', ...Array.from(new Set<string>(INVENTORY.map((item: any) => item.category)))]
  // If kitchen role, only show food and beverage categories
  const categories = role === 'KITCHEN' 
    ? allCategories.filter((c: any) => ['All', 'Food', 'Beverage'].includes(c))
    : allCategories

  const filteredItems = INVENTORY.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchPos.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter
    const matchesRole = role === 'KITCHEN' ? ['Food', 'Beverage'].includes(item.category) : true
    return matchesSearch && matchesCategory && matchesRole
  })

  const addToCart = (product: any) => {
    const existing = posCart.find(item => item.id === product.id)
    if (existing) {
      setPosCart(posCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setPosCart([...posCart, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (id: string, delta: number) => {
    setPosCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta
        return newQ > 0 ? { ...item, quantity: newQ } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const cartSubtotal = posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  const finalTotal = cartSubtotal

  const handleChargeToRoom = async () => {
    if (!selectedBooking) return toast.error("Select a guest to charge to room")
    if (posCart.length === 0) return toast.error("Cart is empty")

    const res = await fetch('/api/pos/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: selectedBooking.id,
        cart: posCart,
        totalAmount: cartSubtotal,
        paymentType: 'ROOM_CHARGE'
      })
    });

    if (res.ok) {
      toast.success(`Charged $${cartSubtotal.toFixed(2)} to Room ${selectedBooking.roomAssignments?.[0]?.room?.number || 'TBD'}`)
      setPosCart([])
    } else {
      toast.error("Failed to charge room")
    }
  }

  const handleSettleFolio = async () => {
    if (posCart.length > 0) {
      // Settle as direct cash/card if walk-in, or add to folio if guest and then settle?
      // For simplicity, direct checkout for walkin:
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking?.id,
          cart: posCart,
          totalAmount: cartSubtotal,
          paymentType: 'CARD'
        })
      });

      if (!res.ok) {
        toast.error("Failed to process transaction")
        return;
      }
    }

    toast.success(`Bill of $${finalTotal.toFixed(2)} settled successfully.`)
    setPosCart([])
    setSelectedBooking(null)
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-[#0c0c0c] text-white print-container print:bg-white print:text-black">
      
      {/* 1. LEFT COLUMN: Active Guests */}
      <div className="w-[300px] border-r border-white/10 flex flex-col hide-on-print">
        <div className="p-4 border-b border-white/10 bg-black/20">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Bed className="w-5 h-5 text-primary" /> Active Guests
          </h2>
          <p className="text-xs text-white/50 mt-1">{filteredBookings.length} rooms checked in</p>
        </div>
        <div className="p-3 border-b border-white/10">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
            <Input 
              placeholder="Search room or guest..." 
              value={searchGuest}
              onChange={(e) => setSearchGuest(e.target.value)}
              className="pl-9 h-9 bg-white/5 border-white/10 text-white text-sm w-full"
            />
          </div>
          <Button 
            variant="outline" 
            className="w-full bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:text-primary transition-colors"
            onClick={() => setSelectedBooking(null)}
          >
            Walk-in (Clear Selection)
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
          {bookingsLoading ? (
            <div className="text-center text-white/30 text-sm mt-4">Loading guests...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center text-white/30 text-sm mt-4">No matching guests.</div>
          ) : (
            filteredBookings.map((booking: any) => {
              const assignment = booking.roomAssignments?.[0]
              const roomNumber = assignment?.room?.number || 'N/A'
              const roomTypeName = assignment?.room?.roomType?.name || 'Standard'
              
              return (
                <Card 
                  key={booking.id} 
                  className={`bg-[#1a1a1a] border ${selectedBooking?.id === booking.id ? 'border-primary' : 'border-white/10'} hover:border-primary/50 cursor-pointer transition-colors`}
                  onClick={() => setSelectedBooking(booking)}
                >
                  <CardContent className="p-4 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">{roomNumber}</span>
                      <Badge variant="outline" className="text-[10px] text-white/50 border-white/10">{roomTypeName}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <User className="w-3 h-3 text-white/40" /> {booking.guest?.name || 'Guest'}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* 2. MIDDLE COLUMN: POS Items */}
      <div className="flex-1 flex flex-col border-r border-white/10 hide-on-print">
        <div className="p-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" /> {role === 'KITCHEN' ? 'Kitchen Orders' : 'Point of Sale'}
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
              <Input 
                placeholder="Search items..." 
                value={searchPos}
                onChange={(e) => setSearchPos(e.target.value)}
                className="pl-9 h-9 bg-white/5 border-white/10 text-white text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {categories.map((cat: any) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? "default" : "outline"}
                onClick={() => setCategoryFilter(cat)}
                className={`h-8 text-xs whitespace-nowrap ${categoryFilter === cat ? 'bg-primary text-white' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item: any) => (
              <Card 
                key={item.id} 
                className="bg-[#1a1a1a] border-white/10 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => addToCart(item)}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 min-h-[120px]">
                  <span className="text-2xl">{item.category === 'Food' ? '🍔' : item.category === 'Beverage' ? '🥤' : '🛍️'}</span>
                  <p className="font-semibold text-sm leading-tight text-white/90">{item.name}</p>
                  <p className="text-primary font-bold text-sm">${item.price.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 3. RIGHT COLUMN: Cart & Folio (Printable Area) */}
      <div className="w-[380px] flex flex-col print-section bg-[#1a1a1a] print:bg-white print:text-black">
        <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Billing Details
          </h2>
          <Button variant="ghost" size="icon" onClick={handlePrintReceipt} className="hover:bg-white/10 text-white/60 hover:text-white hide-on-print">
            <Printer className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar print-content">
          
          {/* Header for Print */}
          <div className="hidden print:block text-center mb-8">
            <h1 className="text-2xl font-bold mb-1 text-black">SmartHotel</h1>
            <p className="text-sm text-gray-500 mb-4">{role === 'KITCHEN' ? 'Kitchen Order Ticket' : 'Official Tax Receipt'}</p>
            {selectedBooking ? (
              <div className="text-left text-sm border-y border-dashed border-gray-300 py-2 mb-4 text-black">
                <p><strong>Guest:</strong> {selectedBooking.guest?.name || 'Guest'}</p>
                <p><strong>Room:</strong> {selectedBooking.roomAssignments?.[0]?.room?.number || 'TBD'}</p>
                <p><strong>Date:</strong> <span suppressHydrationWarning>{new Date().toLocaleDateString()}</span></p>
              </div>
            ) : (
              <div className="text-left text-sm border-y border-dashed border-gray-300 py-2 mb-4 text-black">
                <p><strong>Walk-in Customer</strong></p>
                <p><strong>Date:</strong> <span suppressHydrationWarning>{new Date().toLocaleDateString()}</span></p>
              </div>
            )}
          </div>

          {!selectedBooking && posCart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30 hide-on-print">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <p>Select a guest or add POS items</p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Current POS Cart */}
              {posCart.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 print:text-black">New {role === 'KITCHEN' ? 'Kitchen Orders' : 'Point of Sale Items'}</h3>
                  <div className="space-y-3">
                    {posCart.map((item, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded print:bg-transparent print:p-0">
                        <div className="flex-1 pr-2">
                          <p className="text-sm text-white/90 print:text-black">{item.name}</p>
                          <p className="text-xs text-white/50 print:text-gray-500">${item.price.toFixed(2)} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium print:text-black">${(item.price * item.quantity).toFixed(2)}</span>
                          <button onClick={() => updateQuantity(item.id, -1)} className="text-white/40 hover:text-red-400 hide-on-print"><Minus className="w-3 h-3"/></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-medium print:border-gray-300 print:text-black">
                      <span>POS Subtotal</span>
                      <span>${cartSubtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Checkout Footer */}
        <div className="p-6 border-t border-white/10 bg-black/40 hide-on-print">
          <div className="flex justify-between items-center mb-6 text-xl font-bold">
            <span>Total Due</span>
            <span className="text-primary">${finalTotal.toFixed(2)}</span>
          </div>

          <div className="space-y-3">
            {selectedBooking && posCart.length > 0 && (
              <Button 
                onClick={handleChargeToRoom}
                className="w-full bg-white/10 hover:bg-white/20 text-white"
              >
                Charge to Room {selectedBooking.roomAssignments?.[0]?.room?.number || 'TBD'}
              </Button>
            )}
            
            <Button 
              disabled={finalTotal === 0}
              onClick={handleSettleFolio}
              className="w-full bg-primary hover:bg-primary/90 text-white h-12"
            >
              Pay Direct (Cash/Card)
            </Button>
          </div>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block text-center mt-8 border-t border-dashed border-gray-300 pt-4 text-black">
          <div className="flex justify-between text-lg font-bold mb-8">
            <span>Total Amount Due</span>
            <span>${finalTotal.toFixed(2)}</span>
          </div>
          <p className="text-sm text-gray-500">Thank you for staying at SmartHotel!</p>
          <p className="text-xs text-gray-400 mt-1" suppressHydrationWarning>Generated: {new Date().toLocaleString()}</p>
        </div>

      </div>
    </div>
  )
}

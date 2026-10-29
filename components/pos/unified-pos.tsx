'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ShoppingCart, Search, Printer, FileText, Bed, User, Plus, Minus, CreditCard, DollarSign, CheckCircle, Receipt, Sparkles, X, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useProperty } from '@/contexts/property-context'

export default function UnifiedPOS({ role }: { role: string }) {
  const queryClient = useQueryClient()
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'cart' | 'folio'>('cart')
  const [posCart, setPosCart] = useState<any[]>([])
  const [searchPos, setSearchPos] = useState('')
  const [searchGuest, setSearchGuest] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [showGuestSidebar, setShowGuestSidebar] = useState(false)
  const [showCartSidebar, setShowCartSidebar] = useState(false)
  const [checkoutMode, setCheckoutMode] = useState(false)

  // Settlement Form State
  const [settleAmount, setSettleAmount] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [printReceiptModal, setPrintReceiptModal] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<any>(null)
  const [confirmPaymentDialog, setConfirmPaymentDialog] = useState<{ isOpen: boolean; title: string; description: string; amount: number; action: () => void } | null>(null)
  const { activePropertyId } = useProperty()

  // 1. Fetch POS Products
  const { data: productsData } = useQuery({
    queryKey: ['pos-products', activePropertyId],
    queryFn: async () => {
      const res = await fetch('/api/pos/products', {
        headers: { 'x-property-id': activePropertyId || 'all' }
      })
      if (!res.ok) throw new Error('Failed to fetch POS products')
      return res.json()
    }
  })

  // 2. Fetch Active Check-ins (with Folio details included)
  const { data: bookingsData, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery({
    queryKey: ['active-checkins', activePropertyId],
    queryFn: async () => {
      const res = await fetch('/api/bookings?status=CHECKED_IN', {
        headers: { 'x-property-id': activePropertyId || 'all' }
      })
      if (!res.ok) throw new Error('Failed to fetch check-ins')
      return res.json()
    }
  })

  const INVENTORY = productsData?.products || []
  const bookings = bookingsData?.bookings || []

  // Auto-select folio if redirecting from checkout
  useEffect(() => {
    if (typeof window !== 'undefined' && bookings.length > 0 && !selectedBooking) {
      const params = new URLSearchParams(window.location.search)
      const bookingId = params.get('bookingId')
      const mode = params.get('mode')
      if (bookingId) {
        const b = bookings.find((bk: any) => bk.id === bookingId)
        if (b) {
          setSelectedBooking(b)
          setActiveTab('folio')
          if (mode === 'checkout') setCheckoutMode(true)
          // Clean up URL to prevent re-triggering on normal navigation
          window.history.replaceState({}, '', window.location.pathname)
        }
      }
    }
  }, [bookings, selectedBooking])

  // Keep selected booking reference updated after refetch
  const activeBooking = bookings.find((b: any) => b.id === selectedBooking?.id) || selectedBooking
  const activeFolio = activeBooking?.folios?.[0]

  const folioLineItems = activeFolio?.lineItems || []
  const folioPayments = activeFolio?.payments || []

  // Use pre-calculated values from the backend (avoids reduce() in the render loop)
  // Falls back to local calculation only for the currently active booking's detail view
  const folioTotalCharges = activeBooking?.folioTotalCharges ?? folioLineItems
    .filter((item: any) => item.category !== 'PAYMENT')
    .reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0)
  const folioTotalPayments = activeBooking?.folioTotalPayments ?? folioPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
  const folioOutstandingBalance = activeBooking?.folioBalance ?? Math.max(0, folioTotalCharges - folioTotalPayments)

  // Guest Filtering — memoized to prevent re-computation on every render
  const filteredBookings = useMemo(() => {
    if (!searchGuest) return bookings
    const term = searchGuest.toLowerCase()
    return bookings.filter((booking: any) => {
      const name = booking.guest?.name?.toLowerCase() || ''
      const room = booking.roomAssignments?.[0]?.room?.number?.toLowerCase() || ''
      return name.includes(term) || room.includes(term)
    })
  }, [bookings, searchGuest])

  // Category Filtering — memoized so Set/Array derivation only runs when INVENTORY changes
  const allCategories = useMemo(() => ['All', ...Array.from(new Set<string>(INVENTORY.map((item: any) => item.category)))], [INVENTORY])
  const categories = role === 'KITCHEN' 
    ? allCategories.filter((c: any) => ['All', 'Food', 'Beverage'].includes(c))
    : allCategories

  const filteredItems = useMemo(() => {
    return INVENTORY.filter((item: any) => {
      const matchesSearch = item.name.toLowerCase().includes(searchPos.toLowerCase())
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter
      const matchesRole = role === 'KITCHEN' ? ['Food', 'Beverage'].includes(item.category) : true
      return matchesSearch && matchesCategory && matchesRole
    })
  }, [INVENTORY, searchPos, categoryFilter, role])

  // Cart Handlers
  const addToCart = (product: any) => {
    const priceNum = Number(product.price || 0)
    const itemToAdd = { ...product, price: priceNum }
    const existing = posCart.find(item => item.id === itemToAdd.id)
    if (existing) {
      setPosCart(posCart.map(item => item.id === itemToAdd.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setPosCart([...posCart, { ...itemToAdd, quantity: 1 }])
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

  const removeFromCart = (id: string) => {
    setPosCart(prev => prev.filter(item => item.id !== id))
  }

  const cartSubtotal = posCart.reduce((sum, item) => sum + (Number(item.price || 0) * item.quantity), 0)

  // 1. Charge POS items to Guest Room Folio
  const handleChargeToRoom = async () => {
    if (!activeBooking) return toast.error("Select a guest to charge to room")
    if (posCart.length === 0) return toast.error("Cart is empty")

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-property-id': activePropertyId || 'all'
        },
        body: JSON.stringify({
          bookingId: activeBooking.id,
          folioId: activeFolio?.id,
          cart: posCart,
          totalAmount: cartSubtotal,
          paymentType: 'ROOM_CHARGE'
        })
      })

      const data = await res.json()
      if (res.ok) {
        const roomNum = activeBooking.roomAssignments?.[0]?.room?.number || 'TBD'
        toast.success(`Charged $${cartSubtotal.toFixed(2)} to Room ${roomNum}`)
        setPosCart([])
        refetchBookings()
        setActiveTab('folio')
      } else {
        toast.error(data.error || "Failed to charge room")
      }
    } catch (e: any) {
      toast.error(e.message || "Error charging room")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 2. Direct POS Checkout (Cash / Card)
  const handleDirectPOSPayment = async (method: 'CASH' | 'CARD') => {
    if (posCart.length === 0) return toast.error("Cart is empty")

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-property-id': activePropertyId || 'all'
        },
        body: JSON.stringify({
          bookingId: activeBooking?.id,
          cart: posCart,
          totalAmount: cartSubtotal,
          paymentType: method
        })
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(`POS order paid via ${method} ($${cartSubtotal.toFixed(2)})`)
        setLastTransaction({
          type: 'POS',
          method,
          amount: cartSubtotal,
          items: [...posCart],
          guestName: activeBooking?.guest?.name || 'Walk-in Customer',
          roomNumber: activeBooking?.roomAssignments?.[0]?.room?.number || 'Walk-in',
          date: new Date().toLocaleString()
        })
        setPosCart([])
        setPrintReceiptModal(true)
      } else {
        toast.error(data.error || "Failed to process transaction")
      }
    } catch (e: any) {
      toast.error(e.message || "Error processing transaction")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 3. Settle Guest Folio Balance (Cash / Card)
  const handleSettleFolioBalance = async (method: 'CASH' | 'CARD') => {
    if (!activeBooking) return toast.error("Select a guest to settle folio")
    const amountToPay = settleAmount ? Number(settleAmount) : folioOutstandingBalance

    if (amountToPay <= 0) return toast.error("No outstanding balance to pay")

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-property-id': activePropertyId || 'all'
        },
        body: JSON.stringify({
          bookingId: activeBooking.id,
          folioId: activeFolio?.id,
          settleFolioAmount: amountToPay,
          paymentType: method
        })
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(`Folio payment of $${amountToPay.toFixed(2)} recorded via ${method}!`)
        setLastTransaction({
          type: 'FOLIO_SETTLEMENT',
          method,
          amount: amountToPay,
          guestName: activeBooking.guest?.name || 'Guest',
          roomNumber: activeBooking.roomAssignments?.[0]?.room?.number || 'N/A',
          folioId: activeFolio?.id,
          remainingBalance: Math.max(0, folioOutstandingBalance - amountToPay),
          date: new Date().toLocaleString()
        })
        setSettleAmount('')
        refetchBookings()

        const newBalance = Math.max(0, folioOutstandingBalance - amountToPay)
        if (checkoutMode && newBalance === 0) {
          toast.loading("Balance settled! Finalizing checkout...", { id: 'checkout-toast' })
          try {
            const checkoutRes = await fetch(`/api/bookings/${activeBooking.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'x-property-id': activePropertyId || 'all' },
              body: JSON.stringify({ status: 'CHECKED_OUT' })
            })
            if (checkoutRes.ok) {
              toast.success("Room Checked Out Successfully!", { id: 'checkout-toast' })
              window.location.href = '/admin/receptionist?view=bookings'
              return
            } else {
              toast.error("Checkout failed. Please finalize in Reservations.", { id: 'checkout-toast' })
            }
          } catch (e) {
            toast.error("Network error during checkout.", { id: 'checkout-toast' })
          }
        }

        setPrintReceiptModal(true)
      } else {
        toast.error(data.error || "Failed to process folio settlement")
      }
    } catch (e: any) {
      toast.error(e.message || "Error processing settlement")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTriggerPrint = () => {
    window.print()
  }

  return (
    <div className="flex relative h-[calc(100vh-80px)] overflow-hidden bg-[#090A0C] text-zinc-100 print-container print:bg-white print:text-black">
      
      {/* Mobile Overlay for Guest Sidebar */}
      {showGuestSidebar && <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={() => setShowGuestSidebar(false)} />}
      
      {/* 1. LEFT COLUMN: Active Guests */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[300px] bg-[#090A0C] border-r border-[#1C2025] flex flex-col hide-on-print transition-transform duration-300 lg:static lg:translate-x-0 ${showGuestSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-[#1C2025] bg-[#090A0C] flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2 text-white">
              <Bed className="w-4 h-4 text-zinc-400" /> Active Guests
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">{filteredBookings.length} rooms checked in</p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden text-zinc-400 hover:text-white" onClick={() => setShowGuestSidebar(false)} aria-label="Close guest sidebar">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-3 border-b border-[#1C2025] space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input 
              placeholder="Search room or guest..." 
              value={searchGuest}
              onChange={(e) => setSearchGuest(e.target.value)}
              className="pl-9 h-9 bg-[#181A1D] border border-[#2B3037] text-white text-xs placeholder-zinc-500 rounded-lg w-full focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>
          <button 
            type="button"
            className="w-full bg-[#141619] hover:bg-[#1A1D21] border border-[#2B3037] text-zinc-200 text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            onClick={() => {
              setSelectedBooking(null)
              setActiveTab('cart')
            }}
          >
            Walk-in (Clear Selection)
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar">
          {bookingsLoading ? (
            <div className="text-center text-zinc-500 font-mono text-xs mt-6">Loading guests...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center text-zinc-500 font-mono text-xs mt-6">No matching guests.</div>
          ) : (
            filteredBookings.map((booking: any) => {
              const assignment = booking.roomAssignments?.[0]
              const roomNumber = assignment?.room?.number || 'N/A'
              const roomTypeName = assignment?.room?.roomType?.name || 'Standard'
              // Use the pre-calculated balance from the API — no reduce() in the render loop
              const bBalance = booking.folioBalance ?? 0
              const isSelected = activeBooking?.id === booking.id

              return (
                <div 
                  key={booking.id} 
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-[#181A1D] border-[#2B3037] shadow-sm' 
                      : 'bg-[#121417] border-[#1E2227] hover:border-zinc-600 hover:bg-[#16181B]'
                  }`}
                  onClick={() => {
                    setSelectedBooking(booking)
                    setActiveTab('folio')
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-white font-mono">Room {roomNumber}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181A1D] text-zinc-400 border border-[#2B3037]">{roomTypeName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                    <User className="w-3 h-3 text-zinc-500" /> {booking.guest?.name || 'Guest'}
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#1C2025] text-[11px]">
                    <span className="text-zinc-500">Folio Balance:</span>
                    <span className={`font-mono font-bold ${bBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      ${bBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              )
            })

          )}
        </div>
      </div>

      {/* 2. MIDDLE COLUMN: POS Catalog / Items */}
      <div className="flex-1 flex flex-col border-r border-[#1C2025] hide-on-print w-full lg:w-auto bg-[#090A0C]">
        <div className="p-4 border-b border-[#1C2025] bg-[#090A0C]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
            <div className="flex justify-between items-center w-full sm:w-auto">
              <h2 className="text-sm font-bold flex items-center gap-2 text-white">
                <ShoppingCart className="w-4 h-4 text-zinc-400" /> {role === 'KITCHEN' ? 'Kitchen Catalog' : 'POS Catalog'}
              </h2>
              <div className="flex gap-2 lg:hidden">
                <Button variant="outline" size="icon" onClick={() => setShowGuestSidebar(true)} className="bg-[#141619] border-[#2B3037] text-zinc-300" aria-label="Open guest list">
                  <Bed className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setShowCartSidebar(true)} className="bg-[#181A1D] border-[#2B3037] text-white relative" aria-label="Open cart">
                  <ShoppingCart className="w-4 h-4" />
                  {posCart.length > 0 && <span className="absolute -top-1 -right-1 bg-white text-black font-bold text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{posCart.length}</span>}
                </Button>
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input 
                placeholder="Search catalog items..." 
                value={searchPos}
                onChange={(e) => setSearchPos(e.target.value)}
                className="pl-9 h-9 bg-[#181A1D] border border-[#2B3037] text-white text-xs placeholder-zinc-500 rounded-lg w-full focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          </div>
          {/* Gradient scroll affordance */}
          <div className="relative">
            <div className="flex gap-1.5 overflow-x-auto pb-1 pr-10 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {categories.map((cat: any) => {
                const isActive = categoryFilter === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`h-8 text-xs font-medium px-3 rounded-lg whitespace-nowrap flex-shrink-0 transition-colors border ${
                      isActive 
                        ? 'bg-[#181A1D] text-white border-[#2B3037] shadow-sm font-semibold' 
                        : 'bg-[#141619] hover:bg-[#181A1D] text-zinc-400 hover:text-zinc-200 border-[#1E2227]'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-16"
              style={{ background: 'linear-gradient(to right, transparent, #090A0C)' }}
            />
          </div>

        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredItems.map((item: any) => (
              <div 
                key={item.id} 
                className="bg-[#121417] border border-[#1E2227] hover:border-zinc-600 rounded-xl overflow-hidden transition-all cursor-pointer group flex flex-col"
                onClick={() => {
                  addToCart(item)
                  setActiveTab('cart')
                }}
              >
                {((item.imageUrls && item.imageUrls.length > 0) || (item.images && item.images.length > 0)) ? (
                  <div className="w-full h-24 relative overflow-hidden bg-[#141619]">
                    <Image src={item.imageUrls?.[0] || item.images?.[0]} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="w-full h-24 flex items-center justify-center bg-[#141619] border-b border-[#1E2227]">
                    <span className="text-2xl opacity-60">{item.category === 'Food' ? '🍔' : item.category === 'Beverage' ? '🥤' : '🛍️'}</span>
                  </div>
                )}
                <div className="p-3 flex flex-col items-center justify-center text-center gap-1 bg-[#121417] flex-1">
                  <p className="font-semibold text-xs leading-tight text-white line-clamp-1">{item.name}</p>
                  <p className="text-emerald-400 font-mono font-bold text-xs">${Number(item.price || 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Overlay for Cart Sidebar */}
      {showCartSidebar && <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={() => setShowCartSidebar(false)} />}
      
      {/* 3. RIGHT COLUMN: Unified Cart & Live Folio Statement Terminal */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#090A0C] border-l border-[#1C2025] flex flex-col min-h-0 print-section print:bg-white print:text-black transition-transform duration-300 lg:static lg:translate-x-0 ${showCartSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Terminal Header Tabs */}
        <div className="p-3 border-b border-[#1C2025] bg-[#090A0C] flex justify-between items-center hide-on-print">
          <div className="flex bg-[#121417] p-1 rounded-xl border border-[#1E2227]">
            <button
              type="button"
              onClick={() => setActiveTab('cart')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                activeTab === 'cart' 
                  ? 'bg-[#181A1D] text-white border border-[#2B3037] shadow-sm font-semibold' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" /> Cart ({posCart.reduce((sum, i) => sum + i.quantity, 0)})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('folio')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${
                activeTab === 'folio' 
                  ? 'bg-[#181A1D] text-white border border-[#2B3037] shadow-sm font-semibold' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Room Folio
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Reprint Last Receipt button */}
            {lastTransaction && (
              <button
                type="button"
                onClick={() => setPrintReceiptModal(true)}
                className="hidden sm:flex items-center gap-1.5 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-[10px] font-mono font-bold px-2 h-7 transition-colors"
                title="Reprint Last Receipt"
                aria-label="Reprint last receipt"
              >
                <Receipt className="w-3 h-3" /> Reprint
              </button>
            )}
            <button 
              type="button"
              onClick={() => {
                setLastTransaction({
                  type: activeTab === 'folio' ? 'FOLIO_STATEMENT' : 'POS_CART',
                  guestName: activeBooking?.guest?.name || 'Walk-in Customer',
                  roomNumber: activeBooking?.roomAssignments?.[0]?.room?.number || 'N/A',
                  items: posCart,
                  folioTotalCharges,
                  folioTotalPayments,
                  folioOutstandingBalance,
                  date: new Date().toLocaleString()
                })
                setPrintReceiptModal(true)
              }} 
              className="p-1.5 rounded-lg bg-[#141619] hover:bg-[#1A1D21] border border-[#2B3037] text-zinc-300 hover:text-white transition-colors"
              title="Print Current View"
              aria-label="Print current view"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <Button variant="ghost" size="icon" className="lg:hidden text-zinc-400 hover:text-white" onClick={() => setShowCartSidebar(false)} aria-label="Close cart sidebar">
              <X className="w-4 h-4" />
            </Button>
          </div>

        </div>

        {/* Selected Customer Header Banner */}
        <div className="p-3.5 border-b border-[#1C2025] bg-[#121417]/40 flex justify-between items-center hide-on-print">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Selected Customer</p>
            <p className="font-bold text-xs text-white mt-0.5">
              {activeBooking ? `${activeBooking.guest?.name || 'Guest'} (Room ${activeBooking.roomAssignments?.[0]?.room?.number || 'N/A'})` : 'Walk-in Customer'}
            </p>
          </div>
          {activeBooking && (
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">
              CHECKED-IN
            </span>
          )}
        </div>

        {/* TAB 1: POS Cart View */}
        {activeTab === 'cart' && (
          <div className="flex-1 flex flex-col min-h-0 hide-on-print">
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
              {posCart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center select-none">
                  <div className="relative mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#121417] border border-[#1E2227] flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-zinc-500" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-zinc-300">POS Cart is empty</p>
                  <p className="text-[11px] text-zinc-500 mt-1 max-w-[180px] leading-relaxed">Select items from the catalog to build an order.</p>
                </div>

              ) : (
                posCart.map((item, i) => {
                  const thumb = item.imageUrls?.[0] || item.images?.[0] || null
                  const emoji = item.category === 'Food' ? '🍔' : item.category === 'Beverage' ? '🥤' : '🛍️'
                  return (
                    <div key={i} className="bg-[#121417] border border-[#1E2227] p-3 rounded-xl flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[#1E2227] bg-[#141619] flex items-center justify-center">
                        {thumb ? (
                          <Image src={thumb} alt={item.name} width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-base">{emoji}</span>
                        )}
                      </div>
                      {/* Name & Price */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                        <p className="text-[11px] text-zinc-400 font-mono">${Number(item.price || 0).toFixed(2)} each</p>
                      </div>
                      {/* Qty Controls & Subtotal */}
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <div className="flex items-center gap-1.5 bg-[#181A1D] px-2 py-1 rounded-lg border border-[#2B3037]">
                          <button type="button" onClick={() => updateQuantity(item.id, -1)} className="text-zinc-400 hover:text-white" aria-label="Decrease quantity"><Minus className="w-3 h-3"/></button>
                          <span className="text-xs font-mono font-bold px-1 text-white">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.id, 1)} className="text-zinc-400 hover:text-white" aria-label="Increase quantity"><Plus className="w-3 h-3"/></button>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 font-mono">${(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
                        <button 
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          aria-label="Remove item"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })

              )}
            </div>

            {/* Cart Footer Actions */}
            <div className="p-4 border-t border-[#1C2025] bg-[#121417] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase text-zinc-400 font-semibold tracking-wider">Cart Subtotal</span>
                <span className="text-xl font-bold font-mono text-white">${cartSubtotal.toFixed(2)}</span>
              </div>

              <div className="space-y-2">
                {activeBooking && (
                  <button 
                    type="button"
                    disabled={posCart.length === 0 || isSubmitting}
                    onClick={() => {
                      setConfirmPaymentDialog({
                        isOpen: true,
                        title: 'Charge to Room',
                        description: `Are you sure you want to charge this order to Room ${activeBooking.roomAssignments?.[0]?.room?.number || 'TBD'}?`,
                        amount: cartSubtotal,
                        action: handleChargeToRoom
                      })
                    }}
                    className="w-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs h-10 rounded-lg transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                    ) : (
                      <>Charge to Room {activeBooking.roomAssignments?.[0]?.room?.number || 'TBD'}</>
                    )}
                  </button>
                )}
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    disabled={posCart.length === 0 || isSubmitting}
                    onClick={() => {
                      setConfirmPaymentDialog({
                        isOpen: true,
                        title: 'Cash Payment',
                        description: 'Please confirm that you have received the exact cash amount.',
                        amount: cartSubtotal,
                        action: () => handleDirectPOSPayment('CASH')
                      })
                    }}
                    className="bg-[#141619] hover:bg-[#1A1D21] border border-[#2B3037] text-emerald-400 hover:text-emerald-300 text-xs font-semibold h-10 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                    ) : (
                      <><DollarSign className="w-3.5 h-3.5" /> Pay Cash</>
                    )}
                  </button>
                  <button 
                    type="button"
                    disabled={posCart.length === 0 || isSubmitting}
                    onClick={() => {
                      setConfirmPaymentDialog({
                        isOpen: true,
                        title: 'Card Payment',
                        description: 'Please confirm that the card terminal has processed the payment.',
                        amount: cartSubtotal,
                        action: () => handleDirectPOSPayment('CARD')
                      })
                    }}
                    className="bg-[#141619] hover:bg-[#1A1D21] border border-[#2B3037] text-blue-400 hover:text-blue-300 text-xs font-semibold h-10 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                    ) : (
                      <><CreditCard className="w-3.5 h-3.5" /> Pay Card</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Live Room Folio View */}
        {activeTab === 'folio' && (
          <div className="flex-1 flex flex-col min-h-0 hide-on-print">
            {!activeBooking ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
                <Bed className="w-10 h-10 mb-3 opacity-30 text-zinc-400" />
                <p className="text-xs font-bold text-zinc-300">No Room Selected</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px] leading-relaxed">Select an active checked-in guest from the left sidebar to view their live folio statement.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {checkoutMode && (
                  <div className="bg-amber-500/10 text-amber-400 border-b border-amber-500/20 px-4 py-2 flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Checkout Settlement Mode
                  </div>
                )}
                {/* Folio Summary Totals */}
                <div className="p-3 bg-[#121417] border-b border-[#1E2227] grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#141619] p-2 rounded-xl border border-[#1E2227]">
                    <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Charges</p>
                    <p className="text-xs font-bold text-white font-mono mt-0.5">${folioTotalCharges.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#141619] p-2 rounded-xl border border-[#1E2227]">
                    <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Paid</p>
                    <p className="text-xs font-bold text-emerald-400 font-mono mt-0.5">${folioTotalPayments.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#141619] p-2 rounded-xl border border-[#1E2227]">
                    <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Outstanding</p>
                    <p className="text-xs font-bold text-amber-400 font-mono mt-0.5">${folioOutstandingBalance.toFixed(2)}</p>
                  </div>
                </div>

                {/* Line Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                    <span>Itemized Folio Charges</span>
                    <span className="text-[10px] text-zinc-400 font-mono">Folio #{activeFolio?.id?.substring(0,8).toUpperCase()}</span>
                  </h3>

                  {folioLineItems.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-[#1E2227] rounded-xl text-zinc-500 text-xs font-mono">
                      No folio line items recorded yet.
                    </div>
                  ) : (
                    folioLineItems.map((item: any) => (
                      <div key={item.id} className="bg-[#121417] border border-[#1E2227] p-3 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="text-xs font-semibold text-white">{item.description}</p>
                          <span className="text-[9px] bg-[#181A1D] border border-[#2B3037] px-1.5 py-0.5 rounded text-zinc-400 uppercase font-mono mt-1 inline-block">
                            {item.category}
                          </span>
                        </div>
                        <span className={`font-mono font-bold text-xs ${Number(item.amount) < 0 ? 'text-emerald-400' : 'text-white'}`}>
                          {Number(item.amount) < 0 ? '-' : ''}${Math.abs(Number(item.amount || 0)).toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Folio Settlement Footer */}
                <div className="p-4 border-t border-[#1C2025] bg-[#121417] space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                      Payment Amount (Default: Full Balance)
                    </label>
                    <input
                      type="number"
                      placeholder={`Full Balance: $${folioOutstandingBalance.toFixed(2)}`}
                      value={settleAmount}
                      onChange={(e) => setSettleAmount(e.target.value)}
                      className="w-full bg-[#181A1D] border border-[#2B3037] text-white font-mono text-xs h-9 px-3 rounded-lg focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      disabled={folioOutstandingBalance === 0 || isSubmitting}
                      onClick={() => {
                        const amountToPay = settleAmount ? Number(settleAmount) : folioOutstandingBalance;
                        setConfirmPaymentDialog({
                          isOpen: true,
                          title: 'Settle with Cash',
                          description: 'Please confirm that you have received the cash amount to settle the folio.',
                          amount: amountToPay,
                          action: () => handleSettleFolioBalance('CASH')
                        })
                      }}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold h-10 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                      ) : (
                        <><DollarSign className="w-3.5 h-3.5" /> Pay Cash</>
                      )}
                    </button>
                    <button 
                      type="button"
                      disabled={folioOutstandingBalance === 0 || isSubmitting}
                      onClick={() => {
                        const amountToPay = settleAmount ? Number(settleAmount) : folioOutstandingBalance;
                        setConfirmPaymentDialog({
                          isOpen: true,
                          title: 'Settle with Card',
                          description: 'Please confirm that the card terminal has processed the payment.',
                          amount: amountToPay,
                          action: () => handleSettleFolioBalance('CARD')
                        })
                      }}
                      className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs h-10 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                      ) : (
                        <><CreditCard className="w-3.5 h-3.5" /> Pay Card</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* THERMAL RECEIPT PRINT MODAL */}
      <Dialog open={printReceiptModal} onOpenChange={setPrintReceiptModal}>
        <DialogContent className="bg-[#121417] border border-[#2B3037] text-zinc-100 max-w-sm rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-white">
              <Receipt className="w-4 h-4 text-emerald-400" /> Thermal Receipt Preview
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Formatted for 80mm / 58mm POS thermal printers.
            </DialogDescription>
          </DialogHeader>

          {/* Thermal Receipt Body */}
          <div className="bg-white text-black p-4 rounded-xl text-xs font-mono space-y-3 shadow-inner my-2 print-section">
            <div className="text-center border-b border-dashed border-gray-400 pb-2">
              <h1 className="text-sm font-bold uppercase tracking-wider">SmartHotel Experience Elite</h1>
              <p className="text-[10px] text-gray-600">POS & Folio Billing Statement</p>
              <p className="text-[9px] text-gray-500 mt-1">{lastTransaction?.date || new Date().toLocaleString()}</p>
            </div>

            <div className="space-y-1 text-[11px] border-b border-dashed border-gray-400 pb-2">
              <p><strong>Customer:</strong> {lastTransaction?.guestName || activeBooking?.guest?.name || 'Walk-in'}</p>
              <p><strong>Room #:</strong> {lastTransaction?.roomNumber || activeBooking?.roomAssignments?.[0]?.room?.number || 'N/A'}</p>
              {lastTransaction?.method && <p><strong>Method:</strong> {lastTransaction.method}</p>}
            </div>

            {lastTransaction?.items?.length > 0 && (
              <div className="space-y-1 border-b border-dashed border-gray-400 pb-2">
                <div className="flex justify-between font-bold text-[10px] uppercase text-gray-600">
                  <span>Item</span>
                  <span>Qty x Price</span>
                </div>
                {lastTransaction.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">{item.name}</span>
                    <span>{item.quantity}x ${Number(item.price || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1 text-right pt-1 font-bold text-[12px]">
              {lastTransaction?.amount ? (
                <div className="flex justify-between text-emerald-700">
                  <span>AMOUNT PAID:</span>
                  <span>${Number(lastTransaction.amount).toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span>OUTSTANDING BALANCE:</span>
                  <span>${folioOutstandingBalance.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="text-center pt-4 border-t border-dashed border-gray-400 text-[9px] text-gray-500">
              <p>Thank you for choosing SmartHotel!</p>
              <p className="mt-2 text-gray-400">Guest Signature: __________________</p>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <button
              type="button"
              onClick={() => setPrintReceiptModal(false)}
              className="bg-[#141619] hover:bg-[#1A1D21] border border-[#2B3037] text-zinc-300 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs px-4 py-2 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print Thermal Bill
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION DIALOG */}
      <Dialog open={!!confirmPaymentDialog?.isOpen} onOpenChange={(open) => !open && setConfirmPaymentDialog(null)}>
        <DialogContent className="bg-[#121417] border border-[#2B3037] text-zinc-100 max-w-sm rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-white">
              {confirmPaymentDialog?.title}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-1">
              {confirmPaymentDialog?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-[#141619] border border-[#1E2227] rounded-xl p-4 text-center my-4">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Amount to Charge</p>
            <p className="text-2xl font-mono text-white font-bold">${confirmPaymentDialog?.amount?.toFixed(2)}</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setConfirmPaymentDialog(null)}
              className="bg-[#141619] hover:bg-[#1A1D21] border border-[#2B3037] text-zinc-300 text-xs font-medium px-3 py-2 rounded-lg flex-1 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="button"
              disabled={isSubmitting}
              onClick={async () => {
                if (confirmPaymentDialog?.action) {
                  await confirmPaymentDialog.action()
                }
                setConfirmPaymentDialog(null)
              }} 
              className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs px-3 py-2 rounded-lg flex-1 transition-all shadow-sm flex items-center justify-center gap-1"
            >
              {isSubmitting ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
              ) : (
                <><CheckCircle className="w-3.5 h-3.5" /> Confirm</>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}


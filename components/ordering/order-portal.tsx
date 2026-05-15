"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { Plus, Minus, ShoppingCart, Check, Clock, UtensilsCrossed, Sparkles } from "lucide-react"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image?: string
  available: boolean
  preparationTime?: number
}

interface OrderPortalProps {
  roomNumber?: string
  guestInfo?: {
    name: string
    phone: string
    bookingId: string
  }
}

export function OrderPortal({ roomNumber = "101", guestInfo }: OrderPortalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/restaurant/menu')
      if (response.ok) {
        const data = await response.json()
        setMenuItems(data)
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error)
      toast.error('Failed to load menu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = (item: MenuItem) => {
    const existing = cart.find(c => c.item.id === item.id)
    if (existing) {
      setCart(cart.map(c => 
        c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ))
    } else {
      setCart([...cart, { item, quantity: 1 }])
    }
    toast.success(`Added ${item.name} to cart`, {
      style: { background: '#0c0c0c', color: '#fff', border: '1px solid #c5a059' }
    })
  }

  const handleUpdateQuantity = (itemId: string, change: number) => {
    setCart(cart.map(c => {
      if (c.item.id === itemId) {
        const newQuantity = c.quantity + change
        return newQuantity > 0 ? { ...c, quantity: newQuantity } : c
      }
      return c
    }).filter(c => c.quantity > 0))
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Your selection is empty')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/restaurant/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber,
          guestId: guestInfo?.bookingId || 'guest',
          items: cart.map(c => ({
            menuId: c.item.id,
            quantity: c.quantity,
            unitPrice: c.item.price
          })),
          specialRequests: ''
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Your order has been dispatched to the kitchen.', {
          icon: '👨‍🍳',
          style: { background: '#0c0c0c', color: '#fff', border: '1px solid #c5a059' }
        })
        setCart([])
        if (data.order?.id) {
          router.push(`/dashboard/dining/tracking/${data.order.id}`)
        }
      } else {
        toast.error('Failed to place order')
      }
    } catch (error) {
      console.error('Failed to place order:', error)
      toast.error('Service interruption. Please contact concierge.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))]
  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory)

  const cartTotal = cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0)

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Menu Section */}
        <div className="lg:col-span-8 space-y-12">
          {/* Category Filter */}
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar" role="group" aria-label="Menu category filters">
            {categories.map(category => {
              const isSelected = selectedCategory === category
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                    isSelected
                      ? 'bg-primary/20 text-primary border-primary/30 shadow-luxury'
                      : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'
                  }`}
                >
                  {category}
                </button>
              )
            })}
          </div>

          {/* Menu Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <Card key={i} className="h-64 bg-white/5 border-white/5 animate-pulse rounded-[40px]" />
                ))
              ) : filteredItems.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white/5 rounded-[40px] border border-white/5">
                  <UtensilsCrossed className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/30 font-serif italic text-lg">No culinary items found in this collection.</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={item.id}
                  >
                    <Card className="bg-[#0c0c0c] border-white/5 rounded-[40px] overflow-hidden group hover:border-primary/30 transition-all duration-500 h-full flex flex-col shadow-2xl">
                      {item.image && (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-transparent to-transparent" />
                          <Badge className="absolute top-6 left-6 bg-black/60 backdrop-blur-md border-white/10 text-[8px] font-black uppercase tracking-widest px-3 py-1">
                            {item.category}
                          </Badge>
                        </div>
                      )}
                      <div className="p-8 flex-1 flex flex-col">
                        <div className="flex-1 space-y-3">
                          <h3 className="text-xl font-serif font-bold text-white tracking-tight">{item.name}</h3>
                          <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{item.description}</p>
                          {item.preparationTime && (
                            <div className="flex items-center gap-2 text-white/20">
                              <Clock className="w-3 h-3" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">{item.preparationTime} min Prep</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-8 flex items-center justify-between">
                          <span className="text-2xl font-serif font-bold text-primary">${item.price.toFixed(2)}</span>
                          <Button
                            onClick={() => handleAddToCart(item)}
                            disabled={!item.available}
                            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl h-12 px-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                          >
                            <Plus className="w-4 h-4" /> Add to Suite
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-4">
          <div className="sticky top-24">
            <Card className="bg-[#0c0c0c] border-white/5 rounded-[40px] p-10 space-y-8 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Your Selection</p>
                  <h2 className="text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
                    Room Order <Sparkles className="w-5 h-5 text-primary" />
                  </h2>
                </div>
                <Badge variant="outline" className="text-primary border-primary/20 h-8 px-4 rounded-full font-bold">
                  {cart.length}
                </Badge>
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center space-y-4 bg-white/5 rounded-3xl border border-white/5">
                  <ShoppingCart className="w-10 h-10 text-white/10 mx-auto" />
                  <p className="text-sm text-white/30 font-light">Your palette is currently empty.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {cart.map(({ item, quantity }) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl group/cart transition-colors hover:border-white/10">
                        <div className="flex-1">
                          <p className="font-bold text-sm text-white">{item.name}</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">${item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1.5 border border-white/5">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg hover:bg-white/10 text-white/60 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-xs text-white">{quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg hover:bg-white/10 text-white/60 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 border-t border-white/5 pt-8">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white/40">Subtotal Service</span>
                      <span className="font-bold text-white font-serif">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-serif font-bold text-white">Grand Total</span>
                      <span className="text-3xl font-serif font-bold text-primary">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={isSubmitting}
                    className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-luxury transition-all active:scale-95"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-3">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                          <UtensilsCrossed className="w-4 h-4" />
                        </motion.div>
                        Dispatching Order...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Check className="w-4 h-4" /> Finalize Room Order
                      </div>
                    )}
                  </Button>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

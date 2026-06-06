'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, Hotel } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface POSItem {
  id: string
  name: string
  category: string
  price: number
  image?: string
}

interface CartItem extends POSItem {
  quantity: number
}

// Mock Data
const INVENTORY: POSItem[] = [
  { id: '1', name: 'Burger & Fries', category: 'Food', price: 15.00 },
  { id: '2', name: 'Club Sandwich', category: 'Food', price: 12.00 },
  { id: '3', name: 'Margherita Pizza', category: 'Food', price: 18.00 },
  { id: '4', name: 'Caesar Salad', category: 'Food', price: 10.00 },
  { id: '5', name: 'Coca Cola', category: 'Beverage', price: 3.00 },
  { id: '6', name: 'Orange Juice', category: 'Beverage', price: 5.00 },
  { id: '7', name: 'Local Beer', category: 'Beverage', price: 6.00 },
  { id: '8', name: 'Hotel Slippers', category: 'Merchandise', price: 10.00 },
  { id: '9', name: 'Spa Day Pass', category: 'Service', price: 50.00 },
]

export default function POSSystem({ role }: { role: string }) {
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('All')

  const categories = ['All', ...Array.from(new Set(INVENTORY.map(item => item.category)))]

  const filteredItems = INVENTORY.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter
    // If kitchen role, only show food and beverage
    const matchesRole = role === 'KITCHEN' ? ['Food', 'Beverage'].includes(item.category) : true
    return matchesSearch && matchesCategory && matchesRole
  })

  const addToCart = (item: POSItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta
        return newQ > 0 ? { ...item, quantity: newQ } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal + tax

  const handleCheckout = (method: string) => {
    if (cart.length === 0) return
    
    // In a real app, we would make an API call here to save the order
    toast({
      title: "Order Processed",
      description: `Payment of $${total.toFixed(2)} processed via ${method}`,
    })
    
    setCart([])
  }

  return (
    <div className="flex h-[calc(100vh-80px)] gap-6 p-6">
      {/* Items Section */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-white/50" />
            <Input 
              placeholder="Search items..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {categories.map(cat => (
              // Filter out non-food categories for kitchen
              (role === 'KITCHEN' && !['All', 'Food', 'Beverage'].includes(cat)) ? null : (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? "default" : "outline"}
                  onClick={() => setCategoryFilter(cat)}
                  className={`whitespace-nowrap ${categoryFilter === cat ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'}`}
                >
                  {cat}
                </Button>
              )
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pb-20">
          {filteredItems.map(item => (
            <Card 
              key={item.id} 
              className="bg-[#1a1a1a] border-white/10 hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => addToCart(item)}
            >
              <CardContent className="p-4 flex flex-col h-full justify-between items-center text-center gap-2">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <span className="text-2xl">{item.category === 'Food' ? '🍔' : item.category === 'Beverage' ? '🥤' : '🛍️'}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white/90 leading-tight">{item.name}</h3>
                  <p className="text-xs text-white/50">{item.category}</p>
                </div>
                <div className="font-bold text-primary mt-2">${item.price.toFixed(2)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <Card className="w-96 bg-[#1a1a1a] border-white/10 flex flex-col h-full shadow-2xl">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Current Order
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/30 h-full">
              <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-sm font-semibold text-white/90 truncate">{item.name}</h4>
                  <div className="text-xs text-primary">${item.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-white/70">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm text-white w-4 text-center font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-white/70">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </CardContent>

        <div className="p-4 border-t border-white/10 bg-black/20 mt-auto">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-white/60">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-white/60">
              <span>Tax (10%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10 mt-2">
              <span>Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button 
              disabled={cart.length === 0} 
              className="bg-white/10 hover:bg-white/20 text-white"
              onClick={() => handleCheckout('Room Charge')}
            >
              <Hotel className="w-4 h-4 mr-2" />
              Room
            </Button>
            <Button 
              disabled={cart.length === 0}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-luxury"
              onClick={() => handleCheckout('Card')}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Card
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

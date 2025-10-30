"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { Plus, Minus, ShoppingCart, Check } from "lucide-react"
import toast from "react-hot-toast"

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
    toast.success(`Added ${item.name} to cart`)
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

  const handleRemoveItem = (itemId: string) => {
    setCart(cart.filter(c => c.item.id !== itemId))
    toast.success('Item removed from cart')
  }

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
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
        toast.success('Order placed successfully!')
        setCart([])
      } else {
        toast.error('Failed to place order')
      }
    } catch (error) {
      console.error('Failed to place order:', error)
      toast.error('Failed to place order')
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {guestInfo && (
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h2 className="text-lg font-semibold text-amber-900 mb-2">
              Welcome, {guestInfo.name}!
            </h2>
            <p className="text-amber-700">
              Room: {roomNumber} • Booking: {guestInfo.bookingId}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Restaurant Menu</h1>
            
            {/* Category Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Menu Items */}
            <div className="space-y-4">
              {isLoading ? (
                <p>Loading menu...</p>
              ) : filteredItems.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No items in this category</p>
              ) : (
                filteredItems.map(item => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start gap-4">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">{item.category}</Badge>
                              {item.preparationTime && (
                                <span className="text-xs text-gray-500">~{item.preparationTime} mins</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-amber-600">${item.price.toFixed(2)}</p>
                            <Button
                              onClick={() => handleAddToCart(item)}
                              disabled={!item.available}
                              size="sm"
                              className="mt-2"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="w-5 h-5" />
                  <h2 className="text-xl font-bold">Your Order</h2>
                </div>

                {cart.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {cart.map(({ item, quantity }) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-gray-600">${item.price.toFixed(2)} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, -1)}
                              className="w-6 h-6 flex items-center justify-center bg-white rounded border hover:bg-gray-100"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-medium">{quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, 1)}
                              className="w-6 h-6 flex items-center justify-center bg-white rounded border hover:bg-gray-100"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-bold">${cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold text-amber-600">${cartTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? 'Placing Order...' : 'Place Order'}
                      <Check className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

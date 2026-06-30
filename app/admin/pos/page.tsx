'use client'

import { useState, useEffect } from 'react'
import RoomSelector from '@/components/pos/room-selector'
import ProductGrid from '@/components/pos/product-grid'
import CartPanel from '@/components/pos/cart-panel'
import OrderFeed from '@/components/pos/order-feed'

export default function POSPage() {
  const [selectedRoom, setSelectedRoom] = useState<any>(null)
  const [cart, setCart] = useState<any[]>([])
  const [orderType, setOrderType] = useState('KITCHEN') // Default category
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleAddToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { ...product, productId: product.id, quantity: 1, name: product.name, price: product.price }]
    })
  }

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const handleCheckoutSuccess = () => {
    setCart([])
    setSelectedRoom(null)
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="flex h-screen bg-[#0e0918] text-white overflow-hidden p-4 gap-4">
      {/* Left Panel: Room & Cart */}
      <div className="flex flex-col w-1/4 min-w-[300px] gap-4">
        <RoomSelector selectedRoom={selectedRoom} onSelectRoom={setSelectedRoom} />
        <CartPanel 
          cart={cart} 
          onUpdateQuantity={handleUpdateQuantity} 
          selectedRoom={selectedRoom}
          orderType={orderType}
          onSuccess={handleCheckoutSuccess}
        />
      </div>

      {/* Center Panel: Products Grid */}
      <div className="flex flex-col flex-1 gap-4 overflow-hidden">
        <ProductGrid 
          orderType={orderType} 
          setOrderType={setOrderType} 
          onAddToCart={handleAddToCart} 
        />
      </div>

      {/* Right Panel: Active Orders & Receipts */}
      <div className="flex flex-col w-1/4 min-w-[300px] gap-4">
        <OrderFeed refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
}

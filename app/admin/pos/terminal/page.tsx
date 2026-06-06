'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Coffee, Search, ShoppingCart, CheckCircle, Store } from 'lucide-react'

export default function POSTerminal() {
  const [outlets, setOutlets] = useState([])
  const [selectedOutlet, setSelectedOutlet] = useState<any>(null)
  const [cart, setCart] = useState<any[]>([])
  
  // Checkout State
  const [paymentType, setPaymentType] = useState('CASH')
  const [roomNumber, setRoomNumber] = useState('')
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/pos/outlets')
      .then(res => res.json())
      .then(data => {
        if (data.outlets) {
          setOutlets(data.outlets)
          if (data.outlets.length > 0) setSelectedOutlet(data.outlets[0])
        }
      })
  }, [])

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)

  const handleCheckout = () => {
    setCheckoutStatus('processing')
    const items = cart.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price }))
    
    fetch('/api/admin/pos/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outletId: selectedOutlet.id,
        items,
        paymentType,
        roomNumber: paymentType === 'ROOM_CHARGE' ? roomNumber : undefined
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setCart([])
        setCheckoutStatus('success')
        setTimeout(() => setCheckoutStatus(null), 3000)
      } else {
        alert(data.error || 'Checkout failed')
        setCheckoutStatus(null)
      }
    })
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      {/* Left side: Products */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" /> Enterprise POS
          </h1>
          
          <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-xl border border-white/10">
            {outlets.map((outlet: any) => (
              <button 
                key={outlet.id} 
                onClick={() => setSelectedOutlet(outlet)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${selectedOutlet?.id === outlet.id ? 'bg-primary text-white' : 'text-white/60 hover:text-white'}`}
              >
                {outlet.name}
              </button>
            ))}
          </div>
        </div>

        {selectedOutlet && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedOutlet.products.map((product: any) => (
              <Card 
                key={product.id} 
                className="bg-[#1a1a1a] border-white/10 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => addToCart(product)}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center text-center min-h-[120px]">
                  <Coffee className="w-8 h-8 text-white/20 mb-2" />
                  <p className="font-bold text-white text-sm leading-tight mb-1">{product.name}</p>
                  <p className="text-primary font-bold">${product.price.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Right side: Cart */}
      <div className="w-[380px] bg-[#1a1a1a] border-l border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Current Order
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center group">
              <div>
                <p className="text-white font-medium text-sm">{item.name}</p>
                <p className="text-white/50 text-xs">${item.price.toFixed(2)} x {item.quantity}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                <button onClick={() => removeFromCart(item.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">Remove</button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="text-center text-white/40 mt-10">Cart is empty</div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="flex justify-between items-center mb-4">
            <span className="text-white/60">Total</span>
            <span className="text-2xl font-bold text-white">${total.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {['CASH', 'CARD', 'ROOM_CHARGE'].map(type => (
              <button 
                key={type}
                onClick={() => setPaymentType(type)}
                className={`py-2 text-xs rounded border transition-colors ${paymentType === type ? 'bg-primary/20 border-primary text-primary' : 'border-white/10 text-white/50 hover:bg-white/5'}`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          {paymentType === 'ROOM_CHARGE' && (
            <Input 
              placeholder="Enter Room Number..." 
              value={roomNumber} 
              onChange={e => setRoomNumber(e.target.value)}
              className="bg-white/5 border-white/10 text-white mb-4"
            />
          )}

          <Button 
            className="w-full h-12 bg-primary text-white font-bold" 
            disabled={cart.length === 0 || checkoutStatus === 'processing' || (paymentType === 'ROOM_CHARGE' && !roomNumber)}
            onClick={handleCheckout}
          >
            {checkoutStatus === 'processing' ? 'Processing...' : checkoutStatus === 'success' ? <><CheckCircle className="w-5 h-5 mr-2" /> Order Complete</> : `Charge $${total.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  )
}

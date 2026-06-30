'use client'
import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Minus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ThermalReceipt from './thermal-receipt'

export default function CartPanel({ cart, onUpdateQuantity, selectedRoom, orderType, onSuccess }: any) {
  const [paymentMethod, setPaymentMethod] = useState('ROOM_CHARGE')
  const [loading, setLoading] = useState(false)
  const [lastOrder, setLastOrder] = useState<any>(null)
  const subtotal = cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.10 // 10% tax
  const total = subtotal + tax

  const handleCharge = async () => {
    if (cart.length === 0) return
    if (paymentMethod === 'ROOM_CHARGE' && !selectedRoom?.folioId) {
      toast.error("Selected room does not have an open folio.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom?.id,
          bookingId: selectedRoom?.bookingId,
          folioId: selectedRoom?.folioId,
          guestId: selectedRoom?.guestId,
          orderType,
          paymentType: paymentMethod,
          items: cart,
          cashierName: 'System Admin' // In real app, get from session
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to checkout')

      toast.success("Order placed successfully!")
      setLastOrder({ ...data.order, room: selectedRoom, items: cart, subtotal, tax, total, paymentMethod, cashierName: 'System Admin' })
      onSuccess()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex flex-col flex-1 bg-[#1a1325] border-purple-500/20">
      <CardHeader className="pb-3 border-b border-gray-800">
        <CardTitle className="text-sm font-medium text-purple-100 uppercase tracking-wider flex justify-between">
          <span>Current Order</span>
          <span className="text-purple-400">{cart.length} items</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8">Cart is empty</div>
        ) : (
          cart.map((item: any) => (
            <div key={item.productId} className="flex justify-between items-center group">
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{item.name}</div>
                <div className="text-xs text-purple-400 font-mono">${item.price.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2 bg-black/50 rounded-lg p-1 border border-gray-800">
                <button onClick={() => onUpdateQuantity(item.productId, -1)} className="p-1 hover:text-purple-400 text-gray-400">
                  {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                </button>
                <span className="text-sm w-6 text-center font-medium">{item.quantity}</span>
                <button onClick={() => onUpdateQuantity(item.productId, 1)} className="p-1 hover:text-purple-400 text-gray-400">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4 border-t border-gray-800 pt-4 pb-4">
        <div className="w-full space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Subtotal</span>
            <span className="font-mono">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Tax (10%)</span>
            <span className="font-mono">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-gray-800">
            <span>Total</span>
            <span className="font-mono text-purple-400">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="w-full grid grid-cols-3 gap-2">
          {['ROOM_CHARGE', 'CASH', 'CARD'].map(method => (
            <button
              key={method}
              onClick={() => setPaymentMethod(method)}
              className={`text-xs py-2 rounded font-medium transition-colors border ${
                paymentMethod === method 
                  ? 'bg-purple-600 border-purple-500 text-white' 
                  : 'bg-black/50 border-gray-800 text-gray-400 hover:border-gray-600'
              }`}
            >
              {method.replace('_', ' ')}
            </button>
          ))}
        </div>

        <Button 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 text-lg disabled:opacity-50"
          disabled={cart.length === 0 || loading || (paymentMethod === 'ROOM_CHARGE' && !selectedRoom)}
          onClick={handleCharge}
        >
          {loading ? 'Processing...' : `Charge $${total.toFixed(2)}`}
        </Button>
      </CardFooter>

      {/* Hidden thermal receipt that gets printed */}
      {lastOrder && (
        <div className="hidden print:block">
          <ThermalReceipt order={lastOrder} />
        </div>
      )}
    </Card>
  )
}

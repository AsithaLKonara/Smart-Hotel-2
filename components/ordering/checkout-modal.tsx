"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, Smartphone, Wallet, CheckCircle, Lock, Shield } from "lucide-react"
import { PremiumButton } from "../ui/premium-button"
import { cn } from "@/lib/utils"

interface CartItem {
  menuItem: {
    id: string
    name: string
    description: string
    price: number
  }
  quantity: number
  specialRequests?: string
  unitPrice: number
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  roomNumber: string
  guestName: string
  onOrderComplete: (orderData: any) => void
}

const paymentMethods = [
  {
    id: 'room_charge',
    name: 'Room Charge',
    description: 'Add to your room bill',
    icon: Wallet,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    available: true
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Visa, Mastercard, American Express',
    icon: CreditCard,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    available: true
  },
  {
    id: 'digital_wallet',
    name: 'Digital Wallet',
    description: 'Apple Pay, Google Pay, PayPal',
    icon: Smartphone,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    available: true
  },
  {
    id: 'lanakqr',
    name: 'LANKAQR',
    description: 'Sri Lankan QR payment system',
    icon: Smartphone,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    available: true
  },
  {
    id: 'payhere',
    name: 'PayHere',
    description: 'Sri Lankan payment gateway',
    icon: CreditCard,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    available: true
  }
]

export function CheckoutModal({ 
  isOpen, 
  onClose, 
  cart, 
  roomNumber, 
  guestName, 
  onOrderComplete 
}: CheckoutModalProps) {
  const [selectedPayment, setSelectedPayment] = useState('room_charge')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  const serviceCharge = subtotal * 0.1 // 10% service charge
  const tax = subtotal * 0.05 // 5% tax
  const total = subtotal + serviceCharge + tax

  const handlePlaceOrder = async () => {
    setIsProcessing(true)
    
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const orderData = {
      id: 'ORD' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      roomNumber,
      guestName,
      items: cart,
      totalAmount: total,
      paymentMethod: selectedPayment,
      specialInstructions,
      status: 'PENDING',
      createdAt: new Date()
    }
    
    setShowSuccess(true)
    
    setTimeout(() => {
      onOrderComplete(orderData)
      onClose()
      setShowSuccess(false)
      setIsProcessing(false)
    }, 2000)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Room {roomNumber} • {guestName}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {showSuccess ? (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                  className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h3>
                <p className="text-gray-600">Your order has been sent to our kitchen</p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 text-sm text-gray-500"
                >
                  Estimated delivery: 25-30 minutes
                </motion.div>
              </motion.div>
            ) : (
              <>
                {/* Order Summary */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    {cart.map((item, index) => (
                      <motion.div
                        key={item.menuItem.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex justify-between items-center py-2"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.menuItem.name}</div>
                          <div className="text-sm text-gray-500">× {item.quantity}</div>
                        </div>
                        <div className="font-medium text-gray-900">
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Service Charge (10%)</span>
                      <span>${serviceCharge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax (5%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t border-gray-100 pt-2">
                      <span>Total</span>
                      <span className="text-amber-600">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Payment Method</h3>
                  <div className="space-y-3">
                    {paymentMethods.map((method, index) => (
                      <motion.button
                        key={method.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedPayment(method.id)}
                        disabled={!method.available}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 transition-all text-left",
                          selectedPayment === method.id
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-200 hover:border-amber-300 bg-white",
                          !method.available && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", method.bgColor)}>
                            <method.icon className={cn("w-5 h-5", method.color)} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{method.name}</div>
                            <div className="text-sm text-gray-500">{method.description}</div>
                          </div>
                          {selectedPayment === method.id && (
                            <CheckCircle className="w-5 h-5 text-amber-600" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Special Instructions</h3>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Any special requests or delivery instructions..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                {/* Security Badge */}
                <div className="flex items-center gap-2 mb-6 p-3 bg-green-50 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div className="text-sm text-green-800">
                    <div className="font-medium">Secure Payment</div>
                    <div>Your payment information is encrypted and secure</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!showSuccess && (
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {selectedPayment === 'room_charge' 
                    ? 'This will be added to your room bill'
                    : 'Your payment will be processed securely'
                  }
                </span>
              </div>
              
              <PremiumButton
                onClick={handlePlaceOrder}
                loading={isProcessing}
                disabled={cart.length === 0}
                variant="primary"
                size="lg"
                className="w-full"
                icon={<CheckCircle className="w-5 h-5" />}
              >
                {isProcessing ? 'Processing...' : `Place Order • $${total.toFixed(2)}`}
              </PremiumButton>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}


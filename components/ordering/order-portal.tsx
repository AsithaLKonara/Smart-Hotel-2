"use client"

import { useState } from "react"

interface OrderPortalProps {
  roomNumber?: string
  guestInfo?: {
    name: string
    phone: string
    bookingId: string
  }
}

export function OrderPortal({ roomNumber = "101", guestInfo }: OrderPortalProps) {
  const [cart, setCart] = useState<any[]>([])

  const handleAddToCart = (item: any, quantity: number) => {
    console.log('Adding to cart:', item, quantity)
  }

  const handleRemoveItem = (itemId: string) => {
    console.log('Removing item:', itemId)
  }

  const handleCheckout = () => {
    console.log('Checking out:', cart)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            QR Menu & Ordering
          </h1>
          
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

          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Menu Coming Soon
            </h3>
            <p className="text-gray-600">
              Our digital menu and ordering system is being prepared.
            </p>
            {cart.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Cart items: {cart.length}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

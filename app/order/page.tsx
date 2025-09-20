"use client"

import { OrderPortal } from '@/components/ordering/order-portal'

export default function OrderPage() {
  // In a real app, these would come from QR code params or URL params
  const roomNumber = '101'
  const guestInfo = {
    name: 'John Smith',
    phone: '+1-555-0123',
    bookingId: 'BK123456789'
  }

  const handleOrderSubmit = (orderData: any) => {
    console.log('Order submitted:', orderData)
    // In a real app, this would send the order to the kitchen
  }

  const handleOrderUpdate = (orderId: string, status: string) => {
    console.log(`Order ${orderId} updated to ${status}`)
    // In a real app, this would update the order status
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OrderPortal
        roomNumber={roomNumber}
        guestInfo={guestInfo}
      />
    </div>
  )
}

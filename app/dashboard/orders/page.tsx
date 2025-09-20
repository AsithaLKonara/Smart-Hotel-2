"use client"

import { LiveOrderFeed } from '@/components/dashboard/live-order-feed'

export default function LiveOrderFeedPage() {
  const handleOrderClick = (orderId: string) => {
    console.log(`Order clicked: ${orderId}`)
    // Navigate to order details or open modal
    window.location.href = `/admin/orders/${orderId}`
  }

  const handleStatusUpdate = (orderId: string, status: string) => {
    console.log(`Order ${orderId} status updated to: ${status}`)
    // In a real app, this would send an API request to update the order status
    // and trigger real-time updates via WebSocket
  }

  return (
    <LiveOrderFeed
      onOrderClick={handleOrderClick}
      onStatusUpdate={handleStatusUpdate}
      autoRefresh={true}
      refreshInterval={5000}
    />
  )
}


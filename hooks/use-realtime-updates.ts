"use client"

import { useEffect, useState } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { useSession } from 'next-auth/react'

export function useRealtimeUpdates() {
  const { socket, isConnected } = useSocket()
  const { data: session } = useSession()
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    if (!socket || !isConnected) return

    // Join admin room if user is admin
    if (session?.user && ['MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'].includes(session.user.role)) {
      socket.emit('joinAdminRoom')
    }

    // Listen for booking updates
    socket.on('bookingCreated', (booking: any) => {
      setLastUpdate(new Date())
      console.log('New booking created:', booking)
      // Trigger UI update or notification
    })

    socket.on('bookingUpdated', (booking: any) => {
      setLastUpdate(new Date())
      console.log('Booking updated:', booking)
    })

    socket.on('orderStatusUpdated', (order: any) => {
      setLastUpdate(new Date())
      console.log('Order status updated:', order)
    })

    socket.on('orderReady', (order: any) => {
      setLastUpdate(new Date())
      console.log('Order ready:', order)
      // Show notification
    })

    socket.on('notificationReceived', (notification: any) => {
      setLastUpdate(new Date())
      console.log('Notification received:', notification)
    })

    return () => {
      if (session?.user && ['MANAGER', 'SUPER_ADMIN', 'RECEPTIONIST'].includes(session.user.role)) {
        socket.emit('leaveAdminRoom')
      }
      socket.off('bookingCreated')
      socket.off('bookingUpdated')
      socket.off('orderStatusUpdated')
      socket.off('orderReady')
      socket.off('notificationReceived')
    }
  }, [socket, isConnected, session])

  return {
    isConnected,
    lastUpdate,
  }
}


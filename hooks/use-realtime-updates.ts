"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { getPusherClient } from '@/lib/pusher-client'
import { 
  BookingEventSchema, 
  RoomEventSchema, 
  KitchenOrderEventSchema, 
  TaskEventSchema 
} from '@/types/realtime'

/**
 * Enterprise Real-time Cache Orchestrator
 * Listens to Pusher events and invalidates TanStack Query caches to keep the UI synchronized.
 */
export function useRealtimeUpdates() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // 1. Get Shared Pusher Client
    const pusher = getPusherClient()

    pusher.connection.bind('connected', () => setIsConnected(true))
    pusher.connection.bind('disconnected', () => setIsConnected(false))

    // 2. Subscribe to Global & Role-based Channels
    const globalChannel = pusher.subscribe('global')
    const adminChannel = pusher.subscribe('admin')
    const opsChannel = pusher.subscribe('ops-center')

    // 3. Define Invalidation Logic
    const triggerUpdate = (keys: string[][], entityId?: string) => {
      setLastUpdate(new Date())
      keys.forEach(key => {
        if (entityId) {
          // Invalidate specific entity if ID is provided
          queryClient.invalidateQueries({ queryKey: [...key, entityId] })
        }
        // Always invalidate the main collection to ensure consistency
        queryClient.invalidateQueries({ queryKey: key })
      })
    }

    // --- EVENT BINDINGS WITH SCHEMA VALIDATION ---

    // A. Booking Events
    globalChannel.bind('booking.created', (data: any) => {
      const result = BookingEventSchema.safeParse(data)
      if (result.success) triggerUpdate([['bookings'], ['rooms'], ['availability']])
    })

    adminChannel.bind('booking.updated', (data: any) => {
      const result = BookingEventSchema.safeParse(data)
      if (result.success) triggerUpdate([['bookings'], ['rooms']], result.data.bookingId)
    })

    // B. Room & Inventory
    globalChannel.bind('room.status_changed', (data: any) => {
      const result = RoomEventSchema.safeParse(data)
      if (result.success) triggerUpdate([['rooms'], ['tasks']], result.data.roomId)
    })

    globalChannel.bind('inventory.availability_updated', (data: any) => {
      const result = RoomEventSchema.safeParse(data)
      if (result.success) triggerUpdate([['availability']])
    })

    // C. Kitchen & Dining (Ops Center)
    opsChannel.bind('KITCHEN_ORDER_NEW', (data: any) => {
      const result = KitchenOrderEventSchema.safeParse(data)
      if (result.success) triggerUpdate([['restaurant', 'orders']])
    })

    opsChannel.bind('KITCHEN_ORDER_UPDATE', (data: any) => {
      const result = KitchenOrderEventSchema.safeParse(data)
      if (result.success) triggerUpdate([['restaurant', 'orders']], result.data.orderId)
    })

    // D. Staff & Tasks
    adminChannel.bind('task.updated', (data: any) => {
      const result = TaskEventSchema.safeParse(data)
      if (result.success) triggerUpdate([['tasks']], result.data.taskId)
    })

    // E. User-specific Channel (if logged in)
    let userChannel: any = null
    if (session?.user?.id) {
      userChannel = pusher.subscribe(`user-${session.user.id}`)
      userChannel.bind('notification.received', () => triggerUpdate([['notifications']]))
      
      if (session.user.role !== 'GUEST') {
        const staffChannel = pusher.subscribe(`staff-${session.user.id}`)
        staffChannel.bind('task.assigned', (data: any) => {
          const result = TaskEventSchema.safeParse(data)
          if (result.success) triggerUpdate([['tasks']], result.data.taskId)
        })
      }
    }

    // 4. Cleanup on Unmount
    return () => {
      globalChannel.unbind_all()
      adminChannel.unbind_all()
      opsChannel.unbind_all()
      if (userChannel) userChannel.unbind_all()
      pusher.disconnect()
    }
  }, [session, queryClient])

  return {
    isConnected,
    lastUpdate,
  }
}


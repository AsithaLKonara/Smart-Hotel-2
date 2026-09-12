'use client'

import { useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { useProperty } from '@/contexts/property-context'
import { getPusherClient } from '@/lib/pusher-client'

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { activePropertyId } = useProperty()
  const { mutate } = useSWRConfig()

  useEffect(() => {
    const pusher = getPusherClient()
    if (!pusher) return

    const channelName = activePropertyId && activePropertyId !== 'all' ? `admin-${activePropertyId}` : 'admin'
    
    // Unsubscribe from previous channels if re-running
    const channel = pusher.subscribe(channelName)
    const globalChannel = pusher.subscribe('global')

    const handleUpdate = () => {
      // Revalidate all API queries matching the current property scope
      mutate(
        (key) => Array.isArray(key) && key[0].startsWith('/api/'),
        undefined, 
        { revalidate: true }
      )
    }

    const events = [
      'admin.alert.new_booking',
      'booking.updated',
      'task.updated',
      'kpis.refresh',
      'room.status_changed',
      'inventory.availability_updated'
    ]

    events.forEach(event => {
      channel.bind(event, handleUpdate)
      globalChannel.bind(event, handleUpdate)
    })

    return () => {
      events.forEach(event => {
        channel.unbind(event, handleUpdate)
        globalChannel.unbind(event, handleUpdate)
      })
      pusher.unsubscribe(channelName)
      pusher.unsubscribe('global')
    }
  }, [activePropertyId, mutate])

  return <>{children}</>
}

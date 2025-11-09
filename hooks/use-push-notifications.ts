"use client"

import { useEffect, useState } from 'react'
import { showNotification, requestNotificationPermission, subscribeToPushNotifications, NotificationHelpers } from '@/lib/push-notifications'

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('Notification' in window && 'serviceWorker' in navigator)
      setPermission(Notification.permission)
      
      // Request permission on mount
      requestNotificationPermission().then(granted => {
        if (granted) {
          subscribeToPushNotifications().then(subscription => {
            setIsSubscribed(!!subscription)
          })
        }
      })
    }
  }, [])

  const notify = async (payload: Parameters<typeof showNotification>[0]) => {
    await showNotification(payload)
  }

  return {
    isSupported,
    isSubscribed,
    permission,
    notify,
    helpers: NotificationHelpers,
  }
}


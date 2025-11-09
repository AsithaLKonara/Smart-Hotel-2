// Push Notification Service
// Uses Web Push API for browser notifications

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Show browser notification
export async function showNotification(payload: NotificationPayload): Promise<void> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported')
    return
  }

  const hasPermission = await requestNotificationPermission()
  if (!hasPermission) {
    console.warn('Notification permission denied')
    return
  }

  const notificationOptions: NotificationOptions = {
    body: payload.body,
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    tag: payload.tag,
    data: payload.data,
    requireInteraction: payload.requireInteraction || false,
    // Note: actions are only supported in service worker notifications
    // For browser notifications, actions would need service worker
    ...(payload.actions && { actions: payload.actions as any }),
  }

  const notification = new Notification(payload.title, notificationOptions)

  notification.onclick = () => {
    window.focus()
    if (payload.data?.url) {
      window.location.href = payload.data.url
    }
    notification.close()
  }

  // Auto-close after 5 seconds unless requireInteraction is true
  if (!payload.requireInteraction) {
    setTimeout(() => {
      notification.close()
    }, 5000)
  }
}

// Subscribe to push notifications (for service worker)
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      ...(vapidKey && {
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource
      }),
    })

    // Send subscription to server
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    })

    return subscription
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    return null
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Notification helper for common scenarios
export const NotificationHelpers = {
  bookingConfirmed: (bookingCode: string) => ({
    title: 'Booking Confirmed! 🎉',
    body: `Your booking ${bookingCode} has been confirmed. Check your email for details.`,
    tag: 'booking-confirmed',
    data: { url: '/my-bookings', type: 'booking' },
  }),

  orderReady: (orderId: string) => ({
    title: 'Order Ready! 🍽️',
    body: `Your order #${orderId.substring(0, 8)} is ready for pickup.`,
    tag: 'order-ready',
    data: { url: '/order/tracking', type: 'order' },
    requireInteraction: true,
  }),

  newMessage: (sender: string) => ({
    title: 'New Message',
    body: `You have a new message from ${sender}`,
    tag: 'chat-message',
    data: { url: '/', type: 'chat' },
  }),

  checkInReminder: (checkInDate: string) => ({
    title: 'Check-in Reminder',
    body: `Your check-in is tomorrow! Get ready for your stay.`,
    tag: 'checkin-reminder',
    data: { url: '/my-bookings', type: 'reminder' },
  }),
}


"use client"

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getPusherClient } from '@/lib/pusher-client'
import toast from 'react-hot-toast'
import React from 'react'

export interface RealtimeNotification {
  id: string
  type: string
  title: string
  message: string
  link?: string | null
  read: boolean
  createdAt: string
}

export function useRealtimeNotifications() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPollingActive, setIsPollingActive] = useState(false)
  
  // Track already seen/toasted notification IDs to prevent duplicates
  const toastedIds = useRef<Set<string>>(new Set())

  // Load initial notification set
  const fetchNotifications = async () => {
    if (!session) return
    try {
      const res = await fetch('/api/notifications').then(r => r.json()).catch(() => null)
      if (res && res.notifications) {
        const list = res.notifications as RealtimeNotification[]
        setNotifications(list)
        
        // Count unread records
        const unreads = list.filter(n => !n.read)
        setUnreadCount(unreads.length)

        // Initialize notified list on first load to prevent flooding the screen with old toasts
        if (toastedIds.current.size === 0) {
          list.forEach(n => toastedIds.current.add(n.id))
        } else {
          // Toast any new arrivals
          unreads.forEach(n => {
            if (!toastedIds.current.has(n.id)) {
              toastedIds.current.add(n.id)
              triggerToast(n)
            }
          })
        }
      }
    } catch (err) {
      console.warn('Unable to synchronize notifications stream:', err)
    }
  }

  // Beautiful custom quick-action toaster
  const triggerToast = (n: RealtimeNotification) => {
    let icon = '🔔'
    if (n.type === 'booking') icon = '🔑'
    if (n.type === 'system') icon = '🚨'
    if (n.type === 'task') icon = '🧹'

    toast((t) => (
      <div className="flex flex-col gap-1.5 p-0.5 max-w-sm">
        <div className="flex items-start gap-2">
          <span className="text-xl mt-0.5">{icon}</span>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
          </div>
        </div>
        
        {n.link && (
          <div className="flex justify-end gap-2 mt-2 border-t border-gray-100 pt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id)
                window.location.href = n.link || '#'
              }}
              className="text-[10px] uppercase tracking-wider font-extrabold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-sm border border-purple-100 transition-colors"
            >
              Action Desk
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-[10px] uppercase tracking-wider font-extrabold text-gray-500 hover:text-gray-700 px-2.5 py-1"
            >
              Close
            </button>
          </div>
        )}
      </div>
    ), {
      duration: 5000,
      style: {
        background: '#ffffff',
        borderLeft: '4px solid #8b5cf6',
        borderRadius: '8px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        padding: '12px'
      }
    })
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      toast.success('All notification streams cleared.')
    } catch (err) {
      console.error(err)
    }
  }

  // Setup listeners
  useEffect(() => {
    if (!session?.user?.id) return

    fetchNotifications()

    // 1. Get Shared Pusher Client
    const pusher = getPusherClient()
    const userChannel = pusher.subscribe(`user-${session.user.id}`)
    
    setIsPollingActive(false)
    
    const handleNotification = (notif: any) => {
      // Handle both raw notification objects and the new wrapped event payload
      const typedNotif = notif.bookingId ? notif : notif
      if (typedNotif && !toastedIds.current.has(typedNotif.id)) {
        toastedIds.current.add(typedNotif.id)
        setNotifications(prev => [typedNotif, ...prev])
        setUnreadCount(c => c + 1)
        triggerToast(typedNotif)
      }
    }

    userChannel.bind('notification.received', handleNotification)
    userChannel.bind('admin.alert.new_booking', handleNotification)

    return () => {
      userChannel.unbind_all()
      pusher.unsubscribe(`user-${session.user.id}`)
    }
  }, [session])

  return {
    notifications,
    unreadCount,
    isPollingActive,
    markAllAsRead,
    refresh: fetchNotifications
  }
}

"use client"

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getPusherClient } from '@/lib/pusher-client'
import toast from 'react-hot-toast'

export interface ConnectedStaff {
  id: string
  name: string
  email: string
  role: string
  connectedAt: string
}

export interface CollabMessage {
  id: string
  channel: string
  senderId: string
  senderName: string
  senderRole: string
  text: string
  priority: 'low' | 'normal' | 'high'
  readBy: string[]
  createdAt: string
  isPending?: boolean
}

export function useRealtimeCollaboration(activeChannel: string) {
  const { data: session } = useSession()
  const [onlineStaff, setOnlineStaff] = useState<ConnectedStaff[]>([])
  const [messages, setMessages] = useState<CollabMessage[]>([
    {
      id: "seed-msg-1",
      channel: "reception-housekeeping",
      senderId: "receptionist-id",
      senderName: "Amanda Reception Desk",
      senderRole: "RECEPTIONIST",
      text: "Suite 302 checking out now. VIP guest. Initiating deep clean auto-trigger.",
      priority: "high",
      readBy: ["housekeeper-id"],
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    }
  ])
  
  const [typingStaff, setTypingStaff] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return

    const pusher = getPusherClient()
    
    // 1. Subscribe to Presence Channel for Online Staff
    const presenceChannel = pusher.subscribe('presence-staff') as any
    
    presenceChannel.bind('pusher:subscription_succeeded', (members: any) => {
      setIsConnected(true)
      const roster: ConnectedStaff[] = []
      members.each((member: any) => roster.push(member.info))
      setOnlineStaff(roster)
    })

    presenceChannel.bind('pusher:member_added', (member: any) => {
      setOnlineStaff(prev => [...prev, member.info])
    })

    presenceChannel.bind('pusher:member_removed', (member: any) => {
      setOnlineStaff(prev => prev.filter(m => m.id !== member.id))
    })

    // 2. Subscribe to Messages & Typing
    const collabChannel = pusher.subscribe(`collab-${activeChannel}`)

    collabChannel.bind('message', (msg: CollabMessage) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })

    collabChannel.bind('client-typing', (data: { name: string, typing: boolean }) => {
      setTypingStaff(prev => {
        if (data.typing) return [...new Set([...prev, data.name])]
        return prev.filter(n => n !== data.name)
      })
    })

    return () => {
      presenceChannel.unbind_all()
      collabChannel.unbind_all()
      pusher.unsubscribe('presence-staff')
      pusher.unsubscribe(`collab-${activeChannel}`)
    }
  }, [session, activeChannel])

  const setLocalTyping = (isTyping: boolean) => {
    const pusher = getPusherClient()
    const collabChannel = pusher.channel(`collab-${activeChannel}`)
    if (collabChannel) {
      collabChannel.trigger('client-typing', {
        name: session?.user?.name || 'Operator',
        typing: isTyping
      })
    }
  }

  const dispatchMessage = async (text: string, priority: 'low' | 'normal' | 'high' = 'normal') => {
    if (!session?.user) return

    const newMsg: CollabMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      channel: activeChannel,
      senderId: session.user.id,
      senderName: session.user.name || 'Operator',
      senderRole: (session.user as any).role || 'STAFF',
      text,
      priority,
      readBy: [session.user.id],
      createdAt: new Date().toISOString()
    }

    try {
      // In a real app, we'd POST to an API that then triggers Pusher
      await fetch('/api/collab/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      })
    } catch (err) {
      setMessages(prev => [...prev, { ...newMsg, isPending: true }])
      toast.error('Failed to sync message.')
    }
  }

  return {
    onlineStaff,
    messages: messages.filter(m => m.channel === activeChannel),
    typingStaff,
    isConnected,
    dispatchMessage,
    setLocalTyping
  }
}

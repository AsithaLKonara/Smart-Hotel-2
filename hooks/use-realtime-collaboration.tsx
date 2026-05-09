"use client"

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from '@/hooks/use-socket'
import toast from 'react-hot-toast'

export interface ConnectedStaff {
  id: string
  name: string
  email: string
  role: string
  socketId: string
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
  const { socket, isConnected } = useSocket()
  
  const [onlineStaff, setOnlineStaff] = useState<ConnectedStaff[]>([])
  const [messages, setMessages] = useState<CollabMessage[]>([
    // Initial baseline seeds to feel immediately lived-in
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
    },
    {
      id: "seed-msg-2",
      channel: "reception-housekeeping",
      senderId: "housekeeper-id",
      senderName: "John Housekeeping Lead",
      senderRole: "HOUSEKEEPER",
      text: "On it! Assigning Sarah to Suite 302 right away.",
      priority: "normal",
      readBy: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
    },
    {
      id: "seed-msg-3",
      channel: "reception-kitchen",
      senderId: "receptionist-id",
      senderName: "Amanda Reception Desk",
      senderRole: "RECEPTIONIST",
      text: "VIP Room 405 order escalating: Peanut Allergy confirmed.",
      priority: "high",
      readBy: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString()
    }
  ])
  
  const [typingState, setTypingState] = useState<{ [userId: string]: string | null }>({})
  const offlineQueue = useRef<CollabMessage[]>([])

  useEffect(() => {
    if (!session || !socket) return

    // 1. Join administrative chat stream
    socket.emit('joinAdminRoom')

    // Register self in presence roster
    socket.emit('updatePresence', {
      id: session.user?.email || `user-${Date.now()}`,
      name: session.user?.name || 'Hotel Operator',
      email: session.user?.email || 'operator@smarthotel.com',
      role: (session as any).user?.role || 'OPERATIONS'
    })

    // 2. Presence tracking listener
    const handlePresenceUpdate = (roster: ConnectedStaff[]) => {
      setOnlineStaff(roster)
    }

    // 3. Typing status listener
    const handleStaffTyping = (data: { userId: string; name: string; channel: string; typing: boolean }) => {
      if (data.channel === activeChannel) {
        setTypingState(prev => ({
          ...prev,
          [data.userId]: data.typing ? data.name : null
        }))
      }
    }

    // 4. Message sync listener
    const handleOpsMessage = (msg: CollabMessage) => {
      setMessages(prev => {
        // Prevent duplicate append
        if (prev.some(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    }

    socket.on('presenceUpdate', handlePresenceUpdate)
    socket.on('staffTyping', handleStaffTyping as any)
    socket.on('opsMessageReceived', handleOpsMessage as any)

    return () => {
      socket.emit('leaveAdminRoom')
      socket.off('presenceUpdate', handlePresenceUpdate)
      socket.off('staffTyping', handleStaffTyping as any)
      socket.off('opsMessageReceived', handleOpsMessage as any)
    }
  }, [session, socket, activeChannel])

  // Outage reconnect recovery worker
  useEffect(() => {
    if (isConnected && socket && offlineQueue.current.length > 0) {
      console.log(`🔌 WebSockets restored. Replaying ${offlineQueue.current.length} cached operations...`)
      toast.success(`Connection restored! Syncing offline operations queue.`, { icon: '⚡' })
      
      offlineQueue.current.forEach(msg => {
        socket.emit('sendOpsMessage', { ...msg, isPending: false })
      })
      offlineQueue.current = []
    }
  }, [isConnected, socket])

  // Emit typing state
  const setLocalTyping = (isTyping: boolean) => {
    if (socket && session) {
      socket.emit('setTypingState', {
        userId: session.user?.email || 'operator',
        name: session.user?.name || 'Hotel Operator',
        channel: activeChannel,
        typing: isTyping
      })
    }
  }

  // Dispatch live communication messages
  const dispatchMessage = (text: string, priority: 'low' | 'normal' | 'high' = 'normal') => {
    if (!session) return

    const newMsg: CollabMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      channel: activeChannel,
      senderId: session.user?.email || 'operator-id',
      senderName: session.user?.name || 'Hotel Operator',
      senderRole: (session as any).user?.role || 'OPERATIONS',
      text,
      priority,
      readBy: [session.user?.email || 'operator-id'],
      createdAt: new Date().toISOString()
    }

    if (isConnected && socket) {
      socket.emit('sendOpsMessage', newMsg)
      
      // Post a dynamic event trigger for our Unified Timeline
      socket.emit('triggerTimelineEvent', {
        id: `evt-${Date.now()}`,
        category: "COLLABORATION",
        title: `${newMsg.senderName} (${newMsg.senderRole}) dispatched high-priority note`,
        message: text,
        severity: priority === 'high' ? 'warning' : 'info',
        timestamp: new Date().toISOString()
      })

    } else {
      // Outage/Chaos cached fallback state
      newMsg.isPending = true
      offlineQueue.current.push(newMsg)
      setMessages(prev => [...prev, newMsg])
      toast('System disconnected. Note cached in SRE recovery queue.', { icon: '💾' })
    }
  }

  return {
    onlineStaff,
    messages: messages.filter(m => m.channel === activeChannel),
    typingStaff: Object.values(typingState).filter(Boolean) as string[],
    isConnected,
    dispatchMessage,
    setLocalTyping
  }
}

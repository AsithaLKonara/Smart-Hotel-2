"use client"

import { useEffect, useState } from 'react'

type SocketInstance = Awaited<ReturnType<typeof import('socket.io-client')['io']>>

export function useSocket() {
  const [socket, setSocket] = useState<SocketInstance | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let isMounted = true
    let socketInstance: SocketInstance | null = null

    const connect = async () => {
      try {
        await fetch('/api/socket')
        const { io } = await import('socket.io-client')

        if (!isMounted) {
          return
        }

        socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
          transports: ['websocket', 'polling']
        })

        socketInstance.on('connect', () => setIsConnected(true))
        socketInstance.on('disconnect', () => setIsConnected(false))

        setSocket(socketInstance)
      } catch (error) {
        console.error('Failed to initialize socket connection:', error)
      }
    }

    connect()

    return () => {
      isMounted = false
      if (socketInstance) {
        socketInstance.close()
      }
    }
  }, [])

  return { socket, isConnected }
}


"use client"

import { usePathname } from 'next/navigation'
import { ChatWidget } from './chat-widget'

export function ChatWrapper() {
  const pathname = usePathname()
  
  // Hide the chatbot on all dashboard/admin routes
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/kitchen') ||
    pathname.startsWith('/reception') ||
    pathname.startsWith('/dashboard')
  ) {
    return null
  }

  return <ChatWidget />
}


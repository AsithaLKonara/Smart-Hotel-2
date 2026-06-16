"use client"

import { usePathname } from 'next/navigation'
import HotelFooter from '@/components/hotel-footer'

export default function ConditionalFooter() {
  const pathname = usePathname()
  
  const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '')
  
  // Hide footer on dashboard and admin routes
  const isDashboardRoute = currentPath.startsWith('/dashboard') || 
                          currentPath.startsWith('/admin') || 
                          currentPath.startsWith('/kitchen') ||
                          currentPath.startsWith('/reception') ||
                          currentPath.startsWith('/profile') ||
                          currentPath.startsWith('/my-bookings')
  
  if (isDashboardRoute) {
    return null
  }
  
  return <HotelFooter />
}


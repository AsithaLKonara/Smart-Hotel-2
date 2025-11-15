"use client"

import { usePathname } from 'next/navigation'
import HotelFooter from '@/components/hotel-footer'

export default function ConditionalFooter() {
  const pathname = usePathname()
  
  // Hide footer on dashboard and admin routes
  const isDashboardRoute = pathname?.startsWith('/dashboard') || 
                          pathname?.startsWith('/admin') || 
                          pathname?.startsWith('/kitchen')
  
  if (isDashboardRoute) {
    return null
  }
  
  return <HotelFooter />
}


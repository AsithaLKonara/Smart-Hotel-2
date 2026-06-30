'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useHotkeys() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return
      }

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'c': // Alt+C -> Check-in
            e.preventDefault()
            router.push('/admin/receptionist')
            break
          case 'f': // Alt+F -> Folios
            e.preventDefault()
            router.push('/admin/accounting/invoices')
            break
          case 'h': // Alt+H -> Housekeeping
            e.preventDefault()
            router.push('/admin/housekeeping')
            break
          case 'b': // Alt+B -> Bookings
            e.preventDefault()
            router.push('/admin/bookings')
            break
          case 'n': // Alt+N -> New Reservation
            e.preventDefault()
            router.push('/admin/bookings?action=new')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])
}

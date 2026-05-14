"use client"

import { useSession } from 'next-auth/react'
import { OrderPortal } from '@/components/ordering/order-portal'
import { PremiumSpinner } from '@/components/ui/premium-spinner'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function OrderPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0c0714] flex items-center justify-center">
        <PremiumSpinner size="lg" text="Syncing gourmet menu..." />
      </div>
    )
  }

  if (!session) return null

  // In a real production app, room number would be resolved from the guest's active booking
  // For this elite refactor, we'll assume '101' if not explicitly linked yet, but personalized with guest name
  const roomNumber = '101' 
  const guestInfo = {
    name: session.user.name || 'Valued Guest',
    phone: (session.user as any).phone || '',
    bookingId: session.user.id // Using user ID as fallback for demo stability
  }

  return (
    <div className="min-h-screen bg-[#0c0714]">
      <OrderPortal
        roomNumber={roomNumber}
        guestInfo={guestInfo}
      />
    </div>
  )
}

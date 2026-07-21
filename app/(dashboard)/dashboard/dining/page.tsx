"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DiningModule } from '@/components/dashboard/guest/dining-module'
import { GuestPageShell } from '@/components/dashboard/guest/guest-page-shell'
import { PremiumSpinner } from '@/components/ui/premium-spinner'

export default function DiningDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['my-active-booking'],
    queryFn: async () => {
      const res = await fetch('/api/bookings?status=CHECKED_IN')
      return res.json()
    },
    enabled: !!session
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading' || (status === 'authenticated' && bookingsLoading)) {
    return (
      <div className="flex items-center justify-center py-20">
        <PremiumSpinner size="lg" text="Arranging your culinary experience..." />
      </div>
    )
  }

  if (!session) return null

  const activeBooking = bookingsData?.bookings?.[0]
  const roomNumber = activeBooking?.room?.number || '101' 
  const guestInfo = {
    name: session.user.name || 'Valued Guest',
    phone: (session.user as any).phone || '',
    bookingId: activeBooking?.id || session.user.id
  }

  return (
    <GuestPageShell
      title="Dining & Bar"
      subtitle="From handcrafted cocktails to Michelin-starred dining, experience culinary excellence delivered to your suite or reserved at our finest venues."
      firstName={session.user.name?.split(' ')[0]}
    >
      <DiningModule 
        roomNumber={roomNumber}
        guestInfo={guestInfo}
      />
    </GuestPageShell>
  )
}
